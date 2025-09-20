import { useState, useEffect, useCallback } from "react";
import { webrtcService, CallData } from "../services/webrtcService";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { messagingApi } from "../redux/features/messagingApi";

export interface UseAudioCallReturn {
  isCallActive: boolean;
  currentCall: CallData | null;
  isCallInterfaceOpen: boolean;
  startCall: (
    calleeId: number,
    calleeInfo: {
      username: string;
      displayName: string;
      avatar?: { url: string } | null;
    },
    isVideo?: boolean,
    conversationId?: number
  ) => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  muteAudio: (muted: boolean) => void;
  setSpeaker: (speaker: boolean) => void;
  toggleVideo: (video: boolean) => void;
  openCallInterface: () => void;
  closeCallInterface: () => void;
  callError: string | null;
  isCallConnected: boolean;
}

export const useAudioCall = (): UseAudioCallReturn => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentCall, setCurrentCall] = useState<CallData | null>(null);
  const [isCallInterfaceOpen, setIsCallInterfaceOpen] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [isCallConnected, setIsCallConnected] = useState(false);

  // Debug state changes
  useEffect(() => {
    console.log("🔍 isCallConnected state changed to:", isCallConnected);
  }, [isCallConnected]);

  const currentUser = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  // Function to create call log message
  const createCallLogMessage = useCallback(
    async (
      conversationId: number,
      callData: CallData,
      status: "answered" | "missed" | "rejected" | "ended",
      duration: number = 0
    ) => {
      try {
        // Calculate duration if call was active
        let calculatedDuration = duration;
        if (callStartTime && (status === "answered" || status === "ended")) {
          calculatedDuration = Math.floor((Date.now() - callStartTime) / 1000);
        }

        const callLogMessage = {
          conversationId,
          content: `Call ${status}`,
          type: "CALL_LOG",
          callData: {
            ...callData,
            status,
            duration: calculatedDuration,
          },
        };

        console.log("Creating call log message:", callLogMessage);

        // Save to database via API
        const result = await messagingApi.endpoints.sendMessage
          .initiate(callLogMessage)
          .unwrap();

        console.log("Call log message created successfully:", result);

        // Invalidate messages cache to refresh the UI
        dispatch(
          messagingApi.util.invalidateTags([
            { type: "Message", id: conversationId },
            { type: "Conversation", id: conversationId },
          ])
        );

        // Also invalidate conversations to update unread count
        dispatch(messagingApi.util.invalidateTags(["Conversation"]));
      } catch (error) {
        console.error("Failed to create call log message:", error);
      }
    },
    [callStartTime, dispatch]
  );

  const handleCallEnd = useCallback(() => {
    setIsCallActive(false);
    setCurrentCall(null);
    setIsCallInterfaceOpen(false);
    setCallError(null);
    setCallStartTime(null);
    setIsCallConnected(false);
  }, []);

  // Initialize WebRTC service
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    console.log(
      "Initializing WebRTC service with token:",
      token ? "present" : "missing"
    );
    if (token) {
      try {
        webrtcService.initialize(token);
        console.log("WebRTC service initialized successfully");
        console.log("WebRTC service socket:", webrtcService.socket);
        console.log(
          "WebRTC service peer connection:",
          webrtcService.peerConnection
        );

        // Add a small delay to ensure initialization is complete
        setTimeout(() => {
          console.log("WebRTC service ready for calls");
        }, 1000);
      } catch (error) {
        console.error("Failed to initialize WebRTC service:", error);
        setCallError("Failed to initialize call service");
      }
    } else {
      console.error("No token found in localStorage");
      setCallError("No authentication token found");
    }

    return () => {
      webrtcService.cleanup();
    };
  }, []);

  // Setup event listeners
  useEffect(() => {
    console.log("🔧 Setting up WebRTC callbacks in useAudioCall");

    webrtcService.onCallReceived((callData: CallData) => {
      console.log("Call received in useAudioCall hook:", callData);
      console.log("Caller info:", callData.caller);
      console.log("Caller avatar:", callData.caller.avatar);
      console.log("Callee info:", callData.callee);
      console.log("Incoming call conversationId:", callData.conversationId);
      setCurrentCall(callData);
      setIsCallActive(true);
      setIsCallInterfaceOpen(true); // Open call interface globally
      setCallError(null);

      // Create call log message for incoming call
      if (callData.conversationId) {
        console.log(
          "Creating call log for incoming call with conversationId:",
          callData.conversationId
        );
        createCallLogMessage(
          callData.conversationId,
          callData,
          "answered" // Mark as answered for incoming call
        );
      } else {
        console.log(
          "No conversationId in incoming call data, cannot create call log"
        );
      }
    });

    webrtcService.onCallAnswered((callId: string) => {
      setCurrentCall((prev) => {
        if (prev?.id === callId) {
          const updatedCall = { ...prev, status: "ongoing" };
          setCallStartTime(Date.now()); // Start tracking call duration
          // Create call log message for answered call
          if (prev.conversationId) {
            createCallLogMessage(prev.conversationId, updatedCall, "answered");
          }
          return updatedCall;
        }
        return prev;
      });

      // Also set connection status for sender side
      console.log("Call answered, setting isCallConnected to true for sender");
      setIsCallConnected(true);

      // Add a backup timeout to ensure connection status is set
      setTimeout(() => {
        console.log(
          "Backup: Ensuring sender side shows connected after call answered"
        );
        setIsCallConnected(true);
      }, 2000);
    });

    webrtcService.onCallRejected((callId: string) => {
      setCurrentCall((prev) => {
        if (prev?.id === callId) {
          // Create call log message for rejected call
          if (prev.conversationId) {
            createCallLogMessage(prev.conversationId, prev, "rejected");
          }
          handleCallEnd();
        }
        return prev;
      });
    });

    webrtcService.onCallEnded((callId: string) => {
      setCurrentCall((prev) => {
        if (prev?.id === callId) {
          // Create call log message for ended call
          if (prev.conversationId) {
            createCallLogMessage(prev.conversationId, prev, "ended");
          }
          handleCallEnd();
        }
        return prev;
      });
    });

    webrtcService.onCallError((error: string) => {
      setCallError(error);
      console.error("Call error:", error);
    });

    webrtcService.onCallConnected((callId: string) => {
      console.log("🎉 CALL CONNECTED CALLBACK TRIGGERED:", callId);
      console.log("Setting isCallConnected to true");
      setIsCallConnected(true);
      setCallError(null);

      // Ensure call status is set to ongoing when connected
      setCurrentCall((prev) => {
        if (prev?.id === callId) {
          console.log("Updating call status to ongoing for callId:", callId);
          return { ...prev, status: "ongoing" };
        }
        console.log(
          "Call ID mismatch - current:",
          prev?.id,
          "connected:",
          callId
        );
        return prev;
      });
    });

    // Add a test to force connection after 5 seconds for debugging
    setTimeout(() => {
      console.log("🧪 TEST: Forcing call connected after 5 seconds");
      console.log(
        "🧪 TEST: Current isCallConnected state before:",
        isCallConnected
      );
      setIsCallConnected(true);
      console.log("🧪 TEST: Set isCallConnected to true");
      setCurrentCall((prev) => {
        if (prev) {
          console.log("🧪 TEST: Updating call status to ongoing");
          return { ...prev, status: "ongoing" };
        }
        console.log("🧪 TEST: No current call to update");
        return prev;
      });
    }, 5000);

    // Listen for test event
    const handleTestConnection = () => {
      console.log("🧪 TEST: Received test connection event");
      setIsCallConnected(true);
      setCurrentCall((prev) => {
        if (prev) {
          console.log(
            "🧪 TEST: Updating call status to ongoing via test event"
          );
          return { ...prev, status: "ongoing" };
        }
        return prev;
      });
    };

    window.addEventListener("test-call-connected", handleTestConnection);

    return () => {
      window.removeEventListener("test-call-connected", handleTestConnection);
    };
  }, [createCallLogMessage, handleCallEnd]);

  const startCall = useCallback(
    async (
      calleeId: number,
      calleeInfo: {
        username: string;
        displayName: string;
        avatar?: { url: string } | null;
      },
      isVideo: boolean = false,
      conversationId?: number
    ) => {
      try {
        console.log("useAudioCall startCall called");
        console.log("Starting call to calleeId:", calleeId, "Video:", isVideo);
        console.log("Callee info:", calleeInfo);
        console.log("ConversationId:", conversationId);

        // Check if WebRTC service is initialized
        if (!webrtcService.isInitialized) {
          console.error("WebRTC service not initialized, cannot start call");
          setCallError("Call service not ready. Please try again.");
          return;
        }

        setCallError(null);
        const callId = await webrtcService.startCall(calleeId, isVideo);
        console.log("Call ID generated:", callId);

        // Add a timeout for outgoing calls to force connection status
        setTimeout(() => {
          console.log("Outgoing call timeout: Forcing connection status");
          setIsCallConnected(true);
        }, 10000); // 10 seconds timeout for outgoing calls

        const callData: CallData = {
          id: callId,
          caller: {
            id: currentUser.id,
            username: currentUser.username,
            displayName: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar,
          },
          callee: {
            id: calleeId,
            username: calleeInfo.username,
            displayName: calleeInfo.displayName,
            avatar: calleeInfo.avatar,
          },
          type: "outgoing",
          status: "ringing",
          isVideo: isVideo,
          conversationId: conversationId,
        };

        console.log("Setting call data:", callData);
        console.log("Is video call:", isVideo);
        console.log("Call data isVideo property:", callData.isVideo);
        console.log("ConversationId for call log:", conversationId);
        setCurrentCall(callData);
        setIsCallActive(true);
        setIsCallInterfaceOpen(true);

        // Create initial call log message when call is made
        if (conversationId) {
          console.log(
            "Creating call log for outgoing call with conversationId:",
            conversationId
          );
          createCallLogMessage(
            conversationId,
            callData,
            "answered" // Mark as answered since we're initiating the call
          );
        } else {
          console.log("No conversationId provided, cannot create call log");
        }
      } catch (error) {
        setCallError("Failed to start call");
        console.error("Error starting call:", error);
      }
    },
    [currentUser]
  );

  const answerCall = useCallback(async () => {
    if (!currentCall) return;

    try {
      setCallError(null);
      await webrtcService.answerCall(currentCall.id);
      setCurrentCall((prev) => (prev ? { ...prev, status: "ongoing" } : null));
    } catch (error) {
      setCallError("Failed to answer call");
      console.error("Error answering call:", error);
    }
  }, [currentCall]);

  const rejectCall = useCallback(async () => {
    if (!currentCall) return;

    try {
      await webrtcService.rejectCall(currentCall.id);
      handleCallEnd();
    } catch (error) {
      setCallError("Failed to reject call");
      console.error("Error rejecting call:", error);
    }
  }, [currentCall, handleCallEnd]);

  const endCall = useCallback(async () => {
    if (!currentCall) return;

    try {
      await webrtcService.endCall(currentCall.id);
      handleCallEnd();
    } catch (error) {
      setCallError("Failed to end call");
      console.error("Error ending call:", error);
    }
  }, [currentCall, handleCallEnd]);

  const muteAudio = useCallback((muted: boolean) => {
    webrtcService.muteAudio(muted);
  }, []);

  const setSpeaker = useCallback((speaker: boolean) => {
    webrtcService.setSpeaker(speaker);
  }, []);

  const toggleVideo = useCallback((video: boolean) => {
    webrtcService.toggleVideo(video);
  }, []);

  const openCallInterface = useCallback(() => {
    setIsCallInterfaceOpen(true);
  }, []);

  const closeCallInterface = useCallback(() => {
    setIsCallInterfaceOpen(false);
    if (currentCall?.status === "ringing") {
      rejectCall();
    }
  }, [currentCall, rejectCall]);

  return {
    isCallActive,
    currentCall,
    isCallInterfaceOpen,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    muteAudio,
    setSpeaker,
    toggleVideo,
    openCallInterface,
    closeCallInterface,
    callError,
    isCallConnected,
  };
};
