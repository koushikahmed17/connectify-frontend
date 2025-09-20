import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Phone,
  Video,
  MoreVertical,
  Send,
  Image,
  Mic,
  Smile,
} from "lucide-react";
import { useGetConversationsQuery } from "../../redux/features/messagingApi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/Store";
import { formatDistanceToNow } from "date-fns";
import { getAvatarUrlFromString } from "../../utils/avatarUtils";
import ChatInterface from "./ChatInterface";

interface MessengerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Conversation {
  id: number;
  participants: Array<{
    user: {
      id: number;
      username: string;
      profile: {
        displayName: string;
        avatar?: {
          url: string;
        } | null;
      };
    };
  }>;
  lastMessage?: {
    content: string;
    type: string;
    createdAt: string;
    sender: {
      id: number;
      username: string;
      profile: {
        displayName: string;
        avatar?: {
          url: string;
        } | null;
      };
    };
  };
  unreadCount: number;
  lastMessageAt: string;
}

const MessengerModal: React.FC<MessengerModalProps> = ({ isOpen, onClose }) => {
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const currentUser = useSelector((state: RootState) => state.user);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get conversations
  const { data: conversationsData, isLoading } = useGetConversationsQuery({
    page: 1,
    limit: 50,
  });

  const conversations = conversationsData?.conversations || [];

  // Filter conversations based on search
  const filteredConversations = conversations.filter(
    (conversation: Conversation) => {
      if (!searchQuery) return true;

      const otherParticipant = conversation.participants.find(
        (p) => p.user.id !== currentUser.id
      );

      if (!otherParticipant) return false;

      const displayName =
        otherParticipant.user.profile.displayName.toLowerCase();
      const username = otherParticipant.user.username.toLowerCase();
      const query = searchQuery.toLowerCase();

      return displayName.includes(query) || username.includes(query);
    }
  );

  // Get other participant from conversation
  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p.user.id !== currentUser.id);
  };

  // Format last message content
  const formatLastMessage = (message: any) => {
    if (!message) return "No messages yet";

    switch (message.type) {
      case "TEXT":
        return message.content;
      case "IMAGE":
        return "📷 Photo";
      case "AUDIO":
        return "🎵 Audio message";
      case "VIDEO":
        return "🎥 Video";
      case "CALL_LOG":
        const callData =
          typeof message.callData === "string"
            ? JSON.parse(message.callData || "{}")
            : message.callData;
        const callType = callData.isVideo ? "Video" : "Audio";
        const callStatus = callData.status || "ended";
        return `${callType} call ${callStatus}`;
      default:
        return message.content || "Message";
    }
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (isMobile) {
      // On mobile, show chat interface full screen
    }
  };

  // Handle back to conversation list (mobile)
  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] md:h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              Messenger
            </h2>
            {selectedConversation && isMobile && (
              <button
                onClick={handleBackToList}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Conversation List */}
          {(!selectedConversation || !isMobile) && (
            <div
              className={`${
                isMobile && selectedConversation ? "hidden" : "flex"
              } flex-col w-full md:w-1/3 border-r border-gray-200`}
            >
              {/* Search */}
              <div className="p-3 md:p-4 border-b border-gray-200 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                    <p>No conversations found</p>
                    {searchQuery && (
                      <p className="text-sm">Try a different search term</p>
                    )}
                  </div>
                ) : (
                  filteredConversations.map((conversation: Conversation) => {
                    const otherParticipant = getOtherParticipant(conversation);
                    if (!otherParticipant) return null;

                    return (
                      <div
                        key={conversation.id}
                        onClick={() => handleConversationSelect(conversation)}
                        className={`p-3 md:p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                          selectedConversation?.id === conversation.id
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {/* Avatar */}
                          <div className="relative">
                            <img
                              src={getAvatarUrlFromString(
                                otherParticipant.user.profile.avatar?.url
                              )}
                              alt={otherParticipant.user.profile.displayName}
                              className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  otherParticipant.user.profile.displayName
                                )}&background=6366f1&color=fff`;
                              }}
                            />
                            {conversation.unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {conversation.unreadCount > 99
                                  ? "99+"
                                  : conversation.unreadCount}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm md:text-sm font-semibold text-gray-900 truncate">
                                {otherParticipant.user.profile.displayName}
                              </h3>
                              {conversation.lastMessage && (
                                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                  {formatDistanceToNow(
                                    new Date(conversation.lastMessageAt),
                                    { addSuffix: true }
                                  )}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-xs md:text-sm truncate ${
                                conversation.unreadCount > 0
                                  ? "text-gray-900 font-medium"
                                  : "text-gray-500"
                              }`}
                            >
                              {formatLastMessage(conversation.lastMessage)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Chat Interface */}
          {selectedConversation && (
            <div className={`${isMobile ? "w-full" : "w-2/3"} flex flex-col`}>
              <ChatInterface
                conversationId={selectedConversation.id}
                onBack={isMobile ? handleBackToList : undefined}
                onClose={onClose}
                userInfo={{
                  id: getOtherParticipant(selectedConversation)?.user.id || 0,
                  name:
                    getOtherParticipant(selectedConversation)?.user.profile
                      .displayName || "",
                  image:
                    getOtherParticipant(selectedConversation)?.user.profile
                      .avatar?.url || "",
                }}
                isInModal={true}
              />
            </div>
          )}

          {/* Empty State */}
          {!selectedConversation && !isMobile && (
            <div className="w-2/3 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-500">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessengerModal;
