import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useDispatch } from "react-redux";
import { messagingApi } from "../redux/features/messagingApi";

interface MessagingSocket {
  socket: Socket | null;
  isConnected: boolean;
  typingUsers: Map<number, string[]>; // conversationId -> userIds
  joinConversation: (conversationId: number) => void;
  leaveConversation: (conversationId: number) => void;
  sendMessage: (message: any) => void;
  startTyping: (conversationId: number) => void;
  stopTyping: (conversationId: number) => void;
  markAsRead: (conversationId: number, messageId?: number) => void;
}

export const useMessagingSocket = (): MessagingSocket => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<number, string[]>>(
    new Map()
  );
  const dispatch = useDispatch();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      return;
    }

    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    try {
      const newSocket = io(`${baseUrl}/messaging`, {
        auth: { token },
        transports: ["websocket"],
      });

      newSocket.on("connect", () => {
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
      });

      newSocket.on("new_message", (message) => {
        // Force refetch of messages for this conversation
        dispatch(
          messagingApi.util.invalidateTags([
            { type: "Message", id: message.conversationId },
          ])
        );

        // Also invalidate conversations to update unread counts
        dispatch(messagingApi.util.invalidateTags(["Conversation"]));
      });

      newSocket.on("message_notification", (notification) => {
        // Invalidate conversations cache to update unread counts
        dispatch(messagingApi.util.invalidateTags(["Conversation"]));
      });

      newSocket.on("user_typing", (data) => {
        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          const conversationId = data.conversationId;
          const userId = data.userId.toString();

          if (data.isTyping) {
            const currentUsers = newMap.get(conversationId) || [];
            if (!currentUsers.includes(userId)) {
              newMap.set(conversationId, [...currentUsers, userId]);
            }
          } else {
            const currentUsers = newMap.get(conversationId) || [];
            newMap.set(
              conversationId,
              currentUsers.filter((id) => id !== userId)
            );
          }

          return newMap;
        });
      });

      newSocket.on("messages_read", (data) => {
        // Handle read receipts
      });

      newSocket.on("joined_conversation", (data) => {
        // Handle conversation join
      });

      newSocket.on("left_conversation", (data) => {
        // Handle conversation leave
      });

      newSocket.on("error", (error) => {
        console.error("Messaging socket error:", error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } catch (error) {
      console.error("Failed to create messaging socket:", error);
    }
  }, [dispatch]);

  const joinConversation = useCallback(
    (conversationId: number) => {
      if (socket) {
        socket.emit("join_conversation", { conversationId });
      }
    },
    [socket]
  );

  const leaveConversation = useCallback(
    (conversationId: number) => {
      if (socket) {
        socket.emit("leave_conversation", { conversationId });
      }
    },
    [socket]
  );

  const sendMessage = useCallback(
    (message: any) => {
      if (socket) {
        socket.emit("send_message", message);
      }
    },
    [socket]
  );

  const startTyping = useCallback(
    (conversationId: number) => {
      if (socket) {
        socket.emit("typing_start", { conversationId });
      }
    },
    [socket]
  );

  const stopTyping = useCallback(
    (conversationId: number) => {
      if (socket) {
        socket.emit("typing_stop", { conversationId });
      }
    },
    [socket]
  );

  const markAsRead = useCallback(
    (conversationId: number, messageId?: number) => {
      if (socket) {
        socket.emit("mark_read", { conversationId, messageId });
      }
    },
    [socket]
  );

  return {
    socket,
    isConnected,
    typingUsers,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
  };
};
