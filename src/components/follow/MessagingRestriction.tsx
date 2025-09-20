import React from "react";
import { useGetConnectionStatusQuery } from "../../redux/features/followApi";
import { Link } from "react-router-dom";

interface MessagingRestrictionProps {
  userId: number;
  username?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const MessagingRestriction: React.FC<MessagingRestrictionProps> = ({
  userId,
  username,
  children,
  fallback,
}) => {
  const { data: connectionStatus, isLoading } = useGetConnectionStatusQuery({
    userId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If connected, show the children (message button/interface)
  if (connectionStatus?.isConnected) {
    return <>{children}</>;
  }

  // If not connected, show restriction message
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-gray-400 text-4xl mb-3">💬</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Connect to Message
      </h3>
      <p className="text-gray-500 mb-4">
        You need to follow {username || "this user"} and have your follow
        request accepted before you can send messages.
      </p>
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
        <span>Follow them first to start messaging</span>
      </div>
    </div>
  );
};

export default MessagingRestriction;
