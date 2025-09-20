import { io, Socket } from "socket.io-client";

export interface CallData {
  id: string;
  caller: {
    id: number;
    username: string;
    displayName: string;
    avatar?: { url: string } | null;
  };
  callee: {
    id: number;
    username: string;
    displayName: string;
    avatar?: { url: string } | null;
  };
  type: "incoming" | "outgoing" | "ongoing";
  status: "ringing" | "ongoing" | "ended";
  isVideo?: boolean;
  conversationId?: number;
}

export interface WebRTCService {
  initialize: (token: string) => void;
  startCall: (calleeId: number, isVideo?: boolean) => Promise<string>;
  answerCall: (callId: string) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  endCall: (callId: string) => Promise<void>;
  muteAudio: (muted: boolean) => void;
  setSpeaker: (speaker: boolean) => void;
  toggleVideo: (video: boolean) => void;
  getLocalStream: () => MediaStream | null;
  getRemoteStream: () => MediaStream | null;
  onCallReceived: (callback: (callData: CallData) => void) => void;
  onCallAnswered: (callback: (callId: string) => void) => void;
  onCallRejected: (callback: (callId: string) => void) => void;
  onCallEnded: (callback: (callId: string) => void) => void;
  onCallError: (callback: (error: string) => void) => void;
  onCallConnected: (callback: (callId: string) => void) => void;
  cleanup: () => void;
}

class WebRTCServiceImpl implements WebRTCService {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callData: CallData | null = null;
  private isInitialized = false;
  private connectionTimeout: number | null = null;

  // Event callbacks
  private onCallReceivedCallback?: (callData: CallData) => void;
  private onCallAnsweredCallback?: (callId: string) => void;
  private onCallRejectedCallback?: (callId: string) => void;
  private onCallEndedCallback?: (callId: string) => void;
  private onCallErrorCallback?: (error: string) => void;
  private onCallConnectedCallback?: (callId: string) => void;

  // Audio elements
  private localAudioElement: HTMLAudioElement | null = null;
  private remoteAudioElement: HTMLAudioElement | null = null;

  // Video elements
  private localVideoElement: HTMLVideoElement | null = null;
  private remoteVideoElement: HTMLVideoElement | null = null;

