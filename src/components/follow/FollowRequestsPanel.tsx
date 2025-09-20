import React from "react";
import { UserPlus, Check, X } from "lucide-react";
import {
  useGetFollowRequestsQuery,
  useAcceptFollowRequestMutation,
  useRejectFollowRequestMutation,
} from "../../redux/features/followApi";

const FollowRequestsPanel: React.FC = () => {
  const {
    data: followRequests,
    isLoading,
    error,
    refetch,
  } = useGetFollowRequestsQuery({ page: 1, limit: 10 });

  // Debug logging
  console.log("FollowRequestsPanel - followRequests:", followRequests);
  console.log("FollowRequestsPanel - isLoading:", isLoading);
  console.log("FollowRequestsPanel - error:", error);

  const [acceptFollowRequest] = useAcceptFollowRequestMutation();
  const [rejectFollowRequest] = useRejectFollowRequestMutation();

  const handleAccept = async (requestId: number) => {
    try {
      await acceptFollowRequest({ requestId }).unwrap();
      console.log("Follow request accepted");
      refetch();
    } catch (error) {
      console.error("Error accepting follow request:", error);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await rejectFollowRequest({ requestId }).unwrap();
      console.log("Follow request rejected");
      refetch();
    } catch (error) {
      console.error("Error rejecting follow request:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-500 text-sm">Loading follow requests...</p>
      </div>
    );
  }

  if (
    !followRequests ||
    !followRequests.requests ||
    followRequests.requests.length === 0
  ) {
    return (
      <div className="p-4 text-center text-gray-500">
        <UserPlus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No pending follow requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Follow Requests ({followRequests.requests?.length || 0})
      </h3>
      {followRequests.requests?.map((request) => (
        <div
          key={request.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="flex items-center space-x-3">
            <img
              src={
                request.follower?.profile?.avatar?.url
                  ? request.follower.profile.avatar.url.startsWith("http")
                    ? request.follower.profile.avatar.url
                    : `${import.meta.env.VITE_API_URL}${
                        request.follower.profile.avatar.url
                      }`
                  : "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=687&q=80"
              }
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-medium text-gray-900">
                {request.follower?.profile?.displayName ||
                  request.follower?.username}
              </p>
              <p className="text-sm text-gray-500">
                @{request.follower?.username}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleAccept(request.id)}
              className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white text-sm rounded-full hover:bg-green-600 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Accept</span>
            </button>
            <button
              onClick={() => handleReject(request.id)}
              className="flex items-center space-x-1 px-3 py-1 bg-red-500 text-white text-sm rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Reject</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FollowRequestsPanel;
