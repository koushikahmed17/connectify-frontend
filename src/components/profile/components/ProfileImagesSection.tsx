import React, { useState } from "react";
import { User, Camera, Image as ImageIcon } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/Store";
import {
  useUploadMediaMutation,
  useCreatePostMutation,
} from "../../../redux/features/postsApi";
import { toast } from "react-toastify";

interface ProfileImagesSectionProps {
  profileData?: {
    avatar?: { url: string };
    coverPhoto?: { url: string };
  };
  isOwnProfile?: boolean;
}

const ProfileImagesSection: React.FC<ProfileImagesSectionProps> = ({
  profileData,
  isOwnProfile = false,
}) => {
  const currentUser = useSelector((state: RootState) => state.user);
  const [uploadMedia] = useUploadMediaMutation();
  const [createPost] = useCreatePostMutation();
  const [isUploading, setIsUploading] = useState(false);

  // Helper function to get full image URL
  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const baseUrl = import.meta.env.VITE_API_URL || "";
    return `${baseUrl}${url}`;
  };

  // Handle image upload and create post
  const handleImageUpload = async (
    file: File,
    postType: "profile" | "cover"
  ) => {
    if (!isOwnProfile) return;

    setIsUploading(true);
    try {
      // Upload the image
      const mediaFormData = new FormData();
      mediaFormData.append("file", file);

      const mediaResponse = await uploadMedia(mediaFormData).unwrap();

      if (mediaResponse.success && mediaResponse.data) {
        // Create a post with the uploaded image (no caption)
        const postData = {
          content: "",
          mediaIds: [mediaResponse.data.id],
        };

        await createPost(postData).unwrap();
        toast.success(
          `${
            postType === "profile" ? "Profile picture" : "Cover photo"
          } updated and shared!`
        );
      }
    } catch (error) {
      console.error(`Failed to upload ${postType} image:`, error);
      toast.error(
        `Failed to upload ${
          postType === "profile" ? "profile picture" : "cover photo"
        }`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const avatarUrl = profileData?.avatar?.url;
  const coverUrl = profileData?.coverPhoto?.url;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Picture Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">
              Profile Picture
            </h4>
            {isOwnProfile && (
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Edit
              </button>
            )}
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
                {avatarUrl ? (
                  <img
                    src={getImageUrl(avatarUrl)}
                    alt="Profile picture"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.log(
                        "Profile image failed to load:",
                        e.currentTarget.src
                      );
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove(
                        "hidden"
                      );
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full bg-blue-500 flex items-center justify-center ${
                    avatarUrl ? "hidden" : ""
                  }`}
                >
                  <User className="w-16 h-16 text-white" />
                </div>
              </div>

              {isOwnProfile && (
                <label
                  className={`absolute bottom-0 right-0 ${
                    isUploading
                      ? "bg-blue-300"
                      : "bg-blue-500 hover:bg-blue-600"
                  } text-white p-2 rounded-full shadow-lg transition-colors cursor-pointer`}
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file, "profile");
                      }
                    }}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              {isOwnProfile ? "Your profile picture" : "Profile picture"}
            </p>
            {avatarUrl && (
              <p className="text-xs text-gray-500 mt-1">
                Click to view full size
              </p>
            )}
          </div>
        </div>

        {/* Cover Photo Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">Cover Photo</h4>
            {isOwnProfile && (
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Edit
              </button>
            )}
          </div>

          <div className="relative">
            <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200">
              {coverUrl ? (
                <img
                  src={getImageUrl(coverUrl)}
                  alt="Cover photo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log(
                      "Cover image failed to load:",
                      e.currentTarget.src
                    );
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "hidden"
                    );
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full bg-gray-100 flex items-center justify-center ${
                  coverUrl ? "hidden" : ""
                }`}
              >
                <div className="text-center">
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {isOwnProfile ? "No cover photo" : "No cover photo set"}
                  </p>
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <label
                className={`absolute top-2 right-2 ${
                  isUploading
                    ? "bg-gray-600"
                    : "bg-black bg-opacity-50 hover:bg-opacity-70"
                } text-white p-2 rounded-full transition-colors cursor-pointer`}
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file, "cover");
                    }
                  }}
                  disabled={isUploading}
                />
              </label>
            )}
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              {isOwnProfile ? "Your cover photo" : "Cover photo"}
            </p>
            {coverUrl && (
              <p className="text-xs text-gray-500 mt-1">
                Click to view full size
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Photos Section */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">Recent Photos</h4>
          {isOwnProfile && (
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Placeholder for recent photos */}
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="relative group cursor-pointer">
              <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-xs">
                  View
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            {isOwnProfile
              ? "Upload photos to see them here"
              : "No recent photos"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileImagesSection;
