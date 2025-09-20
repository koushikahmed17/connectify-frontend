import React, { useState } from "react";
import {
  Users,
  TrendingUp,
  Calendar,
  MapPin,
  Star,
  MessageCircle,
  Heart,
  Share2,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/Store";
import { getAvatarUrlFromString } from "../../../utils/avatarUtils";

const RightSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentUser = useSelector((state: RootState) => state.user);

  // Mock data for suggestions and trending
  const suggestedFriends = [
    {
      id: 1,
      name: "Alex Johnson",
      username: "alexj",
      avatar:
        "https://ui-avatars.com/api/?name=Alex+Johnson&background=6366f1&color=fff",
      mutualFriends: 5,
    },
    {
      id: 2,
      name: "Sarah Wilson",
      username: "sarahw",
      avatar:
        "https://ui-avatars.com/api/?name=Sarah+Wilson&background=10b981&color=fff",
      mutualFriends: 3,
    },
    {
      id: 3,
      name: "Mike Chen",
      username: "mikec",
      avatar:
        "https://ui-avatars.com/api/?name=Mike+Chen&background=f59e0b&color=fff",
      mutualFriends: 8,
    },
  ];

  const trendingTopics = [
    { id: 1, topic: "#TechNews", posts: "2.3k posts" },
    { id: 2, topic: "#Connectify", posts: "1.8k posts" },
    { id: 3, topic: "#WebDevelopment", posts: "1.2k posts" },
    { id: 4, topic: "#ReactJS", posts: "950 posts" },
    { id: 5, topic: "#TypeScript", posts: "720 posts" },
  ];

  const recentActivity = [
    { id: 1, user: "Shuvo Ahmed", action: "liked your post", time: "2h ago" },
    {
      id: 2,
      user: "Alex Johnson",
      action: "commented on your photo",
      time: "4h ago",
    },
    { id: 3, user: "Sarah Wilson", action: "shared your post", time: "6h ago" },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: "Tech Meetup 2024",
      date: "Dec 15, 2024",
      location: "San Francisco, CA",
      attendees: 120,
    },
    {
      id: 2,
      title: "React Conference",
      date: "Jan 20, 2025",
      location: "New York, NY",
      attendees: 500,
    },
  ];

  if (isCollapsed) {
    return (
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40">
        <button
          onClick={() => setIsCollapsed(false)}
          className="bg-white rounded-full p-3 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <TrendingUp className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Discover</h3>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Suggested Friends */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">
            Suggested Friends
          </h4>
          <button className="text-xs text-blue-600 hover:text-blue-800">
            See All
          </button>
        </div>
        <div className="space-y-3">
          {suggestedFriends.map((friend) => (
            <div key={friend.id} className="flex items-center space-x-3">
              <img
                src={friend.avatar}
                alt={friend.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {friend.name}
                </p>
                <p className="text-xs text-gray-500">
                  {friend.mutualFriends} mutual friends
                </p>
              </div>
              <button className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition-colors">
                Add
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Trending</h4>
          <TrendingUp className="w-4 h-4 text-gray-500" />
        </div>
        <div className="space-y-2">
          {trendingTopics.map((topic) => (
            <div
              key={topic.id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {topic.topic}
                </p>
                <p className="text-xs text-gray-500">{topic.posts}</p>
              </div>
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">
            Recent Activity
          </h4>
          <MessageCircle className="w-4 h-4 text-gray-500" />
        </div>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.user}</span>{" "}
                  {activity.action}
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">
            Upcoming Events
          </h4>
          <Calendar className="w-4 h-4 text-gray-500" />
        </div>
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-900 mb-1">
                {event.title}
              </h5>
              <div className="flex items-center text-xs text-gray-500 space-x-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{event.location}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {event.attendees} going
                </span>
                <button className="text-xs text-blue-600 hover:text-blue-800">
                  Interested
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Quick Actions
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center space-x-2 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
            <Share2 className="w-4 h-4" />
            <span className="text-xs font-medium">Share</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
            <Star className="w-4 h-4" />
            <span className="text-xs font-medium">Save</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          <span>Privacy</span>
          <span>•</span>
          <span>Terms</span>
          <span>•</span>
          <span>Help</span>
          <span>•</span>
          <span>About</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          © 2024 Connectify. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default RightSidebar;
