import React, { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  Link,
  MoreHorizontal,
  UserPlus,
  Mail,
  Globe,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  User,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/Store";
import { useGetPublicProfileQuery } from "../../../redux/features/userProfile";
import { useGetUserPostsQuery } from "../../../redux/features/postsApi";
import { useGetUserStatsQuery } from "../../../redux/features/followApi";
import { useGetOrCreateConversationWithUserMutation } from "../../../redux/features/messagingApi";
import ProfileFollowButton from "../../follow/ProfileFollowButton";
import {
  MessageButton,
  MessengerSidebar,
  ChatInterface,
} from "../../messaging";
import { getAvatarUrlFromString } from "../../../utils/avatarUtils";

const PublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");
  const [messengerOpen, setMessengerOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | undefined
  >();
  const [showFullScreenChat, setShowFullScreenChat] = useState(false);

  const {
    data: profile,
    isLoading,
    isError,
  } = useGetPublicProfileQuery(Number(userId));

  const { data: posts, isLoading: postsLoading } = useGetUserPostsQuery({
    userId: Number(userId),
    page: 1,
    limit: 10,
  });

  const { data: userStats, isLoading: statsLoading } = useGetUserStatsQuery({
    userId: Number(userId),
  });

  const [getOrCreateConversation] =
    useGetOrCreateConversationWithUserMutation();

  const currentUser = useSelector((state: RootState) => state.user);
  const baseUrl = "http://localhost:3000";

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
  };

  const formatWebsiteUrl = (url: string | undefined) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  // Helper function to get full image URL
  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${baseUrl}${url}`;
  };

  // Render post function similar to ProfilePostsSection
  const renderPost = (post: any) => {
    const authorName = post.author.profile?.displayName || post.author.username;
    const authorAvatar = post.author.profile?.avatar?.url;
    const isLiked = post.reactions?.some(
      (reaction: any) =>
        reaction.userId === currentUser?.id && reaction.type === "like"
    );
    const likeCount = post._count?.reactions || 0;
    const commentCount = post._count?.comments || 0;

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
            {post.medias.map((mediaItem: any, index: number) => (
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
                    <div className="text-gray-400">Video content</div>
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

  const handleMessageClick = async (targetUserId: number) => {
    console.log("Message button clicked for user:", targetUserId);
    try {
      console.log("Creating conversation with user:", targetUserId);
      const result = await getOrCreateConversation(targetUserId).unwrap();
      console.log("Conversation created:", result);

      // Extract conversation ID from the response
      const conversationId = (result as any).data?.id;
      console.log("Extracted conversation ID:", conversationId);

      if (conversationId) {
        setSelectedConversationId(conversationId);
        setShowFullScreenChat(true);
        console.log(
          "Full-screen chat opened with conversation ID:",
          conversationId
        );
      } else {
        console.error("No conversation ID found in response:", result);
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="text-center p-8 text-red-600">
        <p className="mb-4">Profile not found</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white max-w-4xl mx-auto font-sans shadow-lg rounded-lg overflow-hidden">
      {/* Cover Photo */}
      <div className="relative">
        <img
          src={
            profile.profile?.coverPhoto?.url
              ? profile.profile.coverPhoto.url.startsWith("http")
                ? profile.profile.coverPhoto.url
                : `${baseUrl}${profile.profile.coverPhoto.url}`
              : "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1470&q=80"
          }
          alt="Cover"
          className="w-full h-64 object-cover"
        />
      </div>

      {/* Profile Info */}
      <div className="p-6">
        <div className="flex justify-between items-start -mt-20">
          <div className="relative">
            <img
              src={
                profile.profile?.avatar?.url
                  ? profile.profile.avatar.url.startsWith("http")
                    ? profile.profile.avatar.url
                    : baseUrl + profile.profile.avatar.url
                  : "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=687&q=80"
              }
              alt="Profile"
              className="w-36 h-36 rounded-full border-4 border-white object-cover shadow-lg"
            />
          </div>

          <div className="flex items-center space-x-2 mt-20">
            <ProfileFollowButton
              userId={profile.id}
              username={profile.username}
              size="md"
            />
            <MessageButton
              userId={profile.id}
              onMessageClick={handleMessageClick}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full flex items-center transition-all"
            />
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold p-3 rounded-full transition-all">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {profile.profile?.displayName || profile.username}
          </h1>
          <p className="text-gray-500 text-lg">@{profile.username}</p>
        </div>

        {profile.profile?.bio && (
          <div className="mt-4">
            <p className="text-gray-800 text-lg leading-relaxed">
              {profile.profile.bio}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-6 text-gray-600">
          {profile.profile?.location && (
            <div className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              <span>{profile.profile.location}</span>
            </div>
          )}
          <div className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            <span>Joined {formatJoinDate(profile.createdAt)}</span>
          </div>
          {profile.profile?.website && (
            <div className="flex items-center">
              <Link className="mr-2 h-5 w-5" />
              <a
                href={formatWebsiteUrl(profile.profile.website)}
                className="text-blue-500 hover:text-blue-600 hover:underline transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {profile.profile.website}
              </a>
            </div>
          )}
        </div>

        <div className="mt-6 flex space-x-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {statsLoading ? "..." : userStats?.followingCount || 0}
            </div>
            <div className="text-sm text-gray-500">Following</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {statsLoading ? "..." : userStats?.followersCount || 0}
            </div>
            <div className="text-sm text-gray-500">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {profile.postsCount || 0}
            </div>
            <div className="text-sm text-gray-500">Posts</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("posts")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "posts"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
              {postsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading posts...</p>
                </div>
              ) : posts && posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => renderPost(post))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No posts yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "about" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Bio
                </h3>
                <p className="text-gray-600">
                  {profile.profile?.bio || "No bio available"}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Location
                </h3>
                <p className="text-gray-600">
                  {profile.profile?.location || "No location specified"}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Website
                </h3>
                <p className="text-gray-600">
                  {profile.profile?.website ? (
                    <a
                      href={formatWebsiteUrl(profile.profile.website)}
                      className="text-blue-500 hover:text-blue-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {profile.profile.website}
                    </a>
                  ) : (
                    "No website specified"
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Interface - Sidebar Overlay */}
      {showFullScreenChat && selectedConversationId && (
        <div className="fixed inset-0 z-20 flex justify-end pointer-events-none">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 pointer-events-auto"
            onClick={() => setShowFullScreenChat(false)}
          />

          {/* Chat Interface */}
          <div className="absolute right-0 top-16 w-full max-w-md h-[calc(100vh-4rem)] bg-white shadow-xl pointer-events-auto">
            <ChatInterface
              conversationId={selectedConversationId}
              onBack={() => setShowFullScreenChat(false)}
              onClose={() => setShowFullScreenChat(false)}
              userInfo={{
                id: profile?.id || 0,
                name:
                  profile?.profile?.displayName || profile?.username || "User",
                image:
                  getAvatarUrlFromString(profile?.profile?.avatar?.url) ||
                  undefined,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProfile;
