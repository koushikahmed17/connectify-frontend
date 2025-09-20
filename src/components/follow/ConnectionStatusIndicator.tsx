import React from "react";
import { useGetConnectionStatusQuery } from "../../redux/features/followApi";

interface ConnectionStatusIndicatorProps {
  userId: number;
  showText?: boolean;
  className?: string;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  userId,
  showText = true,
  className = "",
}) => {
  const { data: connectionStatus, isLoading } = useGetConnectionStatusQuery({
    userId,
  });

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
        {showText && <span className="text-xs text-gray-400">Loading...</span>}
      </div>
    );
  }

  if (!connectionStatus) {
    return null;
  }

  const getStatusInfo = () => {
    switch (connectionStatus.status) {
      case "FOLLOWING":
        return {
          icon: "✓",
          text: "Connected",
          color: "text-green-600",
          bgColor: "bg-green-100",
        };
      case "PENDING":
        return {
          icon: "⏳",
          text: "Requested",
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
        };
      case "NOT_FOLLOWING":
        return {
          icon: "○",
          text: "Not connected",
          color: "text-gray-500",
          bgColor: "bg-gray-100",
        };
      case "SELF":
        return {
          icon: "👤",
          text: "You",
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        };
      default:
        return {
          icon: "○",
          text: "Unknown",
          color: "text-gray-500",
          bgColor: "bg-gray-100",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div
        className={`w-2 h-2 rounded-full ${statusInfo.bgColor} flex items-center justify-center`}
      >
        <span className="text-xs">{statusInfo.icon}</span>
      </div>
      {showText && (
        <span className={`text-xs font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;
