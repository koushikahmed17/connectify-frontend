import { baseApi } from "../baseApi";

export interface Notification {
  id: number;
  type:
    | "NEW_LIKE"
    | "NEW_COMMENT"
    | "NEW_FRIEND_REQUEST"
    | "FRIEND_REQUEST_ACCEPTED"
    | "NEW_MESSAGE"
    | "MENTION"
    | "FOLLOW"
    | "SYSTEM";
  payload: {
    title: string;
    message: string;
    relatedUserId?: number;
    relatedPostId?: number;
    relatedCommentId?: number;
  };
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
  user?: {
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
    // Get user notifications
    getNotifications: build.query<
      Notification[],
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: "/notifications",
        method: "GET",
        params: { page, limit },
        credentials: "include",
      }),
      providesTags: ["Notification"],
    }),

    // Get unread count
    getUnreadCount: build.query<{ count: number }, void>({
      query: () => ({
        url: "/notifications/unread-count",
        method: "GET",
        credentials: "include",
      }),
      providesTags: ["Notification"],
    }),

    // Mark notification as read
    markAsRead: build.mutation<void, number>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: "PUT",
        credentials: "include",
      }),
      invalidatesTags: ["Notification"],
    }),

    // Mark all notifications as read
    markAllAsRead: build.mutation<void, void>({
      query: () => ({
        url: "/notifications/mark-all-read",
        method: "PUT",
        credentials: "include",
      }),
      invalidatesTags: ["Notification"],
    }),

    // Delete notification
    deleteNotification: build.mutation<void, number>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: "DELETE",
        credentials: "include",
      }),
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
