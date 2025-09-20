import { baseApi } from "../baseApi";

export interface MediaUploadResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    url: string;
    mimeType: string;
    size: number;
  };
}

export interface Post {
  id: number;
  content: string;
  isDraft: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: number;
  author: {
    id: number;
    username: string;
    email: string;
    profile?: {
      displayName?: string;
      avatar?: {
        url: string;
      };
    };
  };
  medias: {
    id: number;
    order: number;
    altText?: string;
    media: {
      id: number;
      url: string;
      mimeType: string;
    };
  }[];
  reactions: {
    id: number;
    type: string;
    userId: number;
    user: {
      id: number;
      username: string;
    };
  }[];
  comments: {
    id: number;
    content: string;
    createdAt: string;
    author: {
      id: number;
      username: string;
      profile?: {
        displayName?: string;
        avatar?: {
          url: string;
        };
      };
    };
  }[];
  _count: {
    reactions: number;
    comments: number;
  };
}

export interface CreatePostRequest {
  content: string;
  mediaIds?: number[];
}

export interface UpdatePostRequest {
  content?: string;
  mediaIds?: number[];
}

export const postsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Upload media files
    uploadMedia: build.mutation<MediaUploadResponse, FormData>({
      queryFn: async (formData) => {
        console.log("🚀 Sending FormData to upload media");
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/media/upload`,
          {
            method: "POST",
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
            credentials: "include",
            // Don't set Content-Type - browser will set it with boundary
          }
        );

        if (!response.ok) {
          const error = await response.json();
          console.error("❌ Upload media error:", error);
          return { error: { status: response.status, data: error } };
        }

        const data = await response.json();
        console.log("✅ Upload media success:", data);
        return { data };
      },
    }),
    // Get all posts (news feed)
    getPosts: build.query<Post[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: "/posts",
        method: "GET",
        params: { page, limit },
        credentials: "include",
      }),
      transformResponse: (response: any) => {
        // Handle the paginated response structure
        if (response.success && response.data && response.data.data) {
          return response.data.data;
        }
        return [];
      },
      providesTags: ["Post"],
    }),

    // Get single post by ID
    getPost: build.query<Post, number>({
      query: (id) => ({
        url: `/posts/${id}`,
        method: "GET",
        credentials: "include",
      }),
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error("Failed to fetch post");
      },
      providesTags: (result, error, id) => [{ type: "Post", id }],
    }),

    // Get user's posts
    getUserPosts: build.query<
      Post[],
      { userId: number; page?: number; limit?: number }
    >({
      query: ({ userId, page = 1, limit = 10 }) => ({
        url: `/posts/user/${userId}`,
        method: "GET",
        params: { page, limit },
        credentials: "include",
      }),
      transformResponse: (response: any) => {
        if (response.success && response.data && response.data.data) {
          return response.data.data;
        }
        return [];
      },
      providesTags: ["Post"],
    }),

    // Get current user's posts
    getMyPosts: build.query<Post[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: "/posts/my-posts",
        method: "GET",
        params: { page, limit },
        credentials: "include",
      }),
      transformResponse: (response: any) => {
        if (response.success && response.data && response.data.data) {
          return response.data.data;
        }
        return [];
      },
      providesTags: ["Post"],
    }),

    // Create post
    createPost: build.mutation<Post, CreatePostRequest>({
      query: (postData) => ({
        url: "/posts",
        method: "POST",
        body: postData,
        credentials: "include",
      }),
      invalidatesTags: ["Post"],
    }),

    // Update post
    updatePost: build.mutation<Post, { id: number; data: UpdatePostRequest }>({
      query: ({ id, data }) => ({
        url: `/posts/${id}`,
        method: "PUT",
        body: data,
        credentials: "include",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Post", id },
        "Post",
      ],
    }),

    // Delete post
    deletePost: build.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/posts/${id}`,
        method: "DELETE",
        credentials: "include",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Post", id }, "Post"],
    }),

    // Toggle like
    toggleLike: build.mutation<{ liked: boolean; likeCount: number }, number>({
      query: (postId) => ({
        url: `/posts/${postId}/like`,
        method: "POST",
        credentials: "include",
      }),
      async onQueryStarted(postId, { dispatch, queryFulfilled, getState }) {
        // Get current user ID from state
        const state = getState() as any;
        const userId = state.user.id;

        if (!userId) return;

        // Optimistic update for getPosts query
        const patchResult1 = dispatch(
          postsApi.util.updateQueryData("getPosts", {}, (draft) => {
            const post = draft.find((p) => p.id === postId);
            if (post) {
              console.log("Optimistic update - Post found:", post.id);
              console.log("Current reactions:", post.reactions);
              console.log("User ID:", userId);

              const isLiked = post.reactions.some(
                (r) => r.userId === Number(userId)
              );
              console.log("Is currently liked:", isLiked);

              if (isLiked) {
                // Remove like
                post.reactions = post.reactions.filter(
                  (r) => r.userId !== Number(userId)
                );
                post._count.reactions -= 1;
                console.log("Removed like, new count:", post._count.reactions);
              } else {
                // Add like
                post.reactions.push({
                  id: Date.now(), // Temporary ID
                  type: "LIKE",
                  userId: userId,
                  user: { id: userId, username: "current_user" },
                });
                post._count.reactions += 1;
                console.log("Added like, new count:", post._count.reactions);
              }
              console.log("New reactions:", post.reactions);
            }
          })
        );

        // Optimistic update for getPost query
        const patchResult2 = dispatch(
          postsApi.util.updateQueryData("getPost", postId, (draft) => {
            if (draft) {
              console.log("Optimistic update getPost - Post found:", draft.id);
              console.log("Current reactions:", draft.reactions);
              console.log("User ID:", userId);

              const isLiked = draft.reactions.some(
                (r) => r.userId === Number(userId)
              );
              console.log("Is currently liked:", isLiked);

              if (isLiked) {
                // Remove like
                draft.reactions = draft.reactions.filter(
                  (r) => r.userId !== Number(userId)
                );
                draft._count.reactions -= 1;
                console.log("Removed like, new count:", draft._count.reactions);
              } else {
                // Add like
                draft.reactions.push({
                  id: Date.now(), // Temporary ID
                  type: "LIKE",
                  userId: userId,
                  user: { id: userId, username: "current_user" },
                });
                draft._count.reactions += 1;
                console.log("Added like, new count:", draft._count.reactions);
              }
              console.log("New reactions:", draft.reactions);
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          // Revert optimistic updates on error
          patchResult1.undo();
          patchResult2.undo();
        }
      },
      invalidatesTags: (result, error, postId) => [
        { type: "Post", id: postId },
        "Post",
      ],
    }),

    // Add comment
    addComment: build.mutation<any, { postId: number; content: string }>({
      query: ({ postId, content }) => ({
        url: `/posts/${postId}/comment`,
        method: "POST",
        body: { content },
        credentials: "include",
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: "Post", id: postId },
        "Post",
      ],
    }),

    // Add comment reply
    addCommentReply: build.mutation<
      any,
      { commentId: number; content: string }
    >({
      query: ({ commentId, content }) => ({
        url: `/posts/comments/${commentId}/reply`,
        method: "POST",
        body: { content },
        credentials: "include",
      }),
      invalidatesTags: ["Post"],
    }),

    // Toggle comment like
    toggleCommentLike: build.mutation<any, number>({
      query: (commentId) => ({
        url: `/posts/comments/${commentId}/like`,
        method: "POST",
        credentials: "include",
      }),
      invalidatesTags: (result, error, commentId) => [
        { type: "Post", id: "LIST" },
        "Post",
      ],
    }),

    // Get comment replies
    getCommentReplies: build.query<
      any,
      { commentId: number; page?: number; limit?: number }
    >({
      query: ({ commentId, page = 1, limit = 10 }) => ({
        url: `/posts/comments/${commentId}/replies`,
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
    }),

    // Get comments
    getComments: build.query<
      any,
      { postId: number; page?: number; limit?: number }
    >({
      query: ({ postId, page = 1, limit = 10 }) => ({
        url: `/posts/${postId}/comments`,
        method: "GET",
        params: { page, limit },
        credentials: "include",
      }),
      transformResponse: (response: any) => {
        // Handle the paginated response structure
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
      providesTags: (result, error, { postId }) => [
        { type: "Comment", id: postId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useUploadMediaMutation,
  useGetPostsQuery,
  useGetPostQuery,
  useGetUserPostsQuery,
  useGetMyPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useToggleLikeMutation,
  useAddCommentMutation,
  useAddCommentReplyMutation,
  useToggleCommentLikeMutation,
  useGetCommentRepliesQuery,
  useGetCommentsQuery,
} = postsApi;
