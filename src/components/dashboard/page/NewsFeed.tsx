import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import {
  useGetPostsQuery,
  useDeletePostMutation,
  useUpdatePostMutation,
  useToggleLikeMutation,
  useAddCommentMutation,
  useGetCommentsQuery,
  Post,
} from "../../../redux/features/postsApi";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/Store";
import { toast } from "react-toastify";

const NewsFeed: React.FC = () => {
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showMoreOptions, setShowMoreOptions] = useState<number | null>(null);
  const [showComments, setShowComments] = useState<number | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const moreOptionsRef = useRef<HTMLDivElement>(null);

  const user = useSelector((state: RootState) => state.user);
  const { data: posts, isLoading, error, refetch } = useGetPostsQuery({});
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const [toggleLike] = useToggleLikeMutation();
  const [addComment] = useAddCommentMutation();

  // Close more options menu when clicking outside
  useEffect(() => {
    if (!showMoreOptions) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreOptionsRef.current &&
        !moreOptionsRef.current.contains(event.target as Node)
      ) {
        setShowMoreOptions(null);
      }
    };

    // Add event listener with a delay to allow button clicks to register
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreOptions]);

  const handleLike = async (postId: number) => {
    try {
      await toggleLike(postId).unwrap();
    } catch (error: any) {
      console.error("Error toggling like:", error);
      toast.error("Failed to like post");
    }
  };

  const handleComment = (postId: number) => {
    setShowComments(showComments === postId ? null : postId);
  };

  const handleAddComment = async (postId: number) => {
    if (!commentContent.trim()) return;

    try {
      await addComment({ postId, content: commentContent.trim() }).unwrap();
      setCommentContent("");
      toast.success("Comment added successfully!");
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleShare = (postId: number) => {
    console.log(`Share post ${postId}`);
    // TODO: Implement share functionality
  };

  const handleBookmark = (postId: number) => {
    console.log(`Bookmark post ${postId}`);
    // TODO: Implement bookmark functionality
  };

  const handleEditPost = (post: Post) => {
    console.log("Edit button clicked for post:", post.id);
    setEditingPost(post.id);
    setEditContent(post.content);
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditContent("");
  };

  const handleSaveEdit = async (postId: number) => {
    if (!editContent.trim()) return;

    console.log("Updating post:", postId, "with content:", editContent.trim());
    console.log("User state:", user);

    try {
      const result = await updatePost({
        id: postId,
        data: {
          content: editContent.trim(),
        },
      }).unwrap();

      console.log("Update successful:", result);
      toast.success("Post updated successfully!");
      setEditingPost(null);
      setEditContent("");
    } catch (error: any) {
      console.error("Error updating post:", error);
      console.error("Error details:", {
        status: error.status,
        data: error.data,
        message: error.message,
      });
      toast.error(error?.data?.message || "Failed to update post");
    }
  };

  const handleDeletePost = async (postId: number) => {
    console.log("🚀 handleDeletePost called for post:", postId);
    try {
      console.log("🔄 Calling deletePost mutation...");
      const result = await deletePost(postId).unwrap();
      console.log("✅ Delete successful:", result);
      toast.success("Post deleted successfully!");
      refetch();
    } catch (error: any) {
      console.error("❌ Error deleting post:", error);
      toast.error(error?.data?.message || "Failed to delete post");
    }
    setShowMoreOptions(null);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  const getDisplayName = (post: Post) => {
    return post.author.profile?.displayName || post.author.username;
  };

  const getAvatarUrl = (post: Post) => {
    if (post.author.profile?.avatar?.url) {
      // If the URL is already a full URL, use it as is
      if (post.author.profile.avatar.url.startsWith("http")) {
        return post.author.profile.avatar.url;
      }
      // If it's a relative path, prepend the backend URL
      return `${import.meta.env.VITE_REACT_BACKEND_URL}${
        post.author.profile.avatar.url
      }`;
    }
    return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="animate-pulse">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Failed to load posts</p>
        <button
          onClick={() => refetch()}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <MessageCircle className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
        <p className="text-gray-500">Be the first to share something!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <img
                src={getAvatarUrl(post)}
                alt={getDisplayName(post)}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900 text-base">
                  {getDisplayName(post)}
                </h3>
                <div className="flex items-center space-x-2 text-gray-500 text-sm">
                  <span>@{post.author.username}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(post.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* More options button - only show for user's own posts */}
            {user.id && user.id === post.authorId && (
              <div className="relative" ref={moreOptionsRef}>
                <button
                  onClick={() => {
                    setShowMoreOptions(
                      showMoreOptions === post.id ? null : post.id
                    );
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </button>

                {showMoreOptions === post.id && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log("Edit button clicked for post:", post.id);
                          handleEditPost(post);
                          setShowMoreOptions(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        <Edit className="w-4 h-4 mr-3" />
                        Edit Post
                      </button>
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log(
                            "Delete button clicked for post:",
                            post.id
                          );
                          handleDeletePost(post.id);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 mr-3" />
                        {isDeleting ? "Deleting..." : "Delete Post"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-6 pb-4">
            {editingPost === post.id ? (
              <div className="space-y-4">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-20 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={2000}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSaveEdit(post.id)}
                    disabled={!editContent.trim() || isUpdating}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm flex items-center space-x-2"
                  >
                    {isUpdating && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <span>{isUpdating ? "Saving..." : "Save"}</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            )}
          </div>

          {/* Media */}
          {post.medias && post.medias.length > 0 && (
            <div className="px-6 pb-4">
              {post.medias.length === 1 ? (
                // Single media
                post.medias[0].media.mimeType.startsWith("image/") ? (
                  <img
                    src={`${import.meta.env.VITE_REACT_BACKEND_URL}${
                      post.medias[0].media.url
                    }`}
                    alt={post.medias[0].altText || "Post content"}
                    className="w-full h-80 object-cover rounded-xl"
                  />
                ) : (
                  <video
                    src={`${import.meta.env.VITE_REACT_BACKEND_URL}${
                      post.medias[0].media.url
                    }`}
                    controls
                    className="w-full h-80 object-cover rounded-xl"
                  />
                )
              ) : (
                // Multiple media - grid layout
                <div className="grid grid-cols-2 gap-2">
                  {post.medias.slice(0, 4).map((media, index) => (
                    <div key={media.id} className="relative">
                      {media.media.mimeType.startsWith("image/") ? (
                        <img
                          src={`${import.meta.env.VITE_REACT_BACKEND_URL}${
                            media.media.url
                          }`}
                          alt={media.altText || `Post media ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={`${import.meta.env.VITE_REACT_BACKEND_URL}${
                            media.media.url
                          }`}
                          controls
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      )}
                      {index === 3 && post.medias.length > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <span className="text-white text-lg font-semibold">
                            +{post.medias.length - 4} more
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center space-x-2 transition-colors group ${
                  post.reactions.some((reaction) => reaction.userId === user.id)
                    ? "text-red-500"
                    : "text-gray-500 hover:text-red-500"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${
                    post.reactions.some(
                      (reaction) => reaction.userId === user.id
                    )
                      ? "fill-current"
                      : "group-hover:fill-current"
                  }`}
                />
                <span className="text-sm font-medium">
                  {post._count.reactions}
                </span>
              </button>

              <button
                onClick={() => handleComment(post.id)}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {post._count.comments}
                </span>
              </button>

              <button
                onClick={() => handleShare(post.id)}
                className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors"
              >
                <Share className="w-5 h-5" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>

            <button
              onClick={() => handleBookmark(post.id)}
              className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <Bookmark className="w-5 h-5" />
            </button>
          </div>

          {/* Comments Section */}
          {showComments === post.id && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              {/* Add Comment Form */}
              <div className="flex space-x-3 mb-4">
                <img
                  src={getAvatarUrl(post)}
                  alt={getDisplayName(post)}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 flex space-x-2">
                  <input
                    type="text"
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddComment(post.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleAddComment(post.id)}
                    disabled={!commentContent.trim()}
                    className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Post
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <img
                      src={
                        comment.author.profile?.avatar?.url
                          ? comment.author.profile.avatar.url.startsWith("http")
                            ? comment.author.profile.avatar.url
                            : `${import.meta.env.VITE_REACT_BACKEND_URL}${
                                comment.author.profile.avatar.url
                              }`
                          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
                      }
                      alt={
                        comment.author.profile?.displayName ||
                        comment.author.username
                      }
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="bg-white rounded-lg px-3 py-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900">
                            {comment.author.profile?.displayName ||
                              comment.author.username}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NewsFeed;
