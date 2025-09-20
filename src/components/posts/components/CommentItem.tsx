import React, { useState } from "react";
import { Heart, Reply, MoreHorizontal } from "lucide-react";
import {
  useAddCommentReplyMutation,
  useToggleCommentLikeMutation,
  useGetCommentsQuery,
} from "../../../redux/features/postsApi";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/Store";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getAvatarUrl, handleAvatarError } from "../../../utils/avatarUtils";

interface CommentItemProps {
  comment: any;
  postId: number;
  onReply?: (commentId: number, authorName: string) => void;
  isReply?: boolean;
  onReplyAdded?: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  onReply,
  isReply = false,
  onReplyAdded,
}) => {
  const [showReplies, setShowReplies] = useState(
    comment.replies && comment.replies.length > 0
  );
  const [replyContent, setReplyContent] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const navigate = useNavigate();

  const user = useSelector((state: RootState) => state.user);
  const [addCommentReply, { isLoading: isAddingReply }] =
    useAddCommentReplyMutation();
  const [toggleCommentLike] = useToggleCommentLikeMutation();

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

  const handleLike = async () => {
    try {
      await toggleCommentLike(comment.id).unwrap();
    } catch (error: any) {
      console.error("Error toggling comment like:", error);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    try {
      // Add mention to the reply content
      const mentionText = `@${comment.author?.username || "user"} `;
      const contentWithMention = replyContent.trim().startsWith("@")
        ? replyContent.trim()
        : mentionText + replyContent.trim();

      await addCommentReply({
        commentId: comment.id,
        content: contentWithMention,
      }).unwrap();

      setReplyContent("");
      setShowReplyForm(false);

      // Call the callback to refresh comments
      if (onReplyAdded) {
        onReplyAdded();
      }
    } catch (error: any) {
      console.error("Error adding reply:", error);
    }
  };

  const handleReplyClick = () => {
    if (onReply) {
      onReply(comment.id, getDisplayName(comment.author));
    } else {
      setShowReplyForm(!showReplyForm);
    }
  };

  const isLiked =
    comment.reactions?.some((reaction: any) => reaction.userId === user.id) ||
    false;
  const likeCount = comment._count?.reactions || 0;
  const replyCount = comment._count?.replies || 0;

  return (
    <div className={`${isReply ? "ml-8 border-l-2 border-gray-200 pl-4" : ""}`}>
      <div className="flex space-x-3">
        <img
          src={getAvatarUrl(
            comment.author,
            comment.author?.username?.charAt(0).toUpperCase()
          )}
          alt={getDisplayName(comment.author)}
          className="w-8 h-8 rounded-full object-cover"
          onError={(e) =>
            handleAvatarError(
              e,
              comment.author?.username?.charAt(0).toUpperCase()
            )
          }
        />
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2 mb-1">
              <button
                onClick={() => handleUsernameClick(comment.author?.id || 0)}
                className="font-semibold text-sm text-gray-900 hover:text-blue-600 hover:underline"
              >
                {getDisplayName(comment.author)}
              </button>
              <span className="text-xs text-gray-500">
                {formatTimeAgo(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm text-gray-800">{comment.content}</p>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 mt-2 ml-2">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 text-xs transition-colors ${
                isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{likeCount > 0 ? likeCount : "Like"}</span>
            </button>

            {!isReply && (
              <button
                onClick={handleReplyClick}
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
              >
                <Reply className="w-4 h-4" />
                <span>Reply</span>
              </button>
            )}

            {replyCount > 0 && !isReply && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-gray-500 hover:text-blue-500 transition-colors"
              >
                {showReplies ? "Hide" : "Show"} {replyCount}{" "}
                {replyCount === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-3 ml-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Reply to @${
                    comment.author?.username || "user"
                  }...`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleReply();
                    }
                  }}
                />
                <button
                  onClick={handleReply}
                  disabled={!replyContent.trim() || isAddingReply}
                  className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isAddingReply ? "Posting..." : "Reply"}
                </button>
                <button
                  onClick={() => setShowReplyForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Replies */}
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply: any) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
