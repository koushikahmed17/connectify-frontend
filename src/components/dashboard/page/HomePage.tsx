import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../redux/Store";

const HomePage: React.FC = () => {
  const username = useSelector((state: RootState) => state.user.username);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-semibold">
        Welcome, <span className="text-blue-600">{username}</span>!
      </h1>
    </div>
  );
};

export default HomePage;
