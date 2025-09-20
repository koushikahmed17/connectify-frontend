import React, { useState, useRef, useEffect } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Users,
  Settings,
} from "lucide-react";
import {
  getAvatarUrl,
  handleAvatarError,
  getAvatarUrlFromString,
} from "../../utils/avatarUtils";

interface VideoCallInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  callData: {
    id: string;
    caller: {
      id: number;
      username: string;
      displayName: string;
      avatar?: {
        url: string;
      } | null;
    };
    callee: {
      id: number;
      username: string;
      displayName: string;
      avatar?: {
        url: string;
      } | null;
    };
    type: "incoming" | "outgoing" | "ongoing";
    status: "ringing" | "ongoing" | "ended";
  };
  onAnswer?: () => void;
  onReject?: () => void;
  onEnd?: () => void;
  onMute?: (muted: boolean) => void;
  onSpeaker?: (speaker: boolean) => void;
  onVideoToggle?: (video: boolean) => void;
}

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  isOpen,
  onClose,
  callData,
  onAnswer,
  onReject,
  onEnd,
  onMute,
  onSpeaker,
  onVideoToggle,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  const durationIntervalRef = useRef<number | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const ringingAudioRef = useRef<HTMLAudioElement | null>(null);

  // Connect video streams to WebRTC service
  useEffect(() => {
    if (localVideoRef.current && isOpen) {
      // Get the local video stream from WebRTC service
      const webrtcService = (window as any).webrtcService;
      if (webrtcService) {
        const localStream = webrtcService.getLocalStream();
        if (localStream) {
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current.play();
        }
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (remoteVideoRef.current && isOpen) {
      // Get the remote video stream from WebRTC service
      const webrtcService = (window as any).webrtcService;
      if (webrtcService) {
        const remoteStream = webrtcService.getRemoteStream();
        if (remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play();
        }
      }
    }
  }, [isOpen]);

  // Start call duration timer
  useEffect(() => {
    if (callData.status === "ongoing") {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callData.status]);

  // Handle ringing tone
  useEffect(() => {
    if (callData.status === "ringing") {
      // Create and play ringing tone
      if (!ringingAudioRef.current) {
        ringingAudioRef.current = new Audio();
        // Create a simple ringing tone using Web Audio API
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(
          1000,
          audioContext.currentTime + 0.5
        );

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + 1);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 1);

        // Repeat ringing tone
        const ringingInterval = setInterval(() => {
          if (callData.status === "ringing") {
            const newOscillator = audioContext.createOscillator();
            const newGainNode = audioContext.createGain();

            newOscillator.connect(newGainNode);
            newGainNode.connect(audioContext.destination);

            newOscillator.frequency.setValueAtTime(
              800,
              audioContext.currentTime
            );
            newOscillator.frequency.setValueAtTime(
              1000,
              audioContext.currentTime + 0.5
            );

            newGainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            newGainNode.gain.setValueAtTime(0, audioContext.currentTime + 1);

            newOscillator.start();
            newOscillator.stop(audioContext.currentTime + 1);
          } else {
            clearInterval(ringingInterval);
          }
        }, 2000);

        return () => {
          clearInterval(ringingInterval);
        };
      }
    }
  }, [callData.status]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    onMute?.(newMuted);
  };

  const handleSpeaker = () => {
    const newSpeaker = !isSpeakerOn;
    setIsSpeakerOn(newSpeaker);
    onSpeaker?.(newSpeaker);
  };

  const handleVideoToggle = () => {
    const newVideo = !isVideoOn;
    setIsVideoOn(newVideo);
    onVideoToggle?.(newVideo);
  };

  const handleAnswer = () => {
    setIsConnecting(true);
    onAnswer?.();
  };

  const handleReject = () => {
    onReject?.();
  };

  const handleEnd = () => {
    onEnd?.();
  };

  const isIncoming = callData.type === "incoming";
  const isOutgoing = callData.type === "outgoing";
  const isOngoing = callData.status === "ongoing";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 relative">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isIncoming
              ? "Incoming Video Call"
              : isOutgoing
              ? "Outgoing Video Call"
              : "Video Call"}
          </h2>
          {isOngoing && (
            <p className="text-lg text-gray-600">
              {formatDuration(callDuration)}
            </p>
          )}
        </div>

        {/* Video Streams */}
        <div className="relative mb-6">
          {/* Remote Video */}
          <div className="w-full h-64 bg-gray-200 rounded-lg mb-4 relative overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!isVideoOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <img
                      src={(() => {
                        const user = isIncoming
                          ? callData.caller
                          : callData.callee;
                        const avatarUrl = getAvatarUrlFromString(
                          user.avatar?.url
                        );
                        if (avatarUrl) {
                          return avatarUrl;
                        }
                        return getAvatarUrl(
                          { profile: { avatar: user.avatar } },
                          user.username.charAt(0).toUpperCase()
                        );
                      })()}
                      alt={
                        (isIncoming ? callData.caller : callData.callee)
                          .displayName
                      }
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) =>
                        handleAvatarError(
                          e,
                          (isIncoming
                            ? callData.caller
                            : callData.callee
                          ).username
                            .charAt(0)
                            .toUpperCase()
                        )
                      }
                    />
                  </div>
                  <p className="text-sm">
                    {
                      (isIncoming ? callData.caller : callData.callee)
                        .displayName
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Local Video */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* User Info */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-gray-900">
            {(isIncoming ? callData.caller : callData.callee).displayName}
          </h3>
          <p className="text-gray-600">
            @{(isIncoming ? callData.caller : callData.callee).username}
          </p>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center space-x-6 mb-6">
          {/* Mute Button */}
          <button
            onClick={handleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Speaker Button */}
          <button
            onClick={handleSpeaker}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isSpeakerOn
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            title={isSpeakerOn ? "Speaker Off" : "Speaker On"}
          >
            {isSpeakerOn ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>

          {/* Video Toggle Button */}
          <button
            onClick={handleVideoToggle}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isVideoOn ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
            title={isVideoOn ? "Turn Off Video" : "Turn On Video"}
          >
            {isVideoOn ? (
              <Video className="w-5 h-5" />
            ) : (
              <VideoOff className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {isIncoming && (
            <>
              <button
                onClick={handleReject}
                className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Reject Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button
                onClick={handleAnswer}
                className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                title="Answer Call"
              >
                <Phone className="w-6 h-6" />
              </button>
            </>
          )}

          {isOutgoing && (
            <button
              onClick={handleEnd}
              className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          )}

          {isOngoing && (
            <button
              onClick={handleEnd}
              className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Status Messages */}
        {isOutgoing && callData.status === "ringing" && (
          <div className="text-center mt-4">
            <p className="text-gray-600">Waiting for answer...</p>
          </div>
        )}
      </div>

      {/* Video Elements */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={{ display: "none" }}
      />
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />
    </div>
  );
};

export default VideoCallInterface;
