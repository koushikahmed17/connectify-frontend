import React, { useState } from "react";
import {
  useSendFollowRequestMutation,
  useAcceptFollowRequestMutation,
  useRejectFollowRequestMutation,
  useUnfollowUserMutation,
  useGetConnectionStatusQuery,
} from "../../redux/features/followApi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/Store";

interface FollowButtonProps {
  userId: number;
  username?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  username,
  className = "",
  size = "md",
  showText = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const user = useSelector((state: RootState) => state.user);

  // Debug logging
  console.log("FollowButton Debug:", {
    userId,
    user,
    isAuthenticated: user.isAuthenticated,
    currentUserId: user.id,
    isSelf: user.id === userId,
  });

  const {
    data: connectionStatus,
    isLoading: statusLoading,
    refetch: refetchConnectionStatus,
  } = useGetConnectionStatusQuery(
    { userId },
    { skip: !user.isAuthenticated || user.id === userId }
  );

  console.log(
    "Connection Status:",
    connectionStatus,
    "Loading:",
    statusLoading
  );

  const [sendFollowRequest] = useSendFollowRequestMutation();
  const [acceptFollowRequest] = useAcceptFollowRequestMutation();
  const [rejectFollowRequest] = useRejectFollowRequestMutation();
  const [unfollowUser] = useUnfollowUserMutation();

  // Define all helper functions first
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-3 py-1 text-sm";
      case "lg":
        return "px-6 py-3 text-lg";
      default:
        return "px-4 py-2 text-base";
    }
  };

  const getButtonContent = () => {
    if (!connectionStatus) return "Follow";

    console.log("Button content - status:", connectionStatus.status);

    switch (connectionStatus.status) {
      case "FOLLOWING":
        return showText ? "Following" : "✓";
      case "PENDING":
        return showText ? "Requested" : "⏳";
      case "NOT_FOLLOWING":
        return showText ? "Follow" : "+";
      default:
        return "Follow";
    }
  };

  const getButtonClasses = () => {
    const baseClasses = `rounded-full font-medium transition-all duration-200 ${getSizeClasses()} ${className}`;

    if (isLoading) {
      return `${baseClasses} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }

    if (!connectionStatus) {
      return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600`;
    }

    console.log("Button classes - status:", connectionStatus.status);

    switch (connectionStatus.status) {
      case "FOLLOWING":
        return `${baseClasses} bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600`;
      case "PENDING":
        return `${baseClasses} bg-yellow-100 text-yellow-700 hover:bg-yellow-200`;
      case "NOT_FOLLOWING":
        return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600`;
      default:
        return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600`;
    }
  };

  // Define handler functions
  const handleFollow = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await sendFollowRequest({ followingId: userId }).unwrap();
      console.log("Follow request sent successfully!");

      // Immediately refetch connection status to update button state
      refetchConnectionStatus();
    } catch (error: any) {
      console.error("Failed to send follow request:", error);

      // Handle specific error cases
      if (error?.status === 409) {
        const errorMessage =
          error?.data?.message || "Follow request already exists";
        console.log("Conflict:", errorMessage);

        // If it's a conflict, refetch to get the current status
        refetchConnectionStatus();
      } else {
        console.error("Unexpected error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await unfollowUser({ followingId: userId }).unwrap();
      console.log("Successfully unfollowed user!");

      // Immediately refetch connection status to update button state
      refetchConnectionStatus();
    } catch (error: any) {
      console.error("Failed to unfollow user:", error);

      // Handle specific error cases
      if (error?.status === 404) {
        console.log("User not found or not following");
      } else {
        console.error("Unexpected error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Note: This would need the requestId, which we'd need to get from the follow requests
      // For now, we'll just show a message that this needs to be handled differently
      console.log("Accept follow request - needs requestId");
    } catch (error) {
      console.error("Failed to accept follow request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Note: This would need the requestId, which we'd need to get from the follow requests
      // For now, we'll just show a message that this needs to be handled differently
      console.log("Reject follow request - needs requestId");
    } catch (error) {
      console.error("Failed to reject follow request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    console.log("FollowButton clicked!", { connectionStatus, isLoading });

    // If loading, don't do anything
    if (isLoading) {
      console.log("Button is loading, ignoring click");
      return;
    }

    // If no connection status, assume we can follow
    if (!connectionStatus) {
      console.log("No connection status, calling handleFollow");
      handleFollow();
      return;
    }

    console.log("Handle click - status:", connectionStatus.status);

    switch (connectionStatus.status) {
      case "FOLLOWING":
        console.log("Currently following, calling handleUnfollow");
        handleUnfollow();
        break;
      case "NOT_FOLLOWING":
        console.log("Not following, calling handleFollow");
        handleFollow();
        break;
      case "PENDING":
        console.log("Request pending, no action available");
        // Pending requests should be handled in a different component
        break;
      default:
        console.log("Unknown status, calling handleFollow");
        handleFollow();
        break;
    }
  };

  // Don't show button for self or if not authenticated
  if (!user.isAuthenticated) {
    console.log("FollowButton: User not authenticated, hiding button");
    return null;
  }

  // Don't show button for self
  if (user.id === userId) {
    console.log("FollowButton: User is viewing own profile, hiding button");
    return null;
  }

  console.log("FollowButton: Should show button for user", userId);

  if (statusLoading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded-full ${getSizeClasses()}`}
      ></div>
    );
  }

  // If no connection status, show a basic follow button
  if (!connectionStatus) {
    console.log(
      "FollowButton: No connection status, showing basic follow button"
    );
    return (
      <button
        onClick={handleFollow}
        disabled={isLoading}
        className={`rounded-full font-medium transition-all duration-200 ${getSizeClasses()} ${className} ${
          isLoading
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            {showText && <span>Loading...</span>}
          </div>
        ) : (
          "Follow"
        )}
      </button>
    );
  }

  console.log(
    "FollowButton: Rendering main button with status:",
    connectionStatus?.status
  );

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || connectionStatus?.status === "PENDING"}
      className={getButtonClasses()}
      style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          {showText && <span>Loading...</span>}
        </div>
      ) : (
        getButtonContent()
      )}
    </button>
  );
};

export default FollowButton;
