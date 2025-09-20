import React from "react";
import { MessageCircle, Users, Clock } from "lucide-react";
import {
  Conversation,
  useGetOrCreateConversationWithUserMutation,
} from "../../redux/features/messagingApi";
import { formatDistanceToNow } from "date-fns";
import { getAvatarUrlFromString } from "../../utils/avatarUtils";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

interface ChatListProps {
  conversations: Conversation[];
  isLoading: boolean;
  onConversationSelect: (conversationId: number) => void;
  searchQuery: string;
  error?: any;
  isAuthenticated?: boolean;
}

const ChatList: React.FC<ChatListProps> = ({
  conversations,
  isLoading,
  onConversationSelect,
  searchQuery,
  error,
  isAuthenticated = true,
}) => {
  const [createConversation, { isLoading: isCreatingConversation }] =
    useGetOrCreateConversationWithUserMutation();

  const currentUser = useSelector((state: RootState) => state.user);
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.isGroup && conversation.title) {
      return conversation.title;
    }

    // For direct messages, show the other participant's name
    const otherParticipant = conversation.participants.find(
      (p) => p.user.id !== currentUser.id
    );

    return otherParticipant?.user.profile.displayName || "Unknown User";
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.isGroup) {
      // For groups, you might want to show a group icon or first participant's avatar
      return getAvatarUrlFromString(
        conversation.participants[0]?.user.profile.avatar?.url
      );
    }

    // For direct messages, show the other participant's avatar
    const otherParticipant = conversation.participants.find(
      (p) => p.user.id !== currentUser.id
    );

    return getAvatarUrlFromString(otherParticipant?.user.profile.avatar?.url);
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) return "No messages yet";

    const { type, content, sender } = conversation.lastMessage;
    const isCurrentUser = sender.id === currentUser.id;

    let messageText = "";
    switch (type) {
      case "TEXT":
        messageText = content || "";
        break;
      case "IMAGE":
        messageText = "📷 Photo";
        break;
      case "AUDIO":
        messageText = "🎵 Audio";
        break;
      case "VIDEO":
        messageText = "🎥 Video";
        break;
      default:
        messageText = "Message";
    }

    const prefix = isCurrentUser ? "You: " : "";
    return prefix + messageText;
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">
          Please log in to use messaging
        </p>
        <p className="text-sm text-gray-400 text-center">
          You need to be logged in to view and send messages
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-500">
        <MessageCircle className="w-12 h-12 mb-2 text-gray-300" />
        <p className="text-sm">Failed to load conversations</p>
        <p className="text-xs text-gray-400 mt-1">Please try again later</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">
          {searchQuery ? "No conversations found" : "No conversations yet"}
        </p>
        {!searchQuery && (
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-4">
              Start a conversation by messaging someone
            </p>
            <div className="space-y-2 text-xs text-gray-400 mb-4">
              <p>• Click "Message" on any user's profile</p>
              <p>• Search for friends to start chatting</p>
              <p>• Your conversations will appear here</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onConversationSelect(conversation.id)}
          className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {getConversationAvatar(conversation) ? (
                <img
                  src={getConversationAvatar(conversation)}
                  alt={getConversationTitle(conversation)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                  {getConversationTitle(conversation).charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Online indicator for direct messages */}
            {!conversation.isGroup &&
              conversation.participants.some(
                (p) => p.user.id !== currentUser.id
              ) && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 ml-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {getConversationTitle(conversation)}
              </h3>
              <div className="flex items-center space-x-2">
                {conversation.lastMessageAt && (
                  <span className="text-xs text-gray-500">
                    {formatTime(conversation.lastMessageAt)}
                  </span>
                )}
                {conversation.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {conversation.unreadCount > 99
                      ? "99+"
                      : conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-gray-600 truncate">
                {getLastMessagePreview(conversation)}
              </p>
              {conversation.isGroup && (
                <Users className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;
