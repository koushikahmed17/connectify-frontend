import { baseApi } from "../baseApi";

export const userProfileApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET profile
    getProfile: build.query({
      query: () => ({
        url: "/user/profile",
        method: "GET",
        credentials: "include",
      }),
    }),

    // CREATE profile (multipart/form-data)
    createProfile: build.mutation<any, FormData>({
      query: (formData) => ({
        url: "/user/profile",
        method: "POST",
        body: formData,
        // No headers set here — let browser handle multipart boundary
      }),
    }),

    // UPDATE profile (multipart/form-data)
    updateProfile: build.mutation<any, FormData>({
      query: (formData) => ({
        url: "/user/profile",
        method: "PUT",
        body: formData,
        // No headers set here — let browser handle multipart boundary
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProfileQuery,
  useCreateProfileMutation,
  useUpdateProfileMutation,
} = userProfileApi;
