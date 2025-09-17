import React, { useState, useRef } from "react";
import { Image, Video, Smile, X, Upload } from "lucide-react";
import {
  useCreatePostMutation,
  useUploadMediaMutation,
} from "../../../redux/features/postsApi";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/Store";
import { toast } from "react-toastify";

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

const PostArea: React.FC = () => {
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const maxLength = 2000;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const user = useSelector((state: RootState) => state.user);
  const [createPost, { isLoading }] = useCreatePostMutation();
  const [uploadMedia] = useUploadMediaMutation();

  const handlePost = async () => {
    if (!postContent.trim() && mediaFiles.length === 0) return;

    setIsPosting(true);
    setUploadingMedia(true);

    try {
      let mediaIds: number[] = [];

      // Upload media files if any
      if (mediaFiles.length > 0) {
        for (const mediaFile of mediaFiles) {
          const formData = new FormData();
          formData.append("file", mediaFile.file);

          console.log(
            "Uploading file:",
            mediaFile.file.name,
            "Type:",
            mediaFile.file.type,
            "Size:",
            mediaFile.file.size
          );

          try {
            const response = await uploadMedia(formData).unwrap();
            console.log("Upload successful:", response);
            mediaIds.push(response.id);
          } catch (error: any) {
            console.error("Error uploading media:", error);
            toast.error(`Failed to upload ${mediaFile.file.name}`);
            throw error;
          }
        }
      }

      // Create post with content and media IDs
      await createPost({
        content: postContent.trim(),
        mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
      }).unwrap();

      setPostContent("");
      setMediaFiles([]);
      toast.success("Post created successfully!");
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error?.data?.message || "Failed to create post");
    } finally {
      setIsPosting(false);
      setUploadingMedia(false);
    }
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video"
  ) => {
    const files = event.target.files;
    if (!files) return;

    const newMediaFiles: MediaFile[] = [];

    Array.from(files).forEach((file) => {
      if (type === "image" && file.type.startsWith("image/")) {
        const mediaFile: MediaFile = {
          file,
          preview: URL.createObjectURL(file),
          type: "image",
        };
        newMediaFiles.push(mediaFile);
      } else if (type === "video" && file.type.startsWith("video/")) {
        const mediaFile: MediaFile = {
          file,
          preview: URL.createObjectURL(file),
          type: "video",
        };
        newMediaFiles.push(mediaFile);
      }
    });

    if (newMediaFiles.length > 0) {
      setMediaFiles((prev) => [...prev, ...newMediaFiles]);
    } else {
      toast.error(`Please select valid ${type} files`);
    }

    // Reset input
    event.target.value = "";
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const getDisplayName = () => {
    return user.profile?.displayName || user.username || "User";
  };

  const getAvatarUrl = () => {
    if (user.profile?.avatar?.url) {
      // If the URL is already a full URL, use it as is
      if (user.profile.avatar.url.startsWith("http")) {
        return user.profile.avatar.url;
      }
      // If it's a relative path, prepend the backend URL
      const fullUrl = `${import.meta.env.VITE_REACT_BACKEND_URL}${
        user.profile.avatar.url
      }`;
      return fullUrl;
    }
    return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handlePost();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-2">
      <div className="flex space-x-4">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          <img
            src={getAvatarUrl()}
            alt={getDisplayName()}
            className="w-12 h-12 rounded-full object-cover"
          />
        </div>

        {/* Post Input Area */}
        <div className="flex-1">
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`What's on your mind, ${getDisplayName()}?`}
            className="w-full h-20 resize-none border-none outline-none text-lg placeholder-gray-500 bg-gray-50 rounded-xl px-4 py-3 focus:bg-gray-100 transition-colors"
            maxLength={maxLength}
            disabled={isLoading || isPosting}
          />
        </div>
      </div>

      {/* Media Preview */}
      {mediaFiles.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {mediaFiles.map((media, index) => (
              <div key={index} className="relative group">
                <div className="relative">
                  {media.type === "image" ? (
                    <img
                      src={media.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      src={media.preview}
                      className="w-full h-32 object-cover rounded-lg"
                      controls
                    />
                  )}
                  <button
                    onClick={() => removeMediaFile(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions Row */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex space-x-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            disabled={isLoading || isPosting}
          >
            <Image className="w-6 h-6" />
            <span className="text-base font-medium">Photo</span>
          </button>

          <button
            onClick={() => videoInputRef.current?.click()}
            className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
            disabled={isLoading || isPosting}
          >
            <Video className="w-6 h-6" />
            <span className="text-base font-medium">Video</span>
          </button>

          <button
            className="flex items-center space-x-2 text-gray-600 hover:text-yellow-600 transition-colors"
            disabled={isLoading || isPosting}
          >
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
            disabled={
              (!postContent.trim() && mediaFiles.length === 0) ||
              isLoading ||
              isPosting ||
              uploadingMedia
            }
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full font-medium transition-colors flex items-center space-x-2"
          >
            {(isLoading || isPosting || uploadingMedia) && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>
              {uploadingMedia
                ? "Uploading..."
                : isPosting
                ? "Posting..."
                : "Post"}
            </span>
          </button>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e, "image")}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={(e) => handleFileSelect(e, "video")}
        className="hidden"
      />

      {/* Keyboard shortcut hint */}
      <div className="mt-2 text-xs text-gray-400 text-right">
        Press Ctrl+Enter to post quickly
      </div>
    </div>
  );
};

export default PostArea;
