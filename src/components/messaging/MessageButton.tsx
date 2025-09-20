import React from "react";
import { MessageCircle } from "lucide-react";

interface MessageButtonProps {
  userId: number;
  onMessageClick: (userId: number) => void;
  className?: string;
}

const MessageButton: React.FC<MessageButtonProps> = ({
  userId,
  onMessageClick,
  className = "",
}) => {
  const handleClick = () => {
    console.log("MessageButton clicked for userId:", userId);
    onMessageClick(userId);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors ${className}`}
    >
      <MessageCircle className="w-4 h-4" />
      <span>Message</span>
    </button>
  );
};

export default MessageButton;
