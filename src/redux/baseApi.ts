import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_REACT_BACKEND_URL, // your backend API
    credentials: "include",
    // prepareHeaders: (headers, { endpoint, getState, extra, type }) => {
    //   // Only set JSON content type if not sending FormData
    //   const isFormData = (extra as any)?.isFormData;

    //   if (!isFormData) {
    //     headers.set("Content-Type", "application/json");
    //   }
    //   return headers;
    // },
  }),
  endpoints: () => ({}),
});
