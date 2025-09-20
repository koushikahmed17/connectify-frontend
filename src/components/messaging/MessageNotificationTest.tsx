import React from "react";
import { useMessagingSocket } from "../../hooks/useMessagingSocket";

const MessageNotificationTest: React.FC = () => {
  const { socket } = useMessagingSocket();

  const testMessageNotification = () => {
    if (socket) {
      // Simulate a message notification for testing
      const testNotification = {
        conversationId: 1,
        message: {
          id: 999,
          content: "Test message notification",
          conversationId: 1,
          senderId: 2,
          type: "TEXT",
          createdAt: new Date().toISOString(),
        },
        unreadCount: 1,
      };

      console.log("Sending test message notification:", testNotification);

      // Manually trigger the event
      socket.emit("test_message_notification", testNotification);
    } else {
      console.log("No socket available for testing");
    }
  };

  const testNewMessage = () => {
    if (socket) {
      // Simulate a new message for testing
      const testMessage = {
        id: 998,
        content: "Test new message",
        conversationId: 1,
        senderId: 1,
        type: "TEXT",
        createdAt: new Date().toISOString(),
      };

      console.log("Sending test new message:", testMessage);

      // Manually trigger the event
      socket.emit("test_new_message", testMessage);
    } else {
      console.log("No socket available for testing");
    }
  };

  if (!socket) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
        <p className="text-yellow-800">WebSocket not connected</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-100 border border-blue-400 rounded-lg">
      <h3 className="text-blue-800 font-semibold mb-2">
        Message Notification Test
      </h3>
      <div className="space-x-2">
        <button
          onClick={testMessageNotification}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Test Message Notification
        </button>
        <button
          onClick={testNewMessage}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Test New Message
        </button>
      </div>
    </div>
  );
};

export default MessageNotificationTest;




