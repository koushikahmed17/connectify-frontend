import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:3000", // your backend API
    credentials: "include",
    prepareHeaders: (headers, { endpoint, getState, extra, type }) => {
      // Debug: Log headers being sent
      console.log("RTK Query - Preparing headers for endpoint:", endpoint);
      console.log("RTK Query - Headers before:", headers);

      // Get token from localStorage
      const token = localStorage.getItem("access_token");

      // Add Authorization header if token exists
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      // Only set JSON content type if not already set
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      console.log("RTK Query - Headers after:", headers);
      return headers;
    },
  }),
  tagTypes: [
    "Post",
    "User",
    "Profile",
    "Notification",
    "Comment",
    "FollowRequests",
    "Connections",
    "ConnectionStatus",
    "UserStats",
  ],
  endpoints: () => ({}),
});
