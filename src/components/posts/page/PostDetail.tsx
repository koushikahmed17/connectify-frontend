import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import {
  useGetPostQuery,
  useDeletePostMutation,
  useUpdatePostMutation,
  useToggleLikeMutation,
  useAddCommentMutation,
  useGetCommentsQuery,
} from "../../../redux/features/postsApi";
import CommentItem from "../components/CommentItem";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/Store";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { getAvatarUrl, handleAvatarError } from "../../../utils/avatarUtils";

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [editingPost, setEditingPost] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const moreOptionsRef = useRef<HTMLDivElement>(null);

  const user = useSelector((state: RootState) => state.user);
  const {
    data: post,
    isLoading,
    error,
    refetch,
  } = useGetPostQuery(Number(postId));

  // Debug logging
  console.log("PostDetail - postId:", postId);
  console.log("PostDetail - post data:", post);
  console.log("PostDetail - isLoading:", isLoading);
  console.log("PostDetail - error:", error);
  console.log("PostDetail - post author:", post?.author);
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const [toggleLike] = useToggleLikeMutation();
  const [addComment] = useAddCommentMutation();

  const {
    data: comments,
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useGetCommentsQuery({ postId: Number(postId), page: 1, limit: 20 });

  // Close more options menu when clicking outside
  useEffect(() => {
    if (!showMoreOptions) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreOptionsRef.current &&
        !moreOptionsRef.current.contains(event.target as Node)
      ) {
        setShowMoreOptions(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreOptions]);

  const handleLike = async () => {
    if (!post) return;
    try {
      await toggleLike(post.id).unwrap();
    } catch (error: any) {
      console.error("Error toggling like:", error);
    }
  };

  const handleAddComment = async () => {
    if (!commentContent.trim() || !post) return;

    try {
      await addComment({
        postId: post.id,
        content: commentContent.trim(),
      }).unwrap();
      setCommentContent("");
      refetchComments();
    } catch (error: any) {
      console.error("Error adding comment:", error);
    }
  };

  const handleEditPost = () => {
    if (!post) return;
    setEditingPost(true);
    setEditContent(post.content);
  };

  const handleCancelEdit = () => {
    setEditingPost(false);
    setEditContent("");
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !post) return;

    try {
      await updatePost({
        id: post.id,
        data: {
          content: editContent.trim(),
        },
      }).unwrap();

      toast.success("Post updated successfully!");
      setEditingPost(false);
      setEditContent("");
      refetch();
    } catch (error: any) {
      console.error("Error updating post:", error);
      toast.error(error?.data?.message || "Failed to update post");
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    try {
      await deletePost(post.id).unwrap();
      toast.success("Post deleted successfully!");
      navigate("/");
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error(error?.data?.message || "Failed to delete post");
    }
    setShowMoreOptions(false);
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

  const getDisplayName = (author: any) => {
    if (!author) return "Unknown User";
    return author.profile?.displayName || author.username || "Unknown User";
  };

  const handleUsernameClick = (userId: number) => {
    navigate(`/profile/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading post...</p>
      </div>
    );
  }

  if (error) {
    console.error("PostDetail error:", error);
    return (
      <div className="text-center p-8 text-red-600">
        <p className="mb-4">Failed to load post. Please try again.</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center p-8 text-gray-600">
        <p className="mb-4">Post not found</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!post.author) {
    return (
      <div className="text-center p-8 text-red-600">
        <p className="mb-4">Invalid post data - author information missing</p>
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
      {/* Header with back button */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
      </div>

      {/* Post Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <img
              src={getAvatarUrl(
                post.author,
                post.author.username?.charAt(0).toUpperCase()
              )}
              alt={getDisplayName(post.author)}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) =>
                handleAvatarError(
                  e,
                  post.author.username?.charAt(0).toUpperCase()
                )
              }
            />
            <div>
              <h3 className="font-semibold text-gray-900 text-base">
                {getDisplayName(post.author)}
              </h3>
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <button
                  onClick={() => handleUsernameClick(post.author?.id || 0)}
                  className="hover:text-blue-600 hover:underline transition-colors"
                >
                  @{post.author?.username || "unknown"}
                </button>
                <span>•</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* More options button - only show for user's own posts */}
          {user.id && user.id === post.authorId && (
            <div className="relative" ref={moreOptionsRef}>
              <button
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>

              {showMoreOptions && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={handleEditPost}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      <Edit className="w-4 h-4 mr-3" />
                      Edit Post
                    </button>
                    <button
                      onClick={handleDeletePost}
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
        <div className="mb-4">
          {editingPost ? (
            <div className="space-y-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-32 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={2000}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveEdit}
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
          <div className="mb-4">
            {post.medias.length === 1 ? (
              post.medias[0].media.mimeType.startsWith("image/") ? (
                <img
                  src={`${import.meta.env.VITE_API_URL}${
                    post.medias[0].media.url
                  }`}
                  alt={post.medias[0].altText || "Post content"}
                  className="w-full h-80 object-cover rounded-xl"
                />
              ) : (
                <video
                  src={`${import.meta.env.VITE_API_URL}${
                    post.medias[0].media.url
                  }`}
                  controls
                  className="w-full h-80 object-cover rounded-xl"
                />
              )
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {post.medias.slice(0, 4).map((media, index) => (
                  <div key={media.id} className="relative">
                    {media.media.mimeType.startsWith("image/") ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${
                          media.media.url
                        }`}
                        alt={media.altText || `Post media ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={`${import.meta.env.VITE_API_URL}${
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
        <div className="flex items-center justify-between py-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors group ${
                post.reactions.some(
                  (reaction) => reaction.userId === Number(user.id)
                )
                  ? "text-red-500"
                  : "text-gray-500 hover:text-red-500"
              }`}
            >
              <Heart
                className={`w-5 h-5 ${
                  post.reactions.some(
                    (reaction) => reaction.userId === Number(user.id)
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
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                {post._count.comments}
              </span>
            </button>

            <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
              <Share className="w-5 h-5" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>

          <button className="p-1 text-gray-500 hover:text-blue-500 transition-colors">
            <Bookmark className="w-5 h-5" />
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-gray-100 pt-4">
            {/* Add Comment Form */}
            <div className="flex space-x-3 mb-4">
              <img
                src={getAvatarUrl(user, user.username?.charAt(0).toUpperCase())}
                alt={getDisplayName(post.author)}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) =>
                  handleAvatarError(e, user.username?.charAt(0).toUpperCase())
                }
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
                      handleAddComment();
                    }
                  }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentContent.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Post
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {commentsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500 text-sm">
                    Loading comments...
                  </p>
                </div>
              ) : comments && comments.data.length > 0 ? (
                comments.data.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    postId={post.id}
                  />
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No comments yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
