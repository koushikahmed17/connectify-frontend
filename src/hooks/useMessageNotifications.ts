import { useState, useEffect } from "react";
import { useMessagingSocket } from "./useMessagingSocket";
import {
  useGetConversationsQuery,
  messagingApi,
} from "../redux/features/messagingApi";
import { useDispatch } from "react-redux";

interface MessageNotification {
  conversationId: number;
  message: any;
  unreadCount: number;
}

export const useMessageNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<
    MessageNotification[]
  >([]);

  const { socket } = useMessagingSocket();
  const dispatch = useDispatch();

  // Get conversations to calculate unread count
  const { data: conversationsData } = useGetConversationsQuery({
    page: 1,
    limit: 100,
  });

  // Calculate total unread count from conversations
  useEffect(() => {
    if (conversationsData?.conversations) {
      console.log(
        "useMessageNotifications: Conversations data:",
        conversationsData.conversations
      );
      const totalUnread = conversationsData.conversations.reduce(
        (sum, conversation) => {
          console.log(
            `Conversation ${conversation.id}: unreadCount = ${conversation.unreadCount}`
          );
          return sum + conversation.unreadCount;
        },
        0
      );
      console.log(
        "useMessageNotifications: Calculated unread count:",
        totalUnread
      );
      setUnreadCount(totalUnread);
    }
  }, [conversationsData]);

  // Listen for new message notifications from messaging socket
  useEffect(() => {
    if (!socket) {
      console.log("useMessageNotifications: No socket available");
      return;
    }

    console.log("useMessageNotifications: Setting up socket listeners");

    const handleMessageNotification = (notification: MessageNotification) => {
      console.log("Received message notification:", notification);

      // Update unread count
      setUnreadCount((prev) => prev + 1);

      // Add to recent notifications (keep only last 5)
      setRecentNotifications((prev) => [notification, ...prev.slice(0, 4)]);
    };

    const handleNewMessage = (message: any) => {
      console.log("New message received:", message);
      console.log("Message type:", message.type);
      console.log("Message content:", message.content);

      // Refresh conversations to get updated unread counts
      dispatch(messagingApi.util.invalidateTags(["Conversation"]));

      // Also add to recent notifications for self-sent messages
      if (message.conversationId) {
        setRecentNotifications((prev) => [
          {
            conversationId: message.conversationId,
            message: message,
            unreadCount: 0, // Self-sent messages don't count as unread
          },
          ...prev.slice(0, 4),
        ]);
      }
    };

    socket.on("message_notification", handleMessageNotification);
    socket.on("new_message", handleNewMessage);

    console.log("useMessageNotifications: Socket listeners set up");

    return () => {
      console.log("useMessageNotifications: Cleaning up socket listeners");
      socket.off("message_notification", handleMessageNotification);
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, dispatch]);

  const clearNotification = (conversationId: number) => {
    setRecentNotifications((prev) =>
      prev.filter((notif) => notif.conversationId !== conversationId)
    );
  };

  const clearAllNotifications = () => {
    setRecentNotifications([]);
  };

  return {
    unreadCount,
    recentNotifications,
    clearNotification,
    clearAllNotifications,
  };
};
