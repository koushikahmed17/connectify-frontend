import React from "react";
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import HomePage from "../components/dashboard/page/HomePage";
import Login from "../components/auth/page/Login";
import Register from "../components/auth/page/Register";
import ProtectedRoute from "./ProtectedRoute";
import UserProfile from "../components/profile/page/UserProfile";
import PublicProfile from "../components/profile/page/PublicProfile";
import PostDetail from "../components/posts/page/PostDetail";
import FollowManagement from "../components/follow/FollowManagement";
import FollowTest from "../components/follow/FollowTest";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "connections",
        element: (
          <ProtectedRoute>
            <FollowManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "userProfile",
        element: (
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile/:userId",
        element: (
          <ProtectedRoute>
            <PublicProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: "post/:postId",
        element: (
          <ProtectedRoute>
            <PostDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "follow-test",
        element: (
          <ProtectedRoute>
            <FollowTest />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
]);