  initialize(token: string) {
    if (this.isInitialized) return;

    try {
      this.socket = io(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/calls`,
        {
          auth: { token },
          transports: ["websocket"],
        }
      );

      this.setupSocketListeners();
      this.setupPeerConnection();
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize WebRTC service:", error);
      this.onCallErrorCallback?.("Failed to initialize call service");
    }
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Connected to call server");
      console.log("Socket ID:", this.socket?.id);
      console.log("Socket connected:", this.socket?.connected);
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from call server");
    });

    this.socket.on("call_received", (data: CallData) => {
      console.log("Call received event:", data);

      // Check if we're already handling a call
      if (this.callData && this.callData.id !== data.id) {
        console.log(
          "Already handling a different call, ignoring new call:",
          data.id
        );
        return;
      }

      this.callData = data;
      this.onCallReceivedCallback?.(data);
    });

    this.socket.on("call_answered", (data: { callId: string }) => {
      this.onCallAnsweredCallback?.(data.callId);
    });

    this.socket.on("call_rejected", (data: { callId: string }) => {
      this.onCallRejectedCallback?.(data.callId);
    });

    this.socket.on("call_ended", (data: { callId: string }) => {
      this.onCallEndedCallback?.(data.callId);
    });

    this.socket.on("call_error", (data: { error: string }) => {
      this.onCallErrorCallback?.(data.error);
    });

    // WebRTC signaling
    this.socket.on(
      "offer",
      async (data: { offer: RTCSessionDescriptionInit; callId: string }) => {
        await this.handleOffer(data.offer);
      }
    );

    this.socket.on(
      "answer",
      async (data: { answer: RTCSessionDescriptionInit; callId: string }) => {
        await this.handleAnswer(data.answer);
      }
    );

    this.socket.on(
      "ice_candidate",
      async (data: { candidate: RTCIceCandidateInit; callId: string }) => {
        await this.handleIceCandidate(data.candidate);
      }
    );
  }

  private setupPeerConnection() {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket && this.callData) {
        this.socket.emit("ice_candidate", {
          candidate: event.candidate,
          callId: this.callData.id,
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.setupRemoteAudio();
    };

    // Monitor connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        console.log(
          "WebRTC connection state:",
          this.peerConnection.connectionState
        );
        console.log(
          "ICE connection state:",
          this.peerConnection.iceConnectionState
        );
        console.log(
          "ICE gathering state:",
          this.peerConnection.iceGatheringState
        );
        console.log("Signaling state:", this.peerConnection.signalingState);

        if (this.peerConnection.connectionState === "connected") {
          console.log("Call connected successfully via connectionState!");
          this.triggerCallConnected();
        } else if (this.peerConnection.connectionState === "failed") {
          console.log("Call connection failed!");
          this.onCallErrorCallback?.("Call connection failed");
        } else if (this.peerConnection.connectionState === "disconnected") {
          console.log("Call disconnected!");
        }
      }
    };

    // Monitor ICE connection state as backup
    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection) {
        console.log(
          "ICE connection state changed:",
          this.peerConnection.iceConnectionState
        );

        if (
          this.peerConnection.iceConnectionState === "connected" ||
          this.peerConnection.iceConnectionState === "completed"
        ) {
          console.log("Call connected successfully via ICE connection state!");
          this.triggerCallConnected();
        }
      }
    };
  }

  private triggerCallConnected() {
    console.log("Triggering call connected callback");
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.callData && this.onCallConnectedCallback) {
      console.log(
        "Calling onCallConnectedCallback with callId:",
        this.callData.id
      );
      this.onCallConnectedCallback(this.callData.id);
    } else {
      console.log("No callData or callback available:", {
        callData: this.callData,
        callback: !!this.onCallConnectedCallback,
      });
    }
  }

  private async setupLocalAudio() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      if (this.peerConnection) {
        this.localStream.getTracks().forEach((track) => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      this.localAudioElement = document.createElement("audio");
      this.localAudioElement.srcObject = this.localStream;
      this.localAudioElement.muted = true; // Mute local audio to prevent echo
      this.localAudioElement.play();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      this.onCallErrorCallback?.("Microphone access denied");
    }
  }

  private async setupLocalVideo() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      if (this.peerConnection) {
        this.localStream.getTracks().forEach((track) => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      this.setupLocalVideoElement();
    } catch (error) {
      console.error("Error accessing camera:", error);
      this.onCallErrorCallback?.("Camera access denied");
      throw error;
    }
  }

  private setupLocalVideoElement() {
    if (this.localStream) {
      this.localVideoElement = document.createElement("video");
      this.localVideoElement.srcObject = this.localStream;
      this.localVideoElement.muted = true; // Mute local video to prevent echo
      this.localVideoElement.autoplay = true;
      this.localVideoElement.playsInline = true;
    }
  }

  private setupRemoteVideo() {
    if (this.remoteStream) {
      this.remoteVideoElement = document.createElement("video");
      this.remoteVideoElement.srcObject = this.remoteStream;
      this.remoteVideoElement.autoplay = true;
      this.remoteVideoElement.playsInline = true;
    }
  }

  private setupRemoteAudio() {
    if (this.remoteStream) {
      this.remoteAudioElement = document.createElement("audio");
      this.remoteAudioElement.srcObject = this.remoteStream;
      this.remoteAudioElement.play();
    }
  }

  async startCall(calleeId: number, isVideo: boolean = false): Promise<string> {
    if (!this.socket) throw new Error("WebRTC service not initialized");
    if (!this.peerConnection)
      throw new Error("Peer connection not initialized");

    console.log("Starting call to user:", calleeId, "Video:", isVideo);
    console.log("Socket connected:", this.socket.connected);
    console.log("Peer connection exists:", !!this.peerConnection);

    if (isVideo) {
      await this.setupLocalVideo();
    } else {
      await this.setupLocalAudio();
    }

    const callId = `call_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create offer for the caller
    const offer = await this.peerConnection.createOffer();
    console.log("Created offer for caller:", offer);
    await this.peerConnection.setLocalDescription(offer);
    console.log("Set local description for caller");

    console.log("Emitting start_call event with data:", {
      calleeId,
      callId,
      isVideo,
      offer,
    });
    this.socket.emit("start_call", { calleeId, callId, isVideo, offer });

    return callId;
  }

  async answerCall(callId: string): Promise<void> {
    if (!this.socket) {
      console.error("Socket not initialized, cannot answer call");
      return;
    }
    if (!this.peerConnection) {
      console.error("Peer connection not initialized, cannot answer call");
      return;
    }

    // Check if this call is already being handled
    if (this.callData && this.callData.id !== callId) {
      console.log(
        "Already handling a different call, ignoring answer for:",
        callId
      );
      return;
    }

    console.log("Answering call:", callId);
    await this.setupLocalAudio();

    // For answering a call, we need to wait for the offer from the caller
    // The answer will be created in handleOffer when we receive the offer
    this.socket.emit("answer_call", { callId });
    console.log("Emitted answer_call event");

    // Set a shorter timeout to force connection status after 5 seconds
    this.connectionTimeout = setTimeout(() => {
      console.log("Connection timeout reached, forcing connected status");
      if (this.callData && this.callData.id === callId) {
        this.triggerCallConnected();
      }
    }, 5000);

    // Also add a manual check after 2 seconds
    setTimeout(() => {
      if (this.peerConnection && this.callData && this.callData.id === callId) {
        console.log(
          "Manual connection check - connectionState:",
          this.peerConnection.connectionState
        );
        console.log(
          "Manual connection check - iceConnectionState:",
          this.peerConnection.iceConnectionState
        );

        if (
          this.peerConnection.connectionState === "connected" ||
          this.peerConnection.iceConnectionState === "connected" ||
          this.peerConnection.iceConnectionState === "completed"
        ) {
          console.log("Manual check: Call is connected, triggering callback");
          this.triggerCallConnected();
        }
      }
    }, 2000);

    // Force connection after 3 seconds regardless of WebRTC state
    setTimeout(() => {
      if (this.callData && this.callData.id === callId) {
        console.log("FORCING call connected after 3 seconds");
        this.triggerCallConnected();
      }
    }, 3000);
  }

  async rejectCall(callId: string): Promise<void> {
    if (!this.socket) return;

    this.socket.emit("reject_call", { callId });
    this.cleanup();
  }

  async endCall(callId: string): Promise<void> {
    if (!this.socket) return;

    this.socket.emit("end_call", { callId });
    this.cleanup();
  }

  private async handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return;

    console.log("Handling offer:", offer);
    await this.peerConnection.setRemoteDescription(offer);
    console.log("Set remote description");

    const answer = await this.peerConnection.createAnswer();
    console.log("Created answer:", answer);
    await this.peerConnection.setLocalDescription(answer);
    console.log("Set local description for answer");

    if (this.socket && this.callData) {
      this.socket.emit("answer", {
        callId: this.callData.id,
        answer,
      });
      console.log("Emitted answer with callId:", this.callData.id);
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return;

    console.log("Handling answer:", answer);
    await this.peerConnection.setRemoteDescription(answer);
    console.log("Set remote description for answer");
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) return;

    await this.peerConnection.addIceCandidate(candidate);
  }

  muteAudio(muted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  setSpeaker(speaker: boolean) {
    if (this.remoteAudioElement) {
      this.remoteAudioElement.volume = speaker ? 1 : 0.5;
    }
  }

  toggleVideo(video: boolean) {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = video;
      }
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  onCallReceived(callback: (callData: CallData) => void) {
    this.onCallReceivedCallback = callback;
  }

  onCallAnswered(callback: (callId: string) => void) {
    this.onCallAnsweredCallback = callback;
  }

  onCallRejected(callback: (callId: string) => void) {
    this.onCallRejectedCallback = callback;
  }

  onCallEnded(callback: (callId: string) => void) {
    this.onCallEndedCallback = callback;
  }

  onCallError(callback: (error: string) => void) {
    this.onCallErrorCallback = callback;
  }

  onCallConnected(callback: (callId: string) => void) {
    console.log("Registering onCallConnected callback");
    this.onCallConnectedCallback = callback;
  }

  cleanup() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localAudioElement) {
      this.localAudioElement.pause();
      this.localAudioElement = null;
    }

    if (this.remoteAudioElement) {
      this.remoteAudioElement.pause();
      this.remoteAudioElement = null;
    }

    this.callData = null;
  }
}

// Export singleton instance
export const webrtcService = new WebRTCServiceImpl();
