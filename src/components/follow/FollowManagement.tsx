import React, { useState } from "react";
import FollowRequests from "./FollowRequests";
import ConnectionsList from "./ConnectionsList";
import {
  useGetFollowRequestsQuery,
  useGetFollowersQuery,
  useGetFollowingQuery,
} from "../../redux/features/followApi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/Store";

const FollowManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "requests" | "followers" | "following"
  >("requests");

  // Get current user
  const currentUser = useSelector((state: RootState) => state.user);

  // Get data for counts
  const {
    data: followRequestsData,
    isLoading: requestsLoading,
    error: requestsError,
  } = useGetFollowRequestsQuery(
    { page: 1, limit: 1 },
    { skip: !currentUser?.id }
  );

  const {
    data: followersData,
    isLoading: followersLoading,
    error: followersError,
  } = useGetFollowersQuery({ page: 1, limit: 1 }, { skip: !currentUser?.id });

  const {
    data: followingData,
    isLoading: followingLoading,
    error: followingError,
  } = useGetFollowingQuery({ page: 1, limit: 1 }, { skip: !currentUser?.id });

  const isLoading = requestsLoading || followersLoading || followingLoading;
  const hasError = requestsError || followersError || followingError;

  // Show message if user is not authenticated
  if (!currentUser?.id) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Connections
          </h1>
          <p className="text-gray-600 text-sm md:text-base mb-4">
            Manage your follow requests and connections
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-500 text-6xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-yellow-900 mb-2">
            Authentication Required
          </h3>
          <p className="text-yellow-700">
            Please log in to view your connections.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Connections
          </h1>
          <p className="text-gray-600 text-sm md:text-base mb-4">
            Manage your follow requests and connections
          </p>
        </div>

        {/* Loading Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 animate-pulse"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded w-8"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Tabs */}
        <div className="border-b border-gray-200 mb-4 md:mb-6">
          <div className="flex space-x-4 md:space-x-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="py-2 px-1">
                <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[400px] p-4 md:p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (hasError) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Connections
          </h1>
          <p className="text-gray-600 text-sm md:text-base mb-4">
            Manage your follow requests and connections
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Failed to load connections
          </h3>
          <p className="text-red-700 mb-4">
            There was an error loading your connection data. Please try
            refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "requests",
      label: "Follow Requests",
      count: followRequestsData?.pagination?.total ?? 0,
    },
    {
      id: "followers",
      label: "Followers",
      count: followersData?.pagination?.total ?? 0,
    },
    {
      id: "following",
      label: "Following",
      count: followingData?.pagination?.total ?? 0,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Connections
        </h1>
        <p className="text-gray-600 text-sm md:text-base mb-4">
          Manage your follow requests and connections
        </p>

        {/* Summary Stats */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">📥</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">
                    Follow Requests
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {followRequestsData?.pagination?.total ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">👥</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">
                    Followers
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {followersData?.pagination?.total ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">👤</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">
                    Following
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {followingData?.pagination?.total ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-4 md:mb-6">
        <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              {isLoading ? (
                <span className="ml-2 w-4 h-4 bg-gray-200 rounded-full animate-pulse"></span>
              ) : tab.count > 0 ? (
                <span
                  className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[400px]">
        {activeTab === "requests" && (
          <div className="p-4 md:p-6">
            <FollowRequests />
          </div>
        )}

        {activeTab === "followers" && (
          <div className="p-4 md:p-6">
            <ConnectionsList type="followers" />
          </div>
        )}

        {activeTab === "following" && (
          <div className="p-4 md:p-6">
            <ConnectionsList type="following" />
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowManagement;
