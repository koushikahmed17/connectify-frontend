import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Phone,
  Video,
  Info,
  Send,
  Image,
  Mic,
  Smile,
  MessageCircle,
} from "lucide-react";
import {
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkAsReadMutation,
} from "../../redux/features/messagingApi";
import { Conversation, Message } from "../../redux/features/messagingApi";
import { useMessagingSocket } from "../../hooks/useMessagingSocket";
import { formatDistanceToNow } from "date-fns";
import { getAvatarUrlFromString } from "../../utils/avatarUtils";

interface ConversationViewProps {
  conversation: Conversation | undefined;
  onBack: () => void;
  onClose: () => void;
}

const ConversationView: React.FC<ConversationViewProps> = ({
  conversation,
  onBack,
  onClose,
}) => {
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const {
    socket,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
  } = useMessagingSocket();

  const { data: messagesData, isLoading } = useGetMessagesQuery(
    {
      conversationId: conversation?.id || 0,
      params: { page: 1, limit: 50 },
    },
    {
      skip: !conversation,
    }
  );

  const [sendMessageMutation] = useSendMessageMutation();
  const [markAsReadMutation] = useMarkAsReadMutation();

  const messages = messagesData?.messages || [];

  // Join conversation when component mounts
  useEffect(() => {
    if (conversation) {
      joinConversation(conversation.id);
    }

    return () => {
      if (conversation) {
        leaveConversation(conversation.id);
      }
    };
  }, [conversation, joinConversation, leaveConversation]);

  // Mark messages as read when conversation changes
  useEffect(() => {
    if (conversation) {
      markAsReadMutation({ conversationId: conversation.id });
    }
  }, [conversation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !conversation) return;

    const messageData = {
      conversationId: conversation.id,
      type: "TEXT" as const,
      content: messageText.trim(),
    };

    try {
      // Send via WebSocket for real-time delivery
      sendMessage(messageData);

      // Also send via API for persistence
      await sendMessageMutation(messageData).unwrap();

      setMessageText("");
      stopTyping(conversation.id);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);

    if (!conversation) return;

    if (!isTyping) {
      setIsTyping(true);
      startTyping(conversation.id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(conversation.id);
    }, 1000);
  };

  const getConversationTitle = () => {
    if (!conversation) return "Unknown";

    if (conversation.isGroup && conversation.title) {
      return conversation.title;
    }

    // For direct messages, show the other participant's name
    const otherParticipant = conversation.participants.find(
      (p) => p.user.id !== parseInt(localStorage.getItem("userId") || "0")
    );

    return otherParticipant?.user.profile.displayName || "Unknown User";
  };

  const getConversationAvatar = () => {
    if (!conversation) return null;

    let avatarUrl: string | undefined = undefined;
    if (conversation.isGroup) {
      avatarUrl = conversation.participants[0]?.user.profile.avatar?.url;
    } else {
      // For direct messages, show the other participant's avatar
      const otherParticipant = conversation.participants.find(
        (p) => p.user.id !== parseInt(localStorage.getItem("userId") || "0")
      );
      avatarUrl = otherParticipant?.user.profile.avatar?.url;
    }

    return getAvatarUrlFromString(avatarUrl);
  };

  const formatMessageTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  };

  const isCurrentUser = (senderId: number) => {
    const currentUserId = parseInt(localStorage.getItem("userId") || "0");
    return senderId === currentUserId;
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">
          Select a conversation to start messaging
        </p>
        <p className="text-sm text-gray-400 text-center">
          Choose a conversation from the list to view and send messages
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {getConversationAvatar() ? (
                <img
                  src={getConversationAvatar() || ""}
                  alt={getConversationTitle()}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {getConversationTitle().charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                {getConversationTitle()}
              </h3>
              <p className="text-sm text-green-600">Active now</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Info className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pr-12 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                isCurrentUser(message.senderId)
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isCurrentUser(message.senderId)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    isCurrentUser(message.senderId)
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  {formatMessageTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 pr-6 border-t border-gray-200 bg-white">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center space-x-2"
        >
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Image className="w-5 h-5 text-gray-600" />
          </button>

          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Mic className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={messageText}
              onChange={handleTyping}
              placeholder="Aa"
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Smile className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!messageText.trim()}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConversationView;
