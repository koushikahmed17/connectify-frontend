import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface Conversation {
  id: number;
  isGroup: boolean;
  title?: string;
  createdAt: string;
  lastMessageAt?: string;
  participants: {
    id: number;
    user: {
      id: number;
      username: string;
      profile: {
        displayName: string;
        avatar?: {
          url: string;
        };
      };
    };
    joinedAt: string;
    lastReadAt?: string;
    isMuted: boolean;
  }[];
  lastMessage?: {
    id: number;
    content?: string;
    type: string;
    createdAt: string;
    sender: {
      id: number;
      username: string;
      profile: {
        displayName: string;
      };
    };
  };
  unreadCount: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  type: string;
  content?: string;
  callData?: any;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isDeleted: boolean;
  status?: string;
  sender: {
    id: number;
    username: string;
    profile: {
      displayName: string;
      avatar?: {
        url: string;
      };
    };
  };
  mediaUsages?: {
    id: number;
    media: {
      id: number;
      url: string;
      type: string;
      filename: string;
    };
  }[];
}

export interface CreateConversationRequest {
  participantIds: number[];
  title?: string;
  isGroup?: boolean;
}

export interface SendMessageRequest {
  conversationId: number;
  type: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "SYSTEM" | "CALL_LOG";
  content?: string;
  mediaIds?: number[];
  callData?: any;
}

export interface GetConversationsRequest {
  page?: number;
  limit?: number;
}

export interface GetMessagesRequest {
  page?: number;
  limit?: number;
}

export interface MarkAsReadRequest {
  conversationId: number;
  messageId?: number;
}

export const messagingApi = createApi({
  reducerPath: "messagingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/messaging`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("access_token");
      console.log("Messaging API - Token:", token ? "Present" : "Missing");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Conversation", "Message"],
  endpoints: (builder) => ({
    // Get conversations
    getConversations: builder.query<
      { conversations: Conversation[]; total: number },
      GetConversationsRequest
    >({
      query: (params) => ({
        url: "/conversations",
        params,
      }),
      transformResponse: (response: any) => {
        console.log("Get conversations API response:", response);
        if (response.success && response.data) {
          return response.data;
        }
        return {
          conversations: [],
          total: 0,
        };
      },
      providesTags: ["Conversation"],
      transformErrorResponse: (response: any) => {
        console.error("Get conversations error:", response);
        return response;
      },
    }),

    // Get single conversation
    getConversation: builder.query<Conversation, number>({
      query: (id) => `/conversations/${id}`,
      providesTags: (result, error, id) => [{ type: "Conversation", id }],
    }),

    // Create conversation
    createConversation: builder.mutation<
      { success: boolean; message: string; data: Conversation },
      CreateConversationRequest
    >({
      query: (body) => ({
        url: "/conversations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Conversation"],
    }),

    // Get or create conversation with user
    getOrCreateConversationWithUser: builder.mutation<
      { success: boolean; message: string; data: Conversation },
      number
    >({
      query: (userId) => {
        console.log("API: Creating conversation with user:", userId);
        return {
          url: `/conversations/with-user/${userId}`,
          method: "POST",
        };
      },
      invalidatesTags: ["Conversation"],
      transformErrorResponse: (response: any) => {
        console.error("API: Get or create conversation error:", response);
        return response;
      },
    }),

    // Get messages
    getMessages: builder.query<
      { messages: Message[]; total: number },
      { conversationId: number; params: GetMessagesRequest }
    >({
      query: ({ conversationId, params }) => {
        console.log(
          "API: Getting messages for conversation:",
          conversationId,
          "with params:",
          params
        );
        return {
          url: `/conversations/${conversationId}/messages`,
          params,
        };
      },
      providesTags: (result, error, { conversationId }) => [
        { type: "Message", id: conversationId },
      ],
      transformResponse: (response: any) => {
        console.log("API: Messages response:", response);
        // Handle the actual API response structure
        if (response && response.data) {
          return response.data;
        }
        return response;
      },
    }),

    // Send message
    sendMessage: builder.mutation<Message, SendMessageRequest>({
      query: (body) => {
        console.log("Frontend API - Sending message body:", body);
        return {
          url: "/messages",
          method: "POST",
          body,
        };
      },
      invalidatesTags: (result, error, { conversationId }) => [
        "Conversation",
        { type: "Message", id: conversationId },
      ],
    }),

    // Mark as read
    markAsRead: builder.mutation<{ success: boolean }, MarkAsReadRequest>({
      query: (body) => ({
        url: "/mark-read",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Conversation"],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useCreateConversationMutation,
  useGetOrCreateConversationWithUserMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkAsReadMutation,
} = messagingApi;
