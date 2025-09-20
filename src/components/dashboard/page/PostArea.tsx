import React, { useState, useRef } from "react";
import { Image, Video, Smile, X, Upload } from "lucide-react";
import {
  useCreatePostMutation,
  useUploadMediaMutation,
} from "../../../redux/features/postsApi";
import { useGetMeQuery } from "../../../redux/features/authApi";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/Store";
import { toast } from "react-toastify";
import { getAvatarUrl, handleAvatarError } from "../../../utils/avatarUtils";

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
  const { data: userProfile, isLoading: profileLoading } = useGetMeQuery();
  const [createPost, { isLoading }] = useCreatePostMutation();
  const [uploadMedia] = useUploadMediaMutation();

  const handlePost = async () => {
    if (!postContent.trim() && mediaFiles.length === 0) return;

    // Validate content length
    if (postContent.trim().length > 2000) {
      toast.error("Content must not exceed 2000 characters");
      return;
    }

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
          console.log(
            "Token before upload:",
            localStorage.getItem("access_token")
          );

          try {
            const response = await uploadMedia(formData).unwrap();
            console.log("Upload successful:", response);

            // The response is wrapped in ApiResponseDto, so the actual data is in response.data
            const mediaData = response.data;
            console.log("Media data:", mediaData);
            console.log(
              "Media ID:",
              mediaData.id,
              "Type:",
              typeof mediaData.id
            );

            // Validate that the response has a valid numeric ID
            if (
              mediaData &&
              typeof mediaData.id === "number" &&
              !isNaN(mediaData.id)
            ) {
              mediaIds.push(mediaData.id);
            } else {
              console.error("Invalid media ID received:", mediaData.id);
              throw new Error(`Invalid media ID received: ${mediaData.id}`);
            }
          } catch (error: any) {
            console.error("Error uploading media:", error);
            console.error("Upload error details:", error.data);
            console.error("Upload error status:", error.status);
            toast.error(
              `Failed to upload ${mediaFile.file.name}: ${
                error.data?.message || error.message
              }`
            );
            throw error;
          }
        }
      }

      // Create post with content and media IDs
      const postData: any = {
        content: postContent.trim(),
      };

      // Only add mediaIds if there are any
      if (mediaIds.length > 0) {
        postData.mediaIds = mediaIds;
      }

      console.log("Creating post with data:", postData);
      console.log(
        "Token in localStorage:",
        localStorage.getItem("access_token")
      );

      try {
        const result = await createPost(postData).unwrap();
        console.log("Post created successfully:", result);
      } catch (error: any) {
        console.error("Post creation error details:", error);
        console.error("Error status:", error.status);
        console.error("Error data:", error.data);
        console.error("Error message array:", error.data?.message);
        if (Array.isArray(error.data?.message)) {
          console.error("Validation errors:", error.data.message);
        }
        throw error;
      }

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
    const currentUser = userProfile || user;
    return currentUser.profile?.displayName || currentUser.username || "User";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handlePost();
    }
  };

  // Don't render if user is not authenticated
  if (!user.isAuthenticated) {
    return null;
  }

  // Show loading state while profile is being fetched
  if (profileLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-2">
        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
          </div>
          <div className="flex-1">
            <div className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Use userProfile data if available, otherwise fall back to user state
  const currentUser = userProfile || user;
  const avatarUrl = getAvatarUrl(
    currentUser,
    currentUser.username?.charAt(0).toUpperCase()
  );

  // Debug logging
  console.log("=== POSTAREA DEBUG ===");
  console.log("User Profile from useGetMeQuery:", userProfile);
  console.log("Basic User from Redux:", user);
  console.log("Current User (selected):", currentUser);
  console.log("Current User Profile:", currentUser.profile);
  console.log("Current User Avatar:", currentUser.profile?.avatar);
  console.log("Avatar URL Generated:", avatarUrl);
  console.log("Backend URL:", import.meta.env.VITE_API_URL);
  console.log("=====================");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-2">
      <div className="flex space-x-4">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm">
            <img
              src={avatarUrl}
              alt={getDisplayName()}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image and show fallback div
                console.log("Avatar failed to load, using fallback");
                const img = e.currentTarget;
                const fallbackDiv = img.nextElementSibling as HTMLElement;
                if (fallbackDiv) {
                  img.style.display = "none";
                  fallbackDiv.style.display = "flex";
                }
              }}
              onLoad={() => {
                // Image loaded successfully
                console.log("Avatar loaded successfully");
              }}
            />
            <div
              className="w-full h-full bg-purple-500 flex items-center justify-center"
              style={{ display: "none" }}
            >
              <span className="text-white font-semibold text-lg">
                {currentUser.username?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
          </div>
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
