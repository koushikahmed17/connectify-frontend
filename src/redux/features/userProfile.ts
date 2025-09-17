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
      queryFn: async (formData) => {
        console.log("🚀 Sending FormData to create profile");
        const response = await fetch(
          `${import.meta.env.VITE_REACT_BACKEND_URL}/user/profile`,
          {
            method: "POST",
            body: formData,
            credentials: "include",
            // Don't set Content-Type - browser will set it with boundary
          }
        );

        if (!response.ok) {
          const error = await response.json();
          console.error("❌ Create profile error:", error);
          return { error: { status: response.status, data: error } };
        }

        const data = await response.json();
        console.log("✅ Create profile success:", data);
        return { data };
      },
    }),

    // UPDATE profile (multipart/form-data)
    updateProfile: build.mutation<any, FormData>({
      queryFn: async (formData) => {
        console.log("🚀 Sending FormData to update profile");
        const response = await fetch(
          `${import.meta.env.VITE_REACT_BACKEND_URL}/user/profile`,
          {
            method: "PUT",
            body: formData,
            credentials: "include",
            // Don't set Content-Type - browser will set it with boundary
          }
        );

        if (!response.ok) {
          const error = await response.json();
          console.error("❌ Update profile error:", error);
          return { error: { status: response.status, data: error } };
        }

        const data = await response.json();
        console.log("✅ Update profile success:", data);
        return { data };
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProfileQuery,
  useCreateProfileMutation,
  useUpdateProfileMutation,
} = userProfileApi;
