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
      transformResponse: (response: any) => {
        console.log("Profile API response:", response);
        // Handle the API response structure
        if (response.success && response.data) {
          console.log("Profile data extracted:", response.data);
          return response.data;
        }
        console.log("No profile data found in response");
        return null;
      },
      providesTags: ["Profile"],
    }),

    // GET public profile
    getPublicProfile: build.query({
      query: (userId: number) => ({
        url: `/user/profile/public/${userId}`,
        method: "GET",
        credentials: "include",
      }),
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      },
    }),

    // CREATE profile (multipart/form-data)
    createProfile: build.mutation<any, FormData>({
      queryFn: async (formData) => {
        console.log("🚀 Sending FormData to create profile");

        // Get token from localStorage
        const token = localStorage.getItem("access_token");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/user/profile`,
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

        // Get token from localStorage
        const token = localStorage.getItem("access_token");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/user/profile`,
          {
            method: "PUT",
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
  useGetPublicProfileQuery,
  useCreateProfileMutation,
  useUpdateProfileMutation,
} = userProfileApi;
