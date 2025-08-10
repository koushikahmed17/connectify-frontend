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

  const { data, isLoading, isError } = useGetMeQuery();

  // Local state to track if auth check has completed
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    if (data) {
      dispatch(setUser(data));
      setHasCheckedAuth(true);
    } else if (isError) {
      dispatch(clearUser());
      setHasCheckedAuth(true);
    }
  }, [data, isError, dispatch]);

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
