import React, { useState } from "react";
import { Image, Video, Smile } from "lucide-react";

const PostArea: React.FC = () => {
  const [postContent, setPostContent] = useState("");
  const maxLength = 500;

  const handlePost = () => {
    if (postContent.trim()) {
      console.log("Posting:", postContent);
      setPostContent("");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-2">
      <div className="flex space-x-4">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
            alt="User"
            className="w-12 h-12 rounded-full object-cover"
          />
        </div>

        {/* Post Input Area */}
        <div className="flex-1">
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="What's on your mind, John?"
            className="w-full h-20 resize-none border-none outline-none text-lg placeholder-gray-500 bg-gray-50 rounded-xl px-4 py-3 focus:bg-gray-100 transition-colors"
            maxLength={maxLength}
          />
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex space-x-6">
          <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
            <Image className="w-6 h-6" />
            <span className="text-base font-medium">Photo</span>
          </button>

          <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
            <Video className="w-6 h-6" />
            <span className="text-base font-medium">Video</span>
          </button>

          <button className="flex items-center space-x-2 text-gray-600 hover:text-yellow-600 transition-colors">
            <Smile className="w-6 h-6" />
            <span className="text-base font-medium">Feeling</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {postContent.length}/{maxLength}
          </span>
          <button
            onClick={handlePost}
            disabled={!postContent.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full font-medium transition-colors"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostArea;
