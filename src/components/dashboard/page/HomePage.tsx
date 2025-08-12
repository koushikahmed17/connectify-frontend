import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../redux/Store";
import NewsFeed from "./NewsFeed";
import PostArea from "./PostArea";

const HomePage: React.FC = () => {
  const username = useSelector((state: RootState) => state.user.username);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content Container */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Post Creation Area */}
        <PostArea />

        {/* News Feed */}
        <NewsFeed />
      </div>
    </div>
  );
};

export default HomePage;
