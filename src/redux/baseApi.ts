// src/redux/baseApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api", // Unique key for the store
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:3000", // Change to your backend API URL
    credentials: "include", // Allow cookies for auth
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  endpoints: () => ({}), // We will inject endpoints later
});
