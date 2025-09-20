// src/redux/features/authApi.ts
import { baseApi } from "../baseApi";

interface LoginResponse {
  success: boolean;
  message: string;
  access_token: string;
  user: {
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
}

interface UserResponse {
  id: number;
  username: string;
  email: string;
  profile?: {
    displayName?: string;
    avatar?: {
      url: string;
    };
  };
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, { email: string; password: string }>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    register: build.mutation<
      any,
      { email: string; username: string; password: string }
    >({
      query: (data) => ({
        url: "/auth/register",
        method: "POST",
        body: data,
      }),
    }),

    logout: build.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),

    getMe: build.query<UserResponse, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: UserResponse;
      }) => {
        return response.data;
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
} = authApi;
