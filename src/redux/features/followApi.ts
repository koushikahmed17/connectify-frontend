import { baseApi } from "../baseApi";

export interface FollowRequest {
  id: number;
  followerId: number;
  followingId: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  follower?: {
    id: number;
    username: string;
    email: string;
    profile?: {
      id: number;
      displayName?: string;
      avatar?: {
        url: string;
      };
    };
  };
  following?: {
    id: number;
    username: string;
    email: string;
    profile?: {
      id: number;
      displayName?: string;
      avatar?: {
        url: string;
      };
    };
  };
}

export interface Connection {
  id: number;
  followerId: number;
  followingId: number;
  createdAt: string;
  follower?: {
    id: number;
    username: string;
    email: string;
    profile?: {
      id: number;
      displayName?: string;
      avatar?: {
        url: string;
      };
    };
  };
  following?: {
    id: number;
    username: string;
    email: string;
    profile?: {
      id: number;
      displayName?: string;
      avatar?: {
        url: string;
      };
    };
  };
}

export interface ConnectionStatus {
  status: "SELF" | "FOLLOWING" | "PENDING" | "NOT_FOLLOWING";
  isConnected: boolean;
  hasPendingRequest: boolean;
}

export interface UserStats {
  followersCount: number;
  followingCount: number;
}

export interface FollowRequestResponse {
  requests: FollowRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface FollowersResponse {
  followers: Connection[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface FollowingResponse {
  following: Connection[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const followApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Send follow request
    sendFollowRequest: builder.mutation<FollowRequest, { followingId: number }>(
      {
        query: (body) => ({
          url: "/follow/request",
          method: "POST",
          body,
        }),
        invalidatesTags: [
          "FollowRequests",
          "Connections",
          "UserStats",
          "ConnectionStatus",
        ],
      }
    ),

    // Accept follow request
    acceptFollowRequest: builder.mutation<Connection, { requestId: number }>({
      query: ({ requestId }) => ({
        url: `/follow/request/${requestId}/accept`,
        method: "PUT",
      }),
      invalidatesTags: ["FollowRequests", "Connections", "UserStats"],
    }),

    // Reject follow request
    rejectFollowRequest: builder.mutation<FollowRequest, { requestId: number }>(
      {
        query: ({ requestId }) => ({
          url: `/follow/request/${requestId}/reject`,
          method: "PUT",
        }),
        invalidatesTags: ["FollowRequests"],
      }
    ),

    // Unfollow user
    unfollowUser: builder.mutation<
      { message: string },
      { followingId: number }
    >({
      query: ({ followingId }) => ({
        url: `/follow/unfollow/${followingId}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        "FollowRequests",
        "Connections",
        "UserStats",
        "ConnectionStatus",
      ],
    }),

    // Get follow requests received
    getFollowRequests: builder.query<
      FollowRequestResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: "/follow/requests/received",
        method: "GET",
        params: { page, limit },
      }),
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: FollowRequestResponse;
      }) => {
        return response.data;
      },
      providesTags: ["FollowRequests"],
    }),

    // Get follow requests sent
    getSentFollowRequests: builder.query<
      FollowRequestResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: "/follow/requests/sent",
        method: "GET",
        params: { page, limit },
      }),
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: FollowRequestResponse;
      }) => {
        return response.data;
      },
      providesTags: ["FollowRequests"],
    }),

    // Get followers of current user
    getFollowers: builder.query<
      FollowersResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: "/follow/followers",
        method: "GET",
        params: { page, limit },
      }),
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: FollowersResponse;
      }) => {
        return response.data;
      },
      providesTags: ["Connections"],
    }),

    // Get following of current user
    getFollowing: builder.query<
      FollowingResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: "/follow/following",
        method: "GET",
        params: { page, limit },
      }),
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: FollowingResponse;
      }) => {
        return response.data;
      },
      providesTags: ["Connections"],
    }),

    // Get followers of specific user
    getUserFollowers: builder.query<
      FollowersResponse,
      { userId: number; page?: number; limit?: number }
    >({
      query: ({ userId, page = 1, limit = 10 }) => ({
        url: `/follow/followers/${userId}`,
        method: "GET",
        params: { page, limit },
      }),
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: FollowersResponse;
      }) => {
        return response.data;
      },
      providesTags: ["Connections"],
    }),

    // Get following of specific user
    getUserFollowing: builder.query<
      FollowingResponse,
      { userId: number; page?: number; limit?: number }
    >({
      query: ({ userId, page = 1, limit = 10 }) => ({
        url: `/follow/following/${userId}`,
        method: "GET",
        params: { page, limit },
      }),
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: FollowingResponse;
      }) => {
        return response.data;
      },
      providesTags: ["Connections"],
    }),

    // Get connection status between current user and another user
    getConnectionStatus: builder.query<ConnectionStatus, { userId: number }>({
      query: ({ userId }) => ({
        url: `/follow/status/${userId}`,
        method: "GET",
      }),
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: ConnectionStatus;
      }) => {
        return response.data;
      },
      providesTags: ["ConnectionStatus"],
    }),

    // Get user stats
    getUserStats: builder.query<UserStats, { userId: number }>({
      query: ({ userId }) => ({
        url: `/follow/stats/${userId}`,
        method: "GET",
      }),
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: UserStats;
      }) => {
        return response.data;
      },
      providesTags: ["UserStats"],
    }),

    // Find follow request by actor ID (for older notifications)
    findFollowRequestByActor: builder.query<
      FollowRequest,
      { followerId: number }
    >({
      query: ({ followerId }) => ({
        url: `/follow/request/by-actor/${followerId}`,
        method: "GET",
      }),
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: FollowRequest;
      }) => {
        return response.data;
      },
      providesTags: ["FollowRequests"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useSendFollowRequestMutation,
  useAcceptFollowRequestMutation,
  useRejectFollowRequestMutation,
  useUnfollowUserMutation,
  useGetFollowRequestsQuery,
  useGetSentFollowRequestsQuery,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useGetUserFollowersQuery,
  useGetUserFollowingQuery,
  useGetConnectionStatusQuery,
  useGetUserStatsQuery,
  useFindFollowRequestByActorQuery,
} = followApi;
