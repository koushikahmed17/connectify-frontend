import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  MapPin,
  Calendar,
  User,
  Globe,
  Lock,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  useGetUserPostsQuery,
  useGetMyPostsQuery,
} from "../../../redux/features/postsApi";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/Store";
import ProfileImagesSection from "./ProfileImagesSection";

import { Post } from "../../../redux/features/postsApi";

interface ProfilePostsSectionProps {
  userId: number;
  isOwnProfile?: boolean;
  profileData?: {
    avatar?: { url: string };
    coverPhoto?: { url: string };
  };
}

const ProfilePostsSection: React.FC<ProfilePostsSectionProps> = ({
  userId,
  isOwnProfile = false,
  profileData,
}) => {
  const [activeTab, setActiveTab] = useState("posts");
  const currentUser = useSelector((state: RootState) => state.user);

  // Fetch posts based on whether it's own profile or viewing someone else's
  const {
    data: userPosts,
    isLoading: isLoadingUserPosts,
    error: userPostsError,
  } = useGetUserPostsQuery({ userId, page: 1, limit: 50 }, { skip: !userId });

  const {
    data: myPosts,
    isLoading: isLoadingMyPosts,
    error: myPostsError,
  } = useGetMyPostsQuery({ page: 1, limit: 50 }, { skip: !isOwnProfile });

  // Use appropriate posts data
  const posts = isOwnProfile ? myPosts || [] : userPosts || [];
  const isLoading = isOwnProfile ? isLoadingMyPosts : isLoadingUserPosts;
  const error = isOwnProfile ? myPostsError : userPostsError;

  // Debug logging
  console.log("ProfilePostsSection - Debug Info:", {
    userId,
    isOwnProfile,
    posts: posts?.length || 0,
    isLoading,
    error,
    userPosts: userPosts?.length || 0,
    myPosts: myPosts?.length || 0,
  });

  const photos = posts.filter((post) =>
    post.medias?.some((media) => media.media.mimeType.startsWith("image"))
  );
  const videos = posts.filter((post) =>
    post.medias?.some((media) => media.media.mimeType.startsWith("video"))
  );

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case "public":
        return <Globe className="w-3 h-3" />;
      case "friends":
        return <Users className="w-3 h-3" />;
      case "only_me":
        return <Lock className="w-3 h-3" />;
      default:
        return <Globe className="w-3 h-3" />;
    }
  };

  const getPrivacyText = (privacy: string) => {
    switch (privacy) {
      case "public":
        return "Public";
      case "friends":
        return "Friends";
      case "only_me":
        return "Only me";
      default:
        return "Public";
    }
  };

  const renderPost = (post: Post) => {
    const authorName = post.author.profile?.displayName || post.author.username;
    const authorAvatar = post.author.profile?.avatar?.url;
    const isLiked = post.reactions.some(
      (reaction) =>
        reaction.userId === currentUser?.id && reaction.type === "like"
    );
    const likeCount = post._count.reactions;
    const commentCount = post._count.comments;

    // Helper function to get full image URL
    const getImageUrl = (url: string) => {
      if (!url) return "";
      if (url.startsWith("http")) return url;
      const baseUrl = import.meta.env.VITE_API_URL || "";
      return `${baseUrl}${url}`;
    };

    return (
      <div
        key={post.id}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4"
      >
        {/* Post Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
              {authorAvatar ? (
                <img
                  src={getImageUrl(authorAvatar)}
                  alt={authorName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.log("Avatar failed to load:", e.currentTarget.src);
                    e.currentTarget.style.display = "none";
                    const fallbackDiv = e.currentTarget
                      .nextElementSibling as HTMLElement;
                    if (fallbackDiv) {
                      fallbackDiv.style.display = "flex";
                    }
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full bg-blue-500 flex items-center justify-center ${
                  authorAvatar ? "hidden" : ""
                }`}
              >
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900">{authorName}</h4>
                <span className="text-gray-500">•</span>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Globe className="w-3 h-3" />
                <span>Public</span>
              </div>
            </div>
          </div>
          <button className="p-1 hover:bg-gray-100 rounded-full">
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Post Content */}
        <div className="mb-3">
          <p className="text-gray-900 leading-relaxed">{post.content}</p>
        </div>

        {/* Post Media */}
        {post.medias && post.medias.length > 0 && (
          <div className="mb-3">
            {post.medias.map((mediaItem, index) => (
              <div key={index} className="mb-2">
                {mediaItem.media.mimeType.startsWith("image") ? (
                  <img
                    src={getImageUrl(mediaItem.media.url)}
                    alt={mediaItem.altText || "Post content"}
                    className="w-full rounded-lg object-cover max-h-96"
                    onError={(e) => {
                      console.log(
                        "Post image failed to load:",
                        e.currentTarget.src
                      );
                      e.currentTarget.src =
                        "https://via.placeholder.com/400x300?text=Image+Not+Found";
                    }}
                  />
                ) : (
                  <div className="w-full bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                    <Video className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Post Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-4">
            {likeCount > 0 && (
              <span className="flex items-center space-x-1">
                <Heart className="w-4 h-4 text-red-500 fill-current" />
                <span>{likeCount}</span>
              </span>
            )}
            {commentCount > 0 && (
              <span className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{commentCount}</span>
              </span>
            )}
          </div>
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
              isLiked ? "text-red-500" : "text-gray-500"
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            <span className="font-medium">Like</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-500">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Comment</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-500">
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Share</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-500">
            <Bookmark className="w-5 h-5" />
            <span className="font-medium">Save</span>
          </button>
        </div>
      </div>
    );
  };

  const renderPhotosGrid = () => {
    // Helper function to get full image URL
    const getImageUrl = (url: string) => {
      if (!url) return "";
      if (url.startsWith("http")) return url;
      const baseUrl = import.meta.env.VITE_API_URL || "";
      return `${baseUrl}${url}`;
    };

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {photos.map((post) => {
          const firstImage = post.medias?.find((media) =>
            media.media.mimeType.startsWith("image")
          );
          return (
            <div key={post.id} className="relative group cursor-pointer">
              <img
                src={firstImage ? getImageUrl(firstImage.media.url) : ""}
                alt={firstImage?.altText || "Post photo"}
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  console.log(
                    "Photo grid image failed to load:",
                    e.currentTarget.src
                  );
                  e.currentTarget.src =
                    "https://via.placeholder.com/300x200?text=Image+Not+Found";
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-4 text-white">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {post._count.reactions}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {post._count.comments}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderVideosGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {videos.map((post) => (
        <div key={post.id} className="relative group cursor-pointer">
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            <Video className="w-12 h-12 text-gray-400" />
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-4 text-white">
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {post._count.reactions}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {post._count.comments}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="mt-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <div className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
              Posts
            </div>
            <div className="py-4 px-1 text-gray-500 font-medium text-sm">
              Images
            </div>
            <div className="py-4 px-1 text-gray-500 font-medium text-sm">
              Photos
            </div>
            <div className="py-4 px-1 text-gray-500 font-medium text-sm">
              Videos
            </div>
            <div className="py-4 px-1 text-gray-500 font-medium text-sm">
              About
            </div>
          </nav>
        </div>
        <div className="mt-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading posts...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mt-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <div className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
              Posts
            </div>
            <div className="py-4 px-1 text-gray-500 font-medium text-sm">
              Images
            </div>
            <div className="py-4 px-1 text-gray-500 font-medium text-sm">
              Photos
            </div>
            <div className="py-4 px-1 text-gray-500 font-medium text-sm">
              Videos
            </div>
            <div className="py-4 px-1 text-gray-500 font-medium text-sm">
              About
            </div>
          </nav>
        </div>
        <div className="mt-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Failed to load posts
            </h3>
            <p className="text-gray-500">
              There was an error loading the posts. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("posts")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "posts"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("images")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "images"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Images
          </button>
          <button
            onClick={() => setActiveTab("photos")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "photos"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Photos
          </button>
          <button
            onClick={() => setActiveTab("videos")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "videos"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "about"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            About
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "posts" && (
          <div>
            {posts && posts.length > 0 ? (
              posts.map(renderPost)
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-500">
                  {isOwnProfile
                    ? "Share your first post!"
                    : "This user hasn't shared any posts yet."}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "images" && (
          <ProfileImagesSection
            profileData={profileData}
            isOwnProfile={isOwnProfile}
          />
        )}

        {activeTab === "photos" && (
          <div>
            {photos && photos.length > 0 ? (
              renderPhotosGrid()
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No photos yet
                </h3>
                <p className="text-gray-500">
                  {isOwnProfile
                    ? "Share your first photo!"
                    : "This user hasn't shared any photos yet."}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "videos" && (
          <div>
            {videos && videos.length > 0 ? (
              renderVideosGrid()
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No videos yet
                </h3>
                <p className="text-gray-500">
                  {isOwnProfile
                    ? "Share your first video!"
                    : "This user hasn't shared any videos yet."}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                About
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                  <p className="text-gray-700">
                    Software Developer passionate about creating amazing web
                    experiences. Love working with React, TypeScript, and modern
                    web technologies.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Work</h4>
                  <p className="text-gray-700">
                    Software Developer at Connectify
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Education</h4>
                  <p className="text-gray-700">
                    Computer Science, University of Dhaka
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                  <p className="text-gray-700">Dhaka, Bangladesh</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePostsSection;
