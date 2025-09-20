import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "../redux/Store";
import { useGetMeQuery } from "../redux/features/authApi";
import { setUser, clearUser } from "../redux/features/userSlice";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(
    (state: RootState) => state.user.isAuthenticated
  );

  // Check if token exists in localStorage
  const hasToken = localStorage.getItem("access_token");

  // Only make the API call if we have a token
  const { data, isLoading, isError } = useGetMeQuery(undefined, {
    skip: !hasToken, // Skip the query if no token
  });

  // Local state to track if auth check has completed
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // If no token, clear user and mark as checked
    if (!hasToken) {
      dispatch(clearUser());
      setHasCheckedAuth(true);
      return;
    }

    // If we have data, set user
    if (data) {
      dispatch(setUser(data));
      setHasCheckedAuth(true);
    }
    // If we have an error, clear user
    else if (isError) {
      dispatch(clearUser());
      setHasCheckedAuth(true);
    }
  }, [data, isError, hasToken, dispatch]);

  // While loading or before we have completed the auth check, show loading
  if (isLoading || !hasCheckedAuth) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  // Now redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated: render protected children
  return <>{children}</>;
};

export default ProtectedRoute;
