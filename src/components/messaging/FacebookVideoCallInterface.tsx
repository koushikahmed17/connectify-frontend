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
  MoreVertical,
  X,
} from "lucide-react";
import {
  getAvatarUrl,
  handleAvatarError,
  getAvatarUrlFromString,
} from "../../utils/avatarUtils";

interface FacebookVideoCallInterfaceProps {
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

const FacebookVideoCallInterface: React.FC<FacebookVideoCallInterfaceProps> = ({
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

  // Connect video streams to WebRTC service
  useEffect(() => {
    if (localVideoRef.current && isOpen) {
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
    <div className="fixed inset-0 bg-black z-50 flex">
      {/* Left Sidebar - Facebook Style */}
      <div className="w-64 bg-gray-900 text-white p-4 hidden lg:block">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-semibold">Connectify</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center p-2 rounded-lg hover:bg-gray-800 cursor-pointer">
            <Users className="w-5 h-5 mr-3" />
            <span>Friends</span>
          </div>
          <div className="flex items-center p-2 rounded-lg hover:bg-gray-800 cursor-pointer">
            <Video className="w-5 h-5 mr-3" />
            <span>Video</span>
          </div>
          <div className="flex items-center p-2 rounded-lg hover:bg-gray-800 cursor-pointer">
            <Users className="w-5 h-5 mr-3" />
            <span>Groups</span>
          </div>
        </div>
      </div>

      {/* Main Call Interface */}
      <div className="flex-1 bg-black relative">
        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Video Area */}
        <div className="w-full h-full flex items-center justify-center relative">
          {isOngoing ? (
            // Video streams when call is ongoing
            <>
              {/* Remote Video - Main Area */}
              <div className="w-full h-full relative">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center text-white">
                      <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
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
                          className="w-16 h-16 rounded-full object-cover"
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
                      <p className="text-xl font-semibold">
                        {
                          (isIncoming ? callData.caller : callData.callee)
                            .displayName
                        }
                      </p>
                      <p className="text-gray-400">Video is off</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Local Video - Picture in Picture */}
              <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                    <div className="text-center text-white">
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                        <span className="text-lg font-semibold">You</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Caller info when ringing
            <div className="text-center text-white">
              <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mb-6 mx-auto">
                <img
                  src={(() => {
                    const user = isIncoming ? callData.caller : callData.callee;
                    const avatarUrl = getAvatarUrlFromString(user.avatar?.url);
                    if (avatarUrl) {
                      return avatarUrl;
                    }
                    return getAvatarUrl(
                      { profile: { avatar: user.avatar } },
                      user.username.charAt(0).toUpperCase()
                    );
                  })()}
                  alt={
                    (isIncoming ? callData.caller : callData.callee).displayName
                  }
                  className="w-24 h-24 rounded-full object-cover"
                  onError={(e) =>
                    handleAvatarError(
                      e,
                      (isIncoming ? callData.caller : callData.callee).username
                        .charAt(0)
                        .toUpperCase()
                    )
                  }
                />
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                {(isIncoming ? callData.caller : callData.callee).displayName}
              </h2>
              <p className="text-gray-400 mb-4">
                {isIncoming ? "Incoming video call" : "Calling..."}
              </p>
              {isOngoing && (
                <p className="text-lg text-gray-300">
                  {formatDuration(callDuration)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom Call Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-4">
            {/* Add Participant */}
            <button className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors">
              <Users className="w-5 h-5" />
            </button>

            {/* Mute Button */}
            <button
              onClick={handleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? "bg-red-600" : "bg-gray-800 hover:bg-gray-700"
              } text-white`}
            >
              {isMuted ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Video Toggle Button */}
            <button
              onClick={handleVideoToggle}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isVideoOn ? "bg-gray-800 hover:bg-gray-700" : "bg-red-600"
              } text-white`}
            >
              {isVideoOn ? (
                <Video className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
            </button>

            {/* End Call Button */}
            <button
              onClick={isIncoming ? handleReject : handleEnd}
              className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors"
            >
              <PhoneOff className="w-5 h-5" />
            </button>

            {/* Answer Button (for incoming calls) */}
            {isIncoming && (
              <button
                onClick={handleAnswer}
                className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700 transition-colors"
              >
                <Phone className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {isOutgoing && callData.status === "ringing" && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-white">
            <p className="text-lg">Waiting for answer...</p>
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

export default FacebookVideoCallInterface;


