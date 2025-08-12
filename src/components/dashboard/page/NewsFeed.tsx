import React from "react";
import {
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";

interface Post {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  timestamp: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
}

const postsData: Post[] = [
  {
    id: "1",
    user: {
      name: "Sami Ahmed",
      username: "@sarahj",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    timestamp: "2 hours ago",
    content:
      "Just finished an amazing hiking trip in the mountains! The views were absolutely breathtaking. Nature has a way of putting everything in perspective. Can't wait to plan the next adventure! 🏔️",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop",
    likes: 24,
    comments: 10,
    shares: 3,
  },
  {
    id: "2",
    user: {
      name: "Mike Chen",
      username: "@mikec",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    timestamp: "4 hours ago",
    content:
      "Working on a new project today! Sometimes the best ideas come when you least expect them. Coffee definitely helps too ☕️",
    likes: 18,
    comments: 5,
    shares: 2,
  },
  {
    id: "3",
    user: {
      name: "Emma Rodriguez",
      username: "@emmar",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    },
    timestamp: "6 hours ago",
    content:
      "Beautiful sunset from my balcony tonight. Sometimes you don't need to travel far to find something amazing. Grateful for these peaceful moments. 🌅",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop",
    likes: 42,
    comments: 15,
    shares: 8,
  },
];

const NewsFeed: React.FC = () => {
  const handleLike = (postId: string) => {
    console.log(`Liked post ${postId}`);
  };

  const handleComment = (postId: string) => {
    console.log(`Comment on post ${postId}`);
  };

  const handleShare = (postId: string) => {
    console.log(`Share post ${postId}`);
  };

  const handleBookmark = (postId: string) => {
    console.log(`Bookmark post ${postId}`);
  };

  return (
    <div className="space-y-4">
      {postsData.map((post) => (
        <div
          key={post.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <img
                src={post.user.avatar}
                alt={post.user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900 text-base">
                  {post.user.name}
                </h3>
                <div className="flex items-center space-x-2 text-gray-500 text-sm">
                  <span>{post.user.username}</span>
                  <span>•</span>
                  <span>{post.timestamp}</span>
                </div>
              </div>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-4">
            <p className="text-gray-900 text-base leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* Image */}
          {post.image && (
            <div className="px-6 pb-4">
              <img
                src={post.image}
                alt="Post content"
                className="w-full h-80 object-cover rounded-xl"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => handleLike(post.id)}
                className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors group"
              >
                <Heart className="w-5 h-5 group-hover:fill-current" />
                <span className="text-sm font-medium">{post.likes}</span>
              </button>

              <button
                onClick={() => handleComment(post.id)}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{post.comments}</span>
              </button>

              <button
                onClick={() => handleShare(post.id)}
                className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors"
              >
                <Share className="w-5 h-5" />
                <span className="text-sm font-medium">{post.shares}</span>
              </button>
            </div>

            <button
              onClick={() => handleBookmark(post.id)}
              className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NewsFeed;
