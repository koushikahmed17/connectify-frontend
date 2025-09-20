import React, { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../redux/Store";
import NewsFeed from "./NewsFeed";
import PostArea from "./PostArea";
import RightSidebar from "../components/RightSidebar";
import { Menu, X } from "lucide-react";

const HomePage: React.FC = () => {
  const username = useSelector((state: RootState) => state.user.username);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-20 right-4 z-50">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="bg-white rounded-full p-3 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Discover
                </h3>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <RightSidebar />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between gap-6">
          {/* Left Spacer */}
          <div className="hidden xl:block w-64 flex-shrink-0"></div>

          {/* Main Content */}
          <div className="flex-1 max-w-2xl">
            {/* Post Creation Area */}
            <PostArea />

            {/* News Feed */}
            <NewsFeed />
          </div>

          {/* Right Sidebar - Desktop */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-6">
              <RightSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
