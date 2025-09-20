import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  X,
  Heart,
  MessageCircle,
  UserPlus,
  Check,
  X as XIcon,
} from "lucide-react";
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
} from "../../../redux/features/notificationsApi";
import {
  useAcceptFollowRequestMutation,
  useRejectFollowRequestMutation,
  useFindFollowRequestByActorQuery,
} from "../../../redux/features/followApi";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../../hooks/useSocket";

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // WebSocket connection
  const { onNewNotification, offNewNotification, isConnected } = useSocket();

  const {
    data: notifications,
    isLoading,
    refetch,
  } = useGetNotificationsQuery(
    {
      page: 1,
      limit: 10,
    },
    {
      // No polling - using WebSocket for real-time updates
      pollingInterval: 0,
    }
  );

  const [markAsRead] = useMarkAsReadMutation();
  const [acceptFollowRequest] = useAcceptFollowRequestMutation();
  const [rejectFollowRequest] = useRejectFollowRequestMutation();

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // WebSocket real-time notification listener
  useEffect(() => {
    const handleNewNotification = (notification: any) => {
      console.log("Received real-time notification:", notification);
      // Refetch notifications to get the latest data
      refetch();
    };

    // Set up WebSocket listener
    onNewNotification(handleNewNotification);

    // Cleanup listener on unmount
    return () => {
      offNewNotification(handleNewNotification);
    };
  }, [onNewNotification, offNewNotification, refetch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: any) => {
    console.log("Notification clicked:", notification);

    // Mark as read
    try {
      await markAsRead(notification.id);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }

    // Navigate based on notification type
    if (
      (notification.type === "NEW_FOLLOW_REQUEST" ||
        notification.type === "FOLLOW_REQUEST_ACCEPTED") &&
      notification.actor?.id
    ) {
      // Navigate to user profile for follow requests and acceptances
      navigate(`/profile/${notification.actor.id}`);
    } else if (notification.payload?.relatedPostId) {
      // Navigate to post for other notifications
      navigate(`/post/${notification.payload.relatedPostId}`);
    } else {
      console.error("No valid navigation target found for notification");
    }

    setIsOpen(false);
  };

  const handleAcceptFollowRequest = async (
    e: React.MouseEvent,
    notification: any
  ) => {
    e.stopPropagation(); // Prevent notification click
    try {
      console.log("Accepting follow request:", notification);

      if (notification.payload?.followRequestId) {
        // Use the followRequestId if available
        await acceptFollowRequest({
          requestId: notification.payload.followRequestId,
        }).unwrap();
        console.log("Follow request accepted with requestId");
      } else if (notification.actor?.id) {
        // For older notifications without followRequestId, find the request by actor ID
        console.log(
          "No followRequestId found, trying to find request by actor ID"
        );

        // We need to make a direct API call to find the follow request
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const response = await fetch(
          `${baseUrl}/follow/request/by-actor/${notification.actor.id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            await acceptFollowRequest({
              requestId: data.data.id,
            }).unwrap();
            console.log("Follow request accepted with found requestId");
          } else {
            alert("Follow request not found or already processed");
            return;
          }
        } else {
          alert(
            "Unable to find follow request. Please visit the user's profile to manage the request."
          );
          return;
        }
      } else {
        console.error("No followRequestId or actor ID found");
        alert("Unable to process this follow request");
        return;
      }

      // Mark notification as read
      await markAsRead(notification.id);
      // Refetch notifications
      refetch();
    } catch (error) {
      console.error("Error accepting follow request:", error);
      alert("Failed to accept follow request. Please try again.");
    }
  };

  const handleRejectFollowRequest = async (
    e: React.MouseEvent,
    notification: any
  ) => {
    e.stopPropagation(); // Prevent notification click
    try {
      console.log("Rejecting follow request:", notification);

      if (notification.payload?.followRequestId) {
        // Use the followRequestId if available
        await rejectFollowRequest({
          requestId: notification.payload.followRequestId,
        }).unwrap();
        console.log("Follow request rejected with requestId");
      } else if (notification.actor?.id) {
        // For older notifications without followRequestId, find the request by actor ID
        console.log(
          "No followRequestId found, trying to find request by actor ID"
        );

        // We need to make a direct API call to find the follow request
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const response = await fetch(
          `${baseUrl}/follow/request/by-actor/${notification.actor.id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            await rejectFollowRequest({
              requestId: data.data.id,
            }).unwrap();
            console.log("Follow request rejected with found requestId");
          } else {
            alert("Follow request not found or already processed");
            return;
          }
        } else {
          alert(
            "Unable to find follow request. Please visit the user's profile to manage the request."
          );
          return;
        }
      } else {
        console.error("No followRequestId or actor ID found");
        alert("Unable to process this follow request");
        return;
      }

      // Mark notification as read
      await markAsRead(notification.id);
      // Refetch notifications
      refetch();
    } catch (error) {
      console.error("Error rejecting follow request:", error);
      alert("Failed to reject follow request. Please try again.");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_LIKE":
        return <Heart className="w-4 h-4 text-red-500" />;
      case "NEW_COMMENT":
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case "NEW_FOLLOW_REQUEST":
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case "FOLLOW_REQUEST_ACCEPTED":
        return <Check className="w-4 h-4 text-green-500" />;
      case "FOLLOW_REQUEST_REJECTED":
        return <XIcon className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationMessage = (notification: any) => {
    const actorName =
      notification.actor?.profile?.displayName ||
      notification.actor?.username ||
      "Someone";

    switch (notification.type) {
      case "NEW_LIKE":
        return `${actorName} liked your post`;
      case "NEW_COMMENT":
        return `${actorName} commented on your post`;
      case "NEW_FOLLOW_REQUEST":
        return `${actorName} sent you a follow request`;
      case "FOLLOW_REQUEST_ACCEPTED":
        return `${actorName} accepted your follow request`;
      case "FOLLOW_REQUEST_REJECTED":
        return `${actorName} rejected your follow request`;
      default:
        return notification.payload?.message || "New notification";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {notifications && notifications.data.some((n: any) => !n.isRead) && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        )}
        {/* Real-time indicator */}
        {isConnected && (
          <span
            className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
            }`}
            title={
              isConnected
                ? "Real-time updates active"
                : "Real-time updates disconnected"
            }
          ></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Refresh notifications"
                >
                  <div
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500 text-sm">
                  Loading notifications...
                </p>
              </div>
            ) : notifications && notifications.data.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.data
                  .filter(
                    (notification: any) => notification.type !== "NEW_MESSAGE"
                  )
                  .map((notification: any) => {
                    // Debug log for follow request notifications
                    if (notification.type === "NEW_FOLLOW_REQUEST") {
                      console.log("Follow request notification:", {
                        id: notification.id,
                        type: notification.type,
                        payload: notification.payload,
                        actor: notification.actor,
                        hasFollowRequestId:
                          !!notification.payload?.followRequestId,
                      });
                    }

                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.isRead ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">
                              {getNotificationMessage(notification)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimeAgo(notification.createdAt)}
                            </p>

                            {/* Follow request actions - only show for pending requests */}
                            {notification.type === "NEW_FOLLOW_REQUEST" &&
                              notification.payload?.status !== "ACCEPTED" &&
                              notification.payload?.status !== "REJECTED" && (
                                <div className="flex space-x-2 mt-2">
                                  <button
                                    onClick={(e) =>
                                      handleAcceptFollowRequest(e, notification)
                                    }
                                    className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition-colors"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Accept</span>
                                  </button>
                                  <button
                                    onClick={(e) =>
                                      handleRejectFollowRequest(e, notification)
                                    }
                                    className="flex items-center space-x-1 px-3 py-1 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors"
                                  >
                                    <XIcon className="w-3 h-3" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              )}
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            {/* Click to view profile for follow requests and acceptances */}
                            {(notification.type === "NEW_FOLLOW_REQUEST" ||
                              notification.type === "FOLLOW_REQUEST_ACCEPTED" ||
                              notification.type ===
                                "FOLLOW_REQUEST_REJECTED") &&
                              notification.actor?.id && (
                                <button
                                  onClick={() =>
                                    handleNotificationClick(notification)
                                  }
                                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  View Profile
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            )}
          </div>

          {notifications && notifications.data.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  // Mark all as read
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
