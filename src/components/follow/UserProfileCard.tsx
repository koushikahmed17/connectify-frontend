import React, { useState } from "react";
import {
  useGetUserStatsQuery,
  useGetConnectionStatusQuery,
} from "../../redux/features/followApi";
import { getAvatarUrl, handleAvatarError } from "../../utils/avatarUtils";
import FollowButton from "./FollowButton";
import ConnectionsList from "./ConnectionsList";

interface UserProfileCardProps {
  user: {
    id: number;
    username: string;
    email: string;
    profile?: {
      id: number;
      displayName?: string;
      bio?: string;
      location?: string;
      website?: string;
      avatar?: {
        url: string;
      };
    };
  };
  showConnections?: boolean;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  showConnections = true,
}) => {
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    "followers"
  );

  const { data: stats, isLoading: statsLoading } = useGetUserStatsQuery({
    userId: user.id,
  });
  const { data: connectionStatus, isLoading: statusLoading } =
    useGetConnectionStatusQuery({ userId: user.id });

  const getDisplayName = () => {
    return user.profile?.displayName || user.username || "Unknown User";
  };

  const canMessage = connectionStatus?.isConnected || false;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Profile Header */}
      <div className="relative">
        {/* Cover Photo Placeholder */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex items-start justify-between -mt-16">
            {/* Avatar */}
            <div className="relative">
              <img
                src={getAvatarUrl(user, user.username?.charAt(0).toUpperCase())}
                alt={getDisplayName()}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                onError={(e) =>
                  handleAvatarError(e, user.username?.charAt(0).toUpperCase())
                }
              />
            </div>

            {/* Follow Button */}
            <div className="mt-4">
              <FollowButton
                userId={user.id}
                username={user.username}
                size="md"
              />
            </div>
          </div>

          {/* User Details */}
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {getDisplayName()}
            </h1>
            <p className="text-gray-500">@{user.username}</p>

            {user.profile?.bio && (
              <p className="mt-2 text-gray-700">{user.profile.bio}</p>
            )}

            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              {user.profile?.location && (
                <span>📍 {user.profile.location}</span>
              )}
              {user.profile?.website && (
                <a
                  href={user.profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  🌐 Website
                </a>
              )}
            </div>
          </div>

          {/* Stats */}
          {!statsLoading && stats && (
            <div className="flex items-center space-x-6 mt-4">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">
                  {stats.followersCount}
                </div>
                <div className="text-sm text-gray-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">
                  {stats.followingCount}
                </div>
                <div className="text-sm text-gray-500">Following</div>
              </div>
            </div>
          )}

          {/* Connection Status */}
          {!statusLoading && connectionStatus && (
            <div className="mt-4">
              {connectionStatus.status === "FOLLOWING" && (
                <div className="flex items-center space-x-2 text-green-600">
                  <span className="text-sm">✓ Connected</span>
                  {canMessage && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Can message
                    </span>
                  )}
                </div>
              )}
              {connectionStatus.status === "PENDING" && (
                <div className="flex items-center space-x-2 text-yellow-600">
                  <span className="text-sm">⏳ Follow request pending</span>
                </div>
              )}
              {connectionStatus.status === "NOT_FOLLOWING" && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <span className="text-sm">Not connected</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Connections Tabs */}
      {showConnections && (
        <div className="border-t border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("followers")}
              className={`flex-1 px-4 py-3 text-sm font-medium text-center ${
                activeTab === "followers"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Followers
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`flex-1 px-4 py-3 text-sm font-medium text-center ${
                activeTab === "following"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Following
            </button>
          </div>

          <div className="p-6">
            <ConnectionsList userId={user.id} type={activeTab} />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileCard;
