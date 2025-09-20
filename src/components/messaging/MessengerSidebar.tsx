import React, { useState, useEffect, useRef } from "react";
import { X, Search, MoreVertical, Phone, Video, Info } from "lucide-react";
import { useGetConversationsQuery } from "../../redux/features/messagingApi";
import { Conversation, Message } from "../../redux/features/messagingApi";
import ChatList from "./ChatList";
import ConversationView from "./ConversationView";
import ChatInterface from "./ChatInterface";

interface MessengerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialConversationId?: number;
}

const MessengerSidebar: React.FC<MessengerSidebarProps> = ({
  isOpen,
  onClose,
  initialConversationId,
}) => {
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(initialConversationId || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showChatList, setShowChatList] = useState(!initialConversationId);
  const [showFullScreenChat, setShowFullScreenChat] = useState(
    !!initialConversationId
  );

  const {
    data: conversationsData,
    isLoading,
    error,
  } = useGetConversationsQuery(
    {
      page: 1,
      limit: 50,
    },
    {
      skip: !isOpen, // Only fetch when sidebar is open
    }
  );

  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem("access_token");

  const conversations = conversationsData?.conversations || [];

  // Debug logging
  useEffect(() => {
    console.log("MessengerSidebar - isOpen:", isOpen);
    console.log("MessengerSidebar - conversationsData:", conversationsData);
    console.log("MessengerSidebar - conversations:", conversations);
    console.log(
      "MessengerSidebar - initialConversationId:",
      initialConversationId
    );
    console.log(
      "MessengerSidebar - selectedConversationId:",
      selectedConversationId
    );
    console.log("MessengerSidebar - showChatList:", showChatList);
    console.log("MessengerSidebar - isLoading:", isLoading);
    console.log("MessengerSidebar - error:", error);
  }, [
    isOpen,
    conversationsData,
    conversations,
    initialConversationId,
    selectedConversationId,
    showChatList,
    isLoading,
    error,
  ]);

  // Handle initial conversation - show full-screen chat immediately
  useEffect(() => {
    console.log(
      "Initial conversation effect - initialConversationId:",
      initialConversationId,
      "conversations:",
      conversations.length
    );
    if (initialConversationId) {
      // If we have an initial conversation ID, show full-screen chat immediately
      setSelectedConversationId(initialConversationId);
      setShowChatList(false);
      setShowFullScreenChat(true);
      console.log(
        "Set selected conversation and showFullScreenChat=true immediately"
      );
    }
  }, [initialConversationId]);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      conv.participants.some(
        (participant) =>
          participant.user.profile.displayName
            .toLowerCase()
            .includes(searchLower) ||
          participant.user.username.toLowerCase().includes(searchLower)
      ) ||
      (conv.title && conv.title.toLowerCase().includes(searchLower))
    );
  });

  const selectedConversation = conversations.find(
    (conv) => conv.id === selectedConversationId
  );

  const handleConversationSelect = (conversationId: number) => {
    setSelectedConversationId(conversationId);
    setShowChatList(false);
    setShowFullScreenChat(true);
  };

  const handleBackToChatList = () => {
    setShowChatList(true);
    setSelectedConversationId(null);
    setShowFullScreenChat(false);
  };

  const handleBackToSidebar = () => {
    setShowFullScreenChat(false);
    setShowChatList(true);
  };

  const handleNewMessage = () => {
    setShowChatList(true);
    setSelectedConversationId(null);
  };

  if (!isOpen) return null;

  console.log(
    "Rendering MessengerSidebar - isOpen:",
    isOpen,
    "showChatList:",
    showChatList,
    "showFullScreenChat:",
    showFullScreenChat,
    "selectedConversationId:",
    selectedConversationId
  );

  // Show full-screen chat interface
  if (showFullScreenChat && selectedConversationId) {
    return (
      <ChatInterface
        conversationId={selectedConversationId}
        onBack={handleBackToSidebar}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="relative w-full max-w-md bg-white shadow-xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">Messenger</h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleNewMessage}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="New message"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Messenger"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {showChatList ? (
            <ChatList
              conversations={filteredConversations}
              isLoading={isLoading}
              onConversationSelect={handleConversationSelect}
              searchQuery={searchQuery}
              error={error}
              isAuthenticated={isAuthenticated}
            />
          ) : (
            <ConversationView
              conversation={selectedConversation}
              onBack={handleBackToChatList}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessengerSidebar;
