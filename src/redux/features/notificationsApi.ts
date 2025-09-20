import { baseApi } from "../baseApi";

export interface Notification {
  id: number;
  type: string;
  payload: any;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: number;
    username: string;
    profile?: {
      displayName?: string;
      avatar?: {
        url: string;
      };
    };
  };
  user: {
    id: number;
    username: string;
    profile?: {
      displayName?: string;
      avatar?: {
        url: string;
      };
    };
  };
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Get notifications
    getNotifications: build.query<
      {
        data: Notification[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      },
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: "/notifications",
        method: "GET",
        params: { page, limit },
        credentials: "include",
      }),
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return {
          data: [],
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        };
      },
      providesTags: ["Notification"],
    }),

    // Get unread count
    getUnreadCount: build.query<{ count: number }, void>({
      query: () => ({
        url: "/notifications/unread-count",
        method: "GET",
        credentials: "include",
      }),
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return { count: 0 };
      },
      providesTags: ["Notification"],
    }),

    // Mark notification as read
    markAsRead: build.mutation<{ message: string }, number>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: "PUT",
        credentials: "include",
      }),
      transformResponse: (response: any) => {
        if (response.success) {
          return response;
        }
        return { message: "Failed to mark as read" };
      },
      invalidatesTags: ["Notification"],
    }),

    // Mark all notifications as read
    markAllAsRead: build.mutation<{ message: string }, void>({
      query: () => ({
        url: "/notifications/mark-all-read",
        method: "PUT",
        credentials: "include",
      }),
      transformResponse: (response: any) => {
        if (response.success) {
          return response;
        }
        return { message: "Failed to mark all as read" };
      },
      invalidatesTags: ["Notification"],
    }),

    // Delete notification
    deleteNotification: build.mutation<{ message: string }, number>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: "DELETE",
        credentials: "include",
      }),
      transformResponse: (response: any) => {
        if (response.success) {
          return response;
        }
        return { message: "Failed to delete notification" };
      },
      invalidatesTags: ["Notification"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;
