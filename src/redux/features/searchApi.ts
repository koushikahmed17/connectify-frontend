import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseApi } from "../baseApi";

export interface SearchUser {
  id: number;
  username: string;
  displayName: string;
  avatar: {
    id: number;
    url: string;
    mimeType: string;
  } | null;
  postsCount: number;
  createdAt: string;
}

export interface SearchResponse {
  success: boolean;
  message: string;
  data: SearchUser[];
}

export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchUsers: builder.query<
      SearchResponse,
      { query: string; limit?: number }
    >({
      query: ({ query, limit = 10 }) => ({
        url: "user/profile/search",
        params: { q: query, limit },
      }),
    }),
  }),
});

export const { useSearchUsersQuery } = searchApi;



