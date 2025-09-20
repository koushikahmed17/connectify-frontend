import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Users,
  Settings,
} from "lucide-react";
import {
  getAvatarUrl,
  handleAvatarError,
  getAvatarUrlFromString,
} from "../../utils/avatarUtils";

interface AudioCallInterfaceProps {
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
  isCallConnected?: boolean;
}

const AudioCallInterface: React.FC<AudioCallInterfaceProps> = ({
  isOpen,
  onClose,
  callData,
  onAnswer,
  onReject,
  onEnd,
  onMute,
  onSpeaker,
  isCallConnected = false,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [localIsConnected, setLocalIsConnected] = useState(false);

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringingAudioRef = useRef<HTMLAudioElement | null>(null);

  // Define variables before using them in useEffect
  const isIncoming = callData.type === "incoming";
  const isOutgoing = callData.type === "outgoing";
  const isOngoing =
    callData.status === "ongoing" && (isCallConnected || localIsConnected);
  const isConnecting =
    callData.status === "ongoing" && !isCallConnected && !localIsConnected;

  // Auto-test: Force connection after 3 seconds
  useEffect(() => {
    if (isConnecting) {
      const timer = setTimeout(() => {
        console.log("🧪 AUTO-TEST: Forcing local connection after 3 seconds");
        setLocalIsConnected(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isConnecting]);

  // Start call duration timer
  useEffect(() => {
    if (callData.status === "ongoing") {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
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

  const handleAnswer = () => {
    onAnswer?.();
  };

  const handleReject = () => {
    onReject?.();
    onClose();
  };

  const handleEnd = () => {
    onEnd?.();
    onClose();
  };

  if (!isOpen) return null;

  // Debug logging
  console.log("AudioCallInterface - callData.status:", callData.status);
  console.log("AudioCallInterface - isCallConnected:", isCallConnected);
  console.log("AudioCallInterface - isOngoing:", isOngoing);
  console.log("AudioCallInterface - isConnecting:", isConnecting);
  console.log("AudioCallInterface - Props received:", {
    isCallConnected,
    callDataStatus: callData.status,
  });

  // Test function to manually set connected
  const testConnection = () => {
    console.log("🧪 TEST: Manually setting connected");
    console.log("🧪 TEST: Current isCallConnected prop:", isCallConnected);
    console.log("🧪 TEST: Current localIsConnected state:", localIsConnected);
    setLocalIsConnected(true);
    console.log("🧪 TEST: Set localIsConnected to true");
    // Also trigger the event for the hook
    window.dispatchEvent(new CustomEvent("test-call-connected"));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isIncoming && "Incoming Call"}
            {isOutgoing && "Calling..."}
            {isConnecting && "Connecting..."}
            {isOngoing && "Audio Call"}
          </h2>

          {/* Test Button for Debugging */}
          {isConnecting && (
            <div className="mt-2">
              <button
                onClick={testConnection}
                className="px-4 py-2 bg-red-500 text-white rounded text-xs"
              >
                🧪 TEST: Force Connected
              </button>
            </div>
          )}
          {isOngoing && (
            <p className="text-lg text-gray-600">
              {formatDuration(callDuration)}
            </p>
          )}
        </div>

        {/* User Info */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <img
              src={(() => {
                const user = isIncoming ? callData.caller : callData.callee;
                const avatarUrl = getAvatarUrlFromString(user.avatar?.url);
                if (avatarUrl) {
                  return avatarUrl;
                }
                // Return a default avatar with user's initial
                return getAvatarUrl(
                  { profile: { avatar: user.avatar } },
                  user.username.charAt(0).toUpperCase()
                );
              })()}
              alt={(isIncoming ? callData.caller : callData.callee).displayName}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              onError={(e) =>
                handleAvatarError(
                  e,
                  (isIncoming ? callData.caller : callData.callee).username
                    .charAt(0)
                    .toUpperCase()
                )
              }
            />
            {isOngoing && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
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
            className={`p-4 rounded-full transition-colors ${
              isMuted
                ? "bg-red-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            disabled={!isOngoing}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>

          {/* Speaker Button */}
          <button
            onClick={handleSpeaker}
            className={`p-4 rounded-full transition-colors ${
              isSpeakerOn
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            disabled={!isOngoing}
          >
            {isSpeakerOn ? (
              <Volume2 className="w-6 h-6" />
            ) : (
              <VolumeX className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {isIncoming && (
            <>
              <button
                onClick={handleReject}
                className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button
                onClick={handleAnswer}
                className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                disabled={isConnecting}
              >
                <Phone className="w-6 h-6" />
              </button>
            </>
          )}

          {isOutgoing && (
            <button
              onClick={handleEnd}
              className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          )}

          {isOngoing && (
            <button
              onClick={handleEnd}
              className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Status Messages */}
        {isConnecting && (
          <div className="text-center mt-4">
            <p className="text-gray-600">Connecting...</p>
          </div>
        )}

        {isOngoing && (
          <div className="text-center mt-4">
            <p className="text-green-600 font-medium">Connected</p>
          </div>
        )}

        {isOutgoing && callData.status === "ringing" && !isOngoing && (
          <div className="text-center mt-4">
            <p className="text-gray-600">Waiting for answer...</p>
          </div>
        )}
      </div>

      {/* Audio Elements */}
      <audio ref={localAudioRef} autoPlay muted />
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
};

export default AudioCallInterface;
