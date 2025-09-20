import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  MoreVertical,
  Send,
  Image,
  Mic,
  Smile,
  ThumbsUp,
  Minimize2,
  X,
  Square,
  Play,
  Pause,
} from "lucide-react";
import {
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkAsReadMutation,
} from "../../redux/features/messagingApi";
import { useUploadMediaMutation } from "../../redux/features/postsApi";
import { useMessagingSocket } from "../../hooks/useMessagingSocket";
import { useAudioCall } from "../../hooks/useAudioCall";
import { formatDistanceToNow } from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/Store";
import { getAvatarUrlFromString } from "../../utils/avatarUtils";
import AudioCallInterface from "./AudioCallInterface";
import { Phone, PhoneOff, Video, VideoOff, Clock } from "lucide-react";

// Call Log Message Component
const CallLogMessage: React.FC<{
  message: any;
  isCurrentUser: boolean;
}> = ({ message, isCurrentUser }) => {
  // Parse callData if it's a JSON string
  const callData =
    typeof message.callData === "string"
      ? JSON.parse(message.callData || "{}")
      : message.callData || {};
  const callType = callData.isVideo ? "video" : "audio";
  const callStatus = callData.status || "ended";
  const callDuration = callData.duration || 0;

  const getCallIcon = () => {
    const iconClass = "w-4 h-4";
    if (callType === "video") {
      return callStatus === "answered" ? (
        <Video className={`${iconClass} text-white`} />
      ) : (
        <VideoOff className={`${iconClass} text-red-200`} />
      );
    } else {
      return callStatus === "answered" ? (
        <Phone className={`${iconClass} text-white`} />
      ) : (
        <PhoneOff className={`${iconClass} text-red-200`} />
      );
    }
  };

  const getCallText = () => {
    const duration =
      callDuration > 0
        ? ` (${Math.floor(callDuration / 60)}:${(callDuration % 60)
            .toString()
            .padStart(2, "0")})`
        : "";

    switch (callStatus) {
      case "answered":
        return `${callType === "video" ? "Video" : "Audio"} call${duration}`;
      case "missed":
        return `Missed ${callType} call`;
      case "rejected":
        return `Declined ${callType} call`;
      case "ended":
        return `${callType === "video" ? "Video" : "Audio"} call ended`;
      default:
        return `${callType === "video" ? "Video" : "Audio"} call`;
    }
  };

  const getCallColor = () => {
    switch (callStatus) {
      case "answered":
        return "text-white";
      case "missed":
        return "text-red-200";
      case "rejected":
        return "text-orange-200";
      default:
        return "text-white";
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${getCallColor()}`}>
      {getCallIcon()}
      <span className="text-sm font-medium">{getCallText()}</span>
      {callDuration > 0 && <Clock className="w-3 h-3 text-white" />}
    </div>
  );
};

// Audio Player Component
const AudioPlayer: React.FC<{ audioUrl: string; isCurrentUser: boolean }> = ({
  audioUrl,
  isCurrentUser,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={togglePlay}
        className={`p-2 rounded-full transition-colors ${
          isCurrentUser
            ? "bg-white bg-opacity-20 hover:bg-opacity-30"
            : "bg-purple-500 hover:bg-purple-600"
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-xs opacity-75">{formatTime(currentTime)}</span>
          <div className="flex-1 bg-gray-300 rounded-full h-1">
            <div
              className="bg-current h-1 rounded-full transition-all duration-300"
              style={{
                width:
                  duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            />
          </div>
          <span className="text-xs opacity-75">{formatTime(duration)}</span>
        </div>
        <p className="text-xs mt-1 opacity-75">🎵 Audio Message</p>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        className="hidden"
      />
    </div>
  );
};

interface ChatInterfaceProps {
  conversationId: number;
  onBack?: () => void;
  onClose?: () => void;
  userInfo?: {
    id: number;
    name: string;
    image?: string;
  };
  isInModal?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  onBack,
  onClose,
  userInfo,
  isInModal = false,
}) => {
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);

  // Audio call functionality
  const {
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
  } = useAudioCall();

  // Check for incoming calls and open interface if needed
  useEffect(() => {
    if (
      currentCall &&
      currentCall.type === "incoming" &&
      !isCallInterfaceOpen
    ) {
      console.log("Incoming call detected, opening call interface");
      openCallInterface();
    }
  }, [currentCall, isCallInterfaceOpen, openCallInterface]);

  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages,
  } = useGetMessagesQuery({
    conversationId,
    params: { page: 1, limit: 50 },
  });

  const [sendMessage, { isLoading: sendingMessage }] = useSendMessageMutation();
  const [markAsRead] = useMarkAsReadMutation();
  const [uploadMedia] = useUploadMediaMutation();

  const {
    joinConversation,
    leaveConversation,
    sendMessage: sendSocketMessage,
    startTyping,
    stopTyping,
    markAsRead: markAsReadSocket,
    typingUsers,
    isConnected,
  } = useMessagingSocket();

  const messages = messagesData?.messages || [];

  // Join conversation when component mounts
  useEffect(() => {
    if (conversationId) {
      joinConversation(conversationId);
    }

    return () => {
      if (conversationId) {
        leaveConversation(conversationId);
      }
    };
  }, [conversationId, joinConversation, leaveConversation]);

  // Mark as read when conversation changes
  useEffect(() => {
    if (conversationId) {
      markAsRead({ conversationId });
    }
  }, [conversationId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sendingMessage) return;

    const messageContent = messageText.trim();
    setMessageText("");

    try {
      // Send via Socket.io for real-time delivery
      sendSocketMessage({
        conversationId,
        content: messageContent,
        type: "TEXT",
      });

      // Also send via API to save to database
      await sendMessage({
        conversationId,
        content: messageContent,
        type: "TEXT",
      }).unwrap();

      // Mark as read
      markAsReadSocket(conversationId);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageText(value);

    if (value.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        startTyping(conversationId);
      }
    } else {
      if (isTyping) {
        setIsTyping(false);
        stopTyping(conversationId);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const user = useSelector((state: RootState) => state.user);

  const isCurrentUser = (senderId: number) => {
    const currentUserId = user.id;
    return senderId === currentUserId;
  };

  // Audio call handler
  const handleAudioCall = async () => {
    console.log("Audio call button clicked");
    console.log("userInfo:", userInfo);
    console.log("conversationId:", conversationId);
    console.log("callError:", callError);
    console.log("startCall function:", startCall);

    if (!userInfo?.id || !conversationId) {
      console.log("Missing userInfo or conversationId");
      return;
    }

    try {
      console.log("Starting audio call...");

      // Create call log message immediately when call is initiated
      const callLogMessage = {
        conversationId,
        content: "Audio call initiated",
        type: "CALL_LOG" as const,
        callData: {
          isVideo: false,
          status: "answered",
          duration: 0,
        },
      };

      console.log("Creating immediate call log:", callLogMessage);
      await sendMessage(callLogMessage).unwrap();
      console.log("Call log created successfully");

      await startCall(
        userInfo.id,
        {
          username: userInfo.name, // Using name as username since username is not available
          displayName: userInfo.name,
          avatar: userInfo.image ? { url: userInfo.image } : null,
        },
        false,
        conversationId
      );
      console.log("Audio call started successfully");
    } catch (error) {
      console.error("Error starting audio call:", error);
      // Show user-friendly error message
      alert("Failed to start audio call. Please try again.");
    }
  };

  // Video call handler
  const handleVideoCall = async () => {
    if (!userInfo?.id || !conversationId) return;

    try {
      // Create call log message immediately when call is initiated
      const callLogMessage = {
        conversationId,
        content: "Video call initiated",
        type: "CALL_LOG" as const,
        callData: {
          isVideo: true,
          status: "answered",
          duration: 0,
        },
      };

      console.log("Creating immediate video call log:", callLogMessage);
      await sendMessage(callLogMessage).unwrap();
      console.log("Video call log created successfully");

      await startCall(
        userInfo.id,
        {
          username: userInfo.name, // Using name as username since username is not available
          displayName: userInfo.name,
          avatar: userInfo.image ? { url: userInfo.image } : null,
        },
        true,
        conversationId
      );
    } catch (error) {
      console.error("Error starting video call:", error);
      // Show user-friendly error message
      alert("Failed to start video call. Please try again.");
    }
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(
        "Microphone access denied. Please allow microphone access to record audio messages."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const sendAudioMessage = async () => {
    if (!audioBlob || sendingMessage) return;

    try {
      // Upload the audio file first
      const formData = new FormData();
      formData.append("file", audioBlob, `audio-message-${Date.now()}.wav`);

      const uploadResponse = await uploadMedia(formData).unwrap();

      // Send via Socket.io for real-time delivery
      sendSocketMessage({
        conversationId,
        content: `🎵 Audio message (${Math.floor(recordingDuration / 60)}:${(
          recordingDuration % 60
        )
          .toString()
          .padStart(2, "0")})`,
        type: "AUDIO",
        mediaIds: [uploadResponse.data.id],
      });

      // Also send via API to save to database
      await sendMessage({
        conversationId,
        content: `🎵 Audio message (${Math.floor(recordingDuration / 60)}:${(
          recordingDuration % 60
        )
          .toString()
          .padStart(2, "0")})`,
        type: "AUDIO",
        mediaIds: [uploadResponse.data.id],
      }).unwrap();

      // Clear audio data
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingDuration(0);
      setIsPlaying(false);

      // Refetch messages
      refetchMessages();
      markAsReadSocket(conversationId);
    } catch (error) {
      console.error("Failed to send audio message:", error);
      alert("Failed to send audio message. Please try again.");
    }
  };

  const cancelAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setIsPlaying(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  // Image handling functions
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      alert("Please select valid image files.");
      return;
    }

    // Limit to 5 images max
    const newImages = imageFiles.slice(0, 5);
    setSelectedImages((prev) => [...prev, ...newImages].slice(0, 5));

    // Create preview URLs
    const newPreviews = newImages.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const sendImageMessage = async () => {
    if (selectedImages.length === 0 || sendingMessage) return;

    try {
      const mediaIds: number[] = [];

      // Upload each image
      for (const imageFile of selectedImages) {
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadResponse = await uploadMedia(formData).unwrap();
        mediaIds.push(uploadResponse.data.id);
      }

      // Send via Socket.io for real-time delivery
      sendSocketMessage({
        conversationId,
        content: `📷 ${selectedImages.length} image${
          selectedImages.length > 1 ? "s" : ""
        }`,
        type: "IMAGE",
        mediaIds: mediaIds,
      });

      // Also send via API to save to database
      await sendMessage({
        conversationId,
        content: `📷 ${selectedImages.length} image${
          selectedImages.length > 1 ? "s" : ""
        }`,
        type: "IMAGE",
        mediaIds: mediaIds,
      }).unwrap();

      // Clear image data
      setSelectedImages([]);
      setImagePreviews([]);
      markAsReadSocket(conversationId);
    } catch (error) {
      console.error("Failed to send image message:", error);
      alert("Failed to send images. Please try again.");
    }
  };

  const cancelImages = () => {
    // Clean up preview URLs
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setImagePreviews([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      // Clean up image preview URLs
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [audioUrl, imagePreviews]);

  const formatMessageTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  };

  if (messagesLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (messagesError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-500 mb-4">Failed to load messages</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col ${
        isInModal
          ? "h-full"
          : "h-full bg-white w-full max-w-md mx-auto shadow-lg"
      }`}
    >
      {/* Header - Purple bar */}
      <div className="bg-purple-500 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-purple-600 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {userInfo?.image ? (
              <img
                src={getAvatarUrlFromString(userInfo.image) || ""}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const nextElement = e.currentTarget
                    .nextElementSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.style.display = "flex";
                  }
                }}
              />
            ) : null}
            <div
              className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center"
              style={{ display: userInfo?.image ? "none" : "flex" }}
            >
              <span className="text-gray-600 font-semibold text-xs">
                {userInfo?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">
              {userInfo?.name || "User"}
            </h2>
            <p className="text-xs text-purple-200">Online</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Call button clicked!");
              console.log("Button disabled:", !!callError);
              console.log("Call error:", callError);
              handleAudioCall();
            }}
            className={`p-2 rounded-full transition-colors ${
              callError
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-500 hover:bg-purple-600"
            }`}
            title={callError ? "Call service unavailable" : "Audio Call"}
            disabled={!!callError}
            style={{ pointerEvents: "auto" }}
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={handleVideoCall}
            className={`p-2 rounded-full transition-colors ${
              callError
                ? "bg-gray-400 cursor-not-allowed"
                : "hover:bg-purple-600"
            }`}
            title={callError ? "Call service unavailable" : "Video Call"}
            disabled={!!callError}
          >
            <Video className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-purple-600 rounded-full transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-600 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-gray-50 messages-scrollable">
        <div className="p-3 space-y-2 min-h-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                <span className="text-xl">💬</span>
              </div>
              <p className="text-sm font-medium mb-1">No messages yet</p>
              <p className="text-xs text-center text-gray-400">
                Start the conversation by sending a message
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isCurrent = isCurrentUser(message.senderId);

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isCurrent ? "justify-end" : "justify-start"
                  } items-end space-x-2`}
                >
                  {/* Profile picture for other user's messages */}
                  {!isCurrentUser(message.senderId) && (
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {message.sender?.profile?.avatar?.url ? (
                        <img
                          src={
                            getAvatarUrlFromString(
                              message.sender.profile.avatar.url
                            ) || ""
                          }
                          alt="Profile"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const nextElement = e.currentTarget
                              .nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center"
                        style={{
                          display: message.sender?.profile?.avatar?.url
                            ? "none"
                            : "flex",
                        }}
                      >
                        <span className="text-gray-600 font-semibold text-xs">
                          {message.sender?.profile?.displayName
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-xs px-3 py-2 rounded-2xl ${
                      isCurrentUser(message.senderId)
                        ? "bg-purple-500 text-white"
                        : "bg-white text-gray-800 shadow-sm"
                    }`}
                  >
                    {message.type === "CALL_LOG" ? (
                      <CallLogMessage
                        message={message}
                        isCurrentUser={isCurrentUser(message.senderId)}
                      />
                    ) : message.type === "AUDIO" ||
                      message.content?.includes("🎵 Audio message") ? (
                      message.mediaUsages && message.mediaUsages.length > 0 ? (
                        <AudioPlayer
                          audioUrl={`http://localhost:3000${message.mediaUsages[0].media.url}`}
                          isCurrentUser={isCurrentUser(message.senderId)}
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              // Try to extract audio URL from content if media is not available
                              console.log("Audio message clicked:", message);
                              alert(
                                "Audio file not available. This might be an older message format."
                              );
                            }}
                            className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <div>
                            <p className="text-sm font-medium">
                              🎵 Audio Message
                            </p>
                            <p className="text-xs opacity-75">
                              Audio not available
                            </p>
                          </div>
                        </div>
                      )
                    ) : message.type === "IMAGE" &&
                      message.mediaUsages &&
                      message.mediaUsages.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          📷 Image{message.mediaUsages.length > 1 ? "s" : ""}
                        </p>
                        <div
                          className="grid gap-2"
                          style={{
                            gridTemplateColumns: `repeat(${Math.min(
                              message.mediaUsages.length,
                              3
                            )}, 1fr)`,
                          }}
                        >
                          {message.mediaUsages.map((mediaUsage, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={`http://localhost:3000${mediaUsage.media.url}`}
                                alt={`Image ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  // Open image in new tab for full view
                                  window.open(
                                    `http://localhost:3000${mediaUsage.media.url}`,
                                    "_blank"
                                  );
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Typing Indicator */}
        {conversationId &&
          typingUsers.get(conversationId) &&
          typingUsers.get(conversationId)!.length > 0 &&
          (() => {
            // Filter out current user from typing users
            if (!user.id) return null;
            const currentUserId = user.id.toString();
            const otherTypingUsers = typingUsers
              .get(conversationId)!
              .filter((userId) => userId !== currentUserId);

            // Only show typing indicator if other users are typing
            return otherTypingUsers.length > 0 ? (
              <div className="flex justify-start items-center space-x-2 p-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  <span className="text-xs text-gray-600">👤</span>
                </div>
                <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-xs">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 ml-2">
                      typing...
                    </span>
                  </div>
                </div>
              </div>
            ) : null;
          })()}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="bg-white border-t border-gray-200 p-3 flex-shrink-0">
        {/* Audio Recording UI */}
        {audioBlob && (
          <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={playAudio}
                  className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    Audio Message
                  </p>
                  <p className="text-xs text-purple-600">
                    Duration: {Math.floor(recordingDuration / 60)}:
                    {(recordingDuration % 60).toString().padStart(2, "0")}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={sendAudioMessage}
                  disabled={sendingMessage}
                  className="px-3 py-1 bg-purple-500 text-white text-sm rounded-full hover:bg-purple-600 disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
                <button
                  onClick={cancelAudio}
                  className="px-3 py-1 bg-gray-500 text-white text-sm rounded-full hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            )}
          </div>
        )}

        {/* Image Preview UI */}
        {selectedImages.length > 0 && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-800">
                📷 {selectedImages.length} image
                {selectedImages.length > 1 ? "s" : ""} selected
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={sendImageMessage}
                  disabled={sendingMessage}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
                <button
                  onClick={cancelImages}
                  className="px-3 py-1 bg-gray-500 text-white text-sm rounded-full hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${Math.min(
                  selectedImages.length,
                  4
                )}, 1fr)`,
              }}
            >
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSendMessage}
          className="flex items-center space-x-2"
        >
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-full transition-colors ${
              isRecording
                ? "bg-red-500 text-white hover:bg-red-600"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            {isRecording ? (
              <Square className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Image className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={inputRef}
            type="text"
            value={messageText}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder={isRecording ? "Recording..." : "Type a message..."}
            className="flex-1 px-4 py-2 bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-800 placeholder-gray-500 text-sm"
            disabled={sendingMessage || isRecording}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || isRecording}
            className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Recording indicator */}
        {isRecording && (
          <div className="mt-2 flex items-center space-x-2 text-red-500">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm">
              Recording... {Math.floor(recordingDuration / 60)}:
              {(recordingDuration % 60).toString().padStart(2, "0")}
            </span>
          </div>
        )}
      </div>

      {/* Audio Call Interface */}
      {currentCall && (
        <AudioCallInterface
          isOpen={isCallInterfaceOpen}
          onClose={closeCallInterface}
          callData={currentCall}
          onAnswer={answerCall}
          onReject={rejectCall}
          onEnd={endCall}
          onMute={muteAudio}
          onSpeaker={setSpeaker}
          isCallConnected={isCallConnected}
        />
      )}

      {/* Call Error Display */}
      {callError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {callError}
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
