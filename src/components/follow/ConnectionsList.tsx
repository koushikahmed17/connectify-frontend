import React, { useState } from "react";
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
  useGetUserFollowersQuery,
  useGetUserFollowingQuery,
} from "../../redux/features/followApi";
import { getAvatarUrl, handleAvatarError } from "../../utils/avatarUtils";

interface ConnectionsListProps {
  userId?: number; // If provided, shows connections for that user, otherwise shows current user's connections
  type: "followers" | "following";
  title?: string;
}

const ConnectionsList: React.FC<ConnectionsListProps> = ({
  userId,
  type,
  title,
}) => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const isCurrentUser = !userId;

  const {
    data: followersData,
    isLoading: followersLoading,
    error: followersError,
  } = useGetFollowersQuery(
    { page, limit },
    { skip: !isCurrentUser || type !== "followers" }
  );

  const {
    data: followingData,
    isLoading: followingLoading,
    error: followingError,
  } = useGetFollowingQuery(
    { page, limit },
    { skip: !isCurrentUser || type !== "following" }
  );

  const {
    data: userFollowersData,
    isLoading: userFollowersLoading,
    error: userFollowersError,
  } = useGetUserFollowersQuery(
    { userId: userId!, page, limit },
    { skip: isCurrentUser || type !== "followers" }
  );

  const {
    data: userFollowingData,
    isLoading: userFollowingLoading,
    error: userFollowingError,
  } = useGetUserFollowingQuery(
    { userId: userId!, page, limit },
    { skip: isCurrentUser || type !== "following" }
  );

  const isLoading =
    followersLoading ||
    followingLoading ||
    userFollowersLoading ||
    userFollowingLoading;
  const error =
    followersError ||
    followingLoading ||
    userFollowersError ||
    userFollowingError;

  const data =
    type === "followers"
      ? isCurrentUser
        ? followersData
        : userFollowersData
      : isCurrentUser
      ? followingData
      : userFollowingData;

  const getDisplayName = (user: any) => {
    return user.profile?.displayName || user.username || "Unknown User";
  };

  const getConnectionUser = (connection: any) => {
    return type === "followers" ? connection.follower : connection.following;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load {type}</p>
      </div>
    );
  }

  if (!data?.[type]?.length) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">
          {type === "followers" ? "👥" : "👤"}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No {type} yet
        </h3>
        <p className="text-gray-500">
          {type === "followers"
            ? "No one is following you yet."
            : "You are not following anyone yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {title || `${type.charAt(0).toUpperCase() + type.slice(1)}`}
        </h2>
        <span className="text-sm text-gray-500">
          {data.pagination.total} {type.slice(0, -1)}
          {data.pagination.total !== 1 ? "s" : ""}
        </span>
      </div>

      {data[type].map((connection: any) => {
        const user = getConnectionUser(connection);
        return (
          <div
            key={connection.id}
            className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200"
          >
            {/* User Avatar */}
            <img
              src={getAvatarUrl(user, user?.username?.charAt(0).toUpperCase())}
              alt={getDisplayName(user)}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              onError={(e) =>
                handleAvatarError(e, user?.username?.charAt(0).toUpperCase())
              }
            />

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {getDisplayName(user)}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                @{user?.username}
              </p>
              <p className="text-xs text-gray-400">
                {type === "followers" ? "Following you" : "Following since"}{" "}
                {new Date(connection.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Action Button */}
            <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200">
              View Profile
            </button>
          </div>
        );
      })}

      {/* Pagination */}
      {data.pagination.pages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-gray-700">
            Page {page} of {data.pagination.pages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === data.pagination.pages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectionsList;
