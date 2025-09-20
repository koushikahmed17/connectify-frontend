import React, { useState } from "react";
import {
  useGetFollowRequestsQuery,
  useAcceptFollowRequestMutation,
  useRejectFollowRequestMutation,
} from "../../redux/features/followApi";
import { getAvatarUrl, handleAvatarError } from "../../utils/avatarUtils";

const FollowRequests: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const {
    data: followRequestsData,
    isLoading,
    error,
  } = useGetFollowRequestsQuery({
    page,
    limit,
  });

  const [acceptFollowRequest, { isLoading: accepting }] =
    useAcceptFollowRequestMutation();
  const [rejectFollowRequest, { isLoading: rejecting }] =
    useRejectFollowRequestMutation();

  const handleAccept = async (requestId: number) => {
    try {
      await acceptFollowRequest({ requestId }).unwrap();
    } catch (error) {
      console.error("Failed to accept follow request:", error);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await rejectFollowRequest({ requestId }).unwrap();
    } catch (error) {
      console.error("Failed to reject follow request:", error);
    }
  };

  const getDisplayName = (user: any) => {
    return user.profile?.displayName || user.username || "Unknown User";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
              </div>
              <div className="flex space-x-2">
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load follow requests</p>
      </div>
    );
  }

  if (!followRequestsData?.requests.length) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">👥</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No follow requests
        </h3>
        <p className="text-gray-500">
          You don't have any pending follow requests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Follow Requests</h2>
        <span className="text-sm text-gray-500">
          {followRequestsData.pagination.total} request
          {followRequestsData.pagination.total !== 1 ? "s" : ""}
        </span>
      </div>

      {followRequestsData.requests.map((request) => (
        <div
          key={request.id}
          className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center space-x-4">
            {/* User Avatar */}
            <img
              src={getAvatarUrl(
                request.follower,
                request.follower?.username?.charAt(0).toUpperCase()
              )}
              alt={getDisplayName(request.follower)}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              onError={(e) =>
                handleAvatarError(
                  e,
                  request.follower?.username?.charAt(0).toUpperCase()
                )
              }
            />

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {getDisplayName(request.follower)}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                @{request.follower?.username}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleAccept(request.id)}
                disabled={accepting || rejecting}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {accepting ? "Accepting..." : "Accept"}
              </button>
              <button
                onClick={() => handleReject(request.id)}
                disabled={accepting || rejecting}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {rejecting ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {followRequestsData.pagination.pages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-gray-700">
            Page {page} of {followRequestsData.pagination.pages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === followRequestsData.pagination.pages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default FollowRequests;
