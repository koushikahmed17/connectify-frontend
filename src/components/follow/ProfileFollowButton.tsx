import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  useSendFollowRequestMutation,
  useAcceptFollowRequestMutation,
  useRejectFollowRequestMutation,
  useUnfollowUserMutation,
  useGetConnectionStatusQuery,
  useFindFollowRequestByActorQuery,
} from "../../redux/features/followApi";

interface ProfileFollowButtonProps {
  userId: number;
  username?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const ProfileFollowButton: React.FC<ProfileFollowButtonProps> = ({
  userId,
  username,
  className = "",
  size = "md",
  showText = true,
}) => {
  // ALL HOOKS MUST BE CALLED FIRST - NO CONDITIONAL LOGIC BEFORE THIS
  const [isLoading, setIsLoading] = useState(false);

  const user = useSelector((state: RootState) => state.user);

  // Get connection status (for normal follow/unfollow)
  const {
    data: connectionStatus,
    isLoading: statusLoading,
    refetch: refetchConnectionStatus,
  } = useGetConnectionStatusQuery(
    { userId },
    {
      skip: !user.id || !userId,
      refetchOnMountOrArgChange: true,
    }
  );

  // Get follow request data (for accept/reject buttons)
  const {
    data: followRequestData,
    isLoading: requestLoading,
    error: requestError,
  } = useFindFollowRequestByActorQuery(
    { followerId: user.id },
    {
      skip: !user.id || !userId || connectionStatus?.status !== "PENDING",
      errorPolicy: "all",
    }
  );

  // Mutations
  const [sendFollowRequest] = useSendFollowRequestMutation();
  const [acceptFollowRequest] = useAcceptFollowRequestMutation();
  const [rejectFollowRequest] = useRejectFollowRequestMutation();
  const [unfollowUser] = useUnfollowUserMutation();

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-3 py-1 text-xs";
      case "lg":
        return "px-6 py-3 text-base";
      default:
        return "px-4 py-2 text-sm";
    }
  };

  // Don't render if no user or same user
  if (!user.id || !userId || user.id === userId) {
    return null;
  }

  // Show loading state
  if (statusLoading) {
    return (
      <button
        disabled
        className={`rounded-full font-medium transition-all duration-200 ${getSizeClasses()} bg-gray-300 text-gray-500 cursor-not-allowed ${className}`}
      >
        {showText ? "Loading..." : "..."}
      </button>
    );
  }

  // Handle follow request
  const handleFollow = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await sendFollowRequest({ followingId: userId }).unwrap();
      console.log("Follow request sent successfully!");
      // Force refetch the connection status
      await refetchConnectionStatus();
    } catch (error: any) {
      console.error("Failed to send follow request:", error);
      console.error("Error details:", error?.data);

      // For 409 errors, refetch status to get the correct state
      if (error?.status === 409) {
        console.log("409 error - refetching connection status");
        const result = await refetchConnectionStatus();
        console.log("Connection status after 409 refetch:", result.data);
        // Don't show alert for 409, just update the UI
        return;
      }

      // Show specific error message for other errors
      const errorMessage =
        error?.data?.message ||
        "Failed to send follow request. Please try again.";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle unfollow
  const handleUnfollow = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await unfollowUser({ followingId: userId }).unwrap();
      console.log("Successfully unfollowed user!");
      // Force refetch the connection status
      await refetchConnectionStatus();
    } catch (error: any) {
      console.error("Failed to unfollow user:", error);
      alert("Failed to unfollow user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle accept follow request
  const handleAcceptRequest = async () => {
    if (isLoading || !followRequestData) return;

    setIsLoading(true);
    try {
      await acceptFollowRequest({ requestId: followRequestData.id }).unwrap();
      console.log("Follow request accepted successfully!");
      // Force refetch the connection status
      await refetchConnectionStatus();
    } catch (error: any) {
      console.error("Failed to accept follow request:", error);
      alert("Failed to accept follow request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reject follow request
  const handleRejectRequest = async () => {
    if (isLoading || !followRequestData) return;

    setIsLoading(true);
    try {
      await rejectFollowRequest({ requestId: followRequestData.id }).unwrap();
      console.log("Follow request rejected successfully!");
      // Force refetch the connection status
      await refetchConnectionStatus();
    } catch (error: any) {
      console.error("Failed to reject follow request:", error);
      alert("Failed to reject follow request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show accept/reject buttons for pending requests (when someone wants to follow you)
  if (connectionStatus?.status === "PENDING" && followRequestData) {
    return (
      <div className="flex space-x-2">
        <button
          onClick={handleAcceptRequest}
          disabled={isLoading}
          className={`rounded-full font-medium transition-all duration-200 ${getSizeClasses()} bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 ${className}`}
        >
          {showText ? "Accept" : "✓"}
        </button>
        <button
          onClick={handleRejectRequest}
          disabled={isLoading}
          className={`rounded-full font-medium transition-all duration-200 ${getSizeClasses()} bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 ${className}`}
        >
          {showText ? "Reject" : "✗"}
        </button>
      </div>
    );
  }

  // Normal follow button logic
  const getButtonContent = () => {
    console.log("ProfileFollowButton Debug:", {
      userId,
      connectionStatus,
      statusLoading,
      user: user.id,
    });

    if (!connectionStatus) return "Follow";

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

  const handleClick = () => {
    if (isLoading) return;

    if (!connectionStatus) {
      handleFollow();
      return;
    }

    switch (connectionStatus.status) {
      case "FOLLOWING":
        handleUnfollow();
        break;
      case "NOT_FOLLOWING":
        handleFollow();
        break;
      case "PENDING":
        // No action for pending requests (we show Accept/Reject above)
        break;
      default:
        handleFollow();
        break;
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || connectionStatus?.status === "PENDING"}
      className={getButtonClasses()}
    >
      {isLoading ? (showText ? "Loading..." : "...") : getButtonContent()}
    </button>
  );
};

export default ProfileFollowButton;
