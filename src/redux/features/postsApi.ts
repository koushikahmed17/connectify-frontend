import { baseApi } from "../baseApi";

export interface MediaUploadResponse {
  id: number;
  url: string;
  mimeType: string;
  size: number;
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
        const response = await fetch(
          `${import.meta.env.VITE_REACT_BACKEND_URL}/user/profile/files`,
          {
            method: "POST",
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
      providesTags: ["Post"],
    }),

    // Get single post by ID
    getPost: build.query<Post, number>({
      query: (id) => ({
        url: `/posts/${id}`,
        method: "GET",
        credentials: "include",
      }),
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

    // Get comments
    getComments: build.query<
      any[],
      { postId: number; page?: number; limit?: number }
    >({
      query: ({ postId, page = 1, limit = 10 }) => ({
        url: `/posts/${postId}/comments`,
        method: "GET",
        params: { page, limit },
        credentials: "include",
      }),
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
  useGetCommentsQuery,
} = postsApi;
