import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useMessageNotifications } from "../../hooks/useMessageNotifications";
import MessengerModal from "./MessengerModal";

interface MessengerIconProps {
  className?: string;
}

const MessengerIcon: React.FC<MessengerIconProps> = ({ className = "" }) => {
  const { unreadCount } = useMessageNotifications();
  const [showMessenger, setShowMessenger] = useState(false);

  const handleClick = () => {
    console.log("MessengerIcon clicked - opening messenger modal");
    setShowMessenger(true);
  };

  const handleCloseMessenger = () => {
    setShowMessenger(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors ${className}`}
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <MessengerModal isOpen={showMessenger} onClose={handleCloseMessenger} />
    </>
  );
};

export default MessengerIcon;
