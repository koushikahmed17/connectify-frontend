import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Clock } from "lucide-react";
import { useMessageNotifications } from "../../hooks/useMessageNotifications";
import { formatDistanceToNow } from "date-fns";

interface MessageNotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMessenger: () => void;
}

const MessageNotificationDropdown: React.FC<
  MessageNotificationDropdownProps
> = ({ isOpen, onClose, onOpenMessenger }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { recentNotifications, clearNotification, clearAllNotifications } =
    useMessageNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleNotificationClick = (conversationId: number) => {
    // Clear the specific notification
    clearNotification(conversationId);

    // Open messenger (this will be handled by parent component)
    onOpenMessenger();

    // Close the dropdown
    onClose();
  };

  const handleClearAll = () => {
    clearAllNotifications();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
            Messages
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {recentNotifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No new messages</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentNotifications.map((notification, index) => (
              <div
                key={`${notification.conversationId}-${index}`}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() =>
                  handleNotificationClick(notification.conversationId)
                }
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        New message
                      </p>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Just now</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {notification.message?.content || "Sent a message"}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        View conversation
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {recentNotifications.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleClearAll}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Clear all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageNotificationDropdown;




