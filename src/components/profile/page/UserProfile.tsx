import React, { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  Link,
  MoreHorizontal,
  UserPlus,
  Mail,
  Camera,
  Edit3,
} from "lucide-react";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useCreateProfileMutation,
} from "../../../redux/features/userProfile";
import { useGetMeQuery } from "../../../redux/features/authApi";
import { useGetUserStatsQuery } from "../../../redux/features/followApi";
import {
  useUploadMediaMutation,
  useCreatePostMutation,
} from "../../../redux/features/postsApi";
import FollowRequestsPanel from "../../follow/FollowRequestsPanel";
import ProfilePostsSection from "../components/ProfilePostsSection";
import { toast } from "react-toastify";

type ProfileType = {
  id?: number;
  displayName?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: { id?: number; url?: string };
  coverPhoto?: { id?: number; url?: string };
};

const UserProfile: React.FC = () => {
  // Backend base URL for images
  const baseUrl = import.meta.env.VITE_API_URL || "";

  // Fetch auth info for username & joined date
  const { data: authUser, isLoading: authLoading } = useGetMeQuery();

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useGetUserStatsQuery(
    {
      userId: authUser?.id || 0,
    },
    {
      skip: !authUser?.id,
    }
  );

  // Fetch profile only when user is authenticated
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useGetProfileQuery(undefined, {
    skip: !authUser || authLoading, // Skip profile query if user is not authenticated or still loading
  });

  // Mutations
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [createProfile, { isLoading: isCreating }] = useCreateProfileMutation();
  const [uploadMedia] = useUploadMediaMutation();
  const [createPost] = useCreatePostMutation();

  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");

  // File state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);

  // Debug logging
  console.log("Profile query state:", {
    profile,
    isLoading,
    isError,
    authUser,
    authLoading,
  });

  // Debug image URLs
  if (profile) {
    console.log("Profile avatar URL:", profile.avatar?.url);
    console.log("Profile cover URL:", profile.coverPhoto?.url);
    console.log("Base URL:", baseUrl);
    console.log(
      "Constructed avatar URL:",
      profile.avatar?.url
        ? profile.avatar.url.startsWith("http")
          ? profile.avatar.url
          : baseUrl + profile.avatar.url
        : "No avatar URL"
    );
    console.log(
      "Constructed cover URL:",
      profile.coverPhoto?.url
        ? profile.coverPhoto.url.startsWith("http")
          ? profile.coverPhoto.url
          : baseUrl + profile.coverPhoto.url
        : "No cover URL"
    );
  }

  // Populate form when profile changes
  useEffect(() => {
    console.log("Profile data:", profile);
    console.log("Auth user data:", authUser);

    if (profile && Object.keys(profile).length > 0) {
      console.log("Setting profile data from API response");
      setFullName(profile.displayName || "");
      // Username comes from auth API, fallback to profile username
      setUsername(authUser?.username || profile.username || "");
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setWebsite(profile.website || "");
    } else {
      console.log("No profile data, using defaults");
      setFullName("");
      setUsername(authUser?.username || "");
      setBio("");
      setLocation("");
      setWebsite("");
    }
    setAvatarFile(null);
    setCoverPhotoFile(null);
  }, [profile, authUser]);

  const handleEdit = () => setIsEditing(true);

  // Helper function to create a post for image uploads
  const createImagePost = async (
    imageFile: File,
    postType: "profile" | "cover"
  ) => {
    try {
      // Upload the image first
      const mediaFormData = new FormData();
      mediaFormData.append("file", imageFile);

      const mediaResponse = await uploadMedia(mediaFormData).unwrap();

      if (mediaResponse.success && mediaResponse.data) {
        // Create a post with the uploaded image (no caption)
        const postData = {
          content: "",
          mediaIds: [mediaResponse.data.id],
        };

        await createPost(postData).unwrap();
        console.log(`${postType} image post created successfully`);
      }
    } catch (error) {
      console.error(`Failed to create ${postType} image post:`, error);
      // Don't show error to user as the profile update was successful
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setCoverPhotoFile(null);
    if (profile && Object.keys(profile).length > 0) {
      setFullName(profile.displayName || "");
      setUsername(authUser?.username || profile.username || "");
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setWebsite(profile.website || "");
    }
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!fullName.trim()) {
        toast.error("Display name is required");
        return;
      }

      const formData = new FormData();
      formData.append("displayName", fullName.trim());
      formData.append("bio", bio || "");
      formData.append("website", website || "");
      formData.append("location", location || "");

      if (avatarFile) formData.append("avatar", avatarFile);
      if (coverPhotoFile) formData.append("coverPhoto", coverPhotoFile);

      console.log("Sending FormData:", {
        displayName: fullName.trim(),
        bio: bio || "",
        website: website || "",
        location: location || "",
        hasAvatar: !!avatarFile,
        hasCoverPhoto: !!coverPhotoFile,
      });

      if (profile && Object.keys(profile).length > 0) {
        // Profile exists → Update
        console.log("Updating existing profile...");
        await updateProfile(formData).unwrap();
        toast.success("Profile updated successfully!");
      } else {
        // No profile → Create
        console.log("Creating new profile...");
        await createProfile(formData).unwrap();
        toast.success("Profile created successfully!");
      }

      // Create posts for uploaded images
      if (avatarFile) {
        await createImagePost(avatarFile, "profile");
      }
      if (coverPhotoFile) {
        await createImagePost(coverPhotoFile, "cover");
      }

      setIsEditing(false);
      setAvatarFile(null);
      setCoverPhotoFile(null);
      refetch();
    } catch (err: any) {
      console.error("Save failed:", err);
      toast.error(
        `Save failed: ${err?.data?.message || err?.message || "Unknown error"}`
      );
    }
  };

  const formatWebsiteUrl = (url: string | undefined) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
  };

  if (authLoading || isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-8 text-red-600">
        Failed to load profile.{" "}
        <button onClick={() => refetch()} className="underline text-blue-600">
          Retry
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
            coverPhotoFile
              ? URL.createObjectURL(coverPhotoFile as Blob)
              : profile?.coverPhoto?.url
              ? profile.coverPhoto.url.startsWith("http")
                ? profile.coverPhoto.url
                : `${baseUrl}${profile.coverPhoto.url}`
              : "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1470&q=80"
          }
          alt="Cover"
          className="w-full h-64 object-cover"
          onError={(e) => {
            console.log("Cover photo failed to load:", e.currentTarget.src);
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1470&q=80";
          }}
        />

        {isEditing ? (
          <div className="absolute top-4 right-4">
            <label className="bg-black bg-opacity-70 hover:bg-opacity-80 text-white font-semibold py-2 px-4 rounded-full text-sm flex items-center cursor-pointer transition-all">
              <Camera className="mr-2 h-4 w-4" />
              Change Cover
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file) setCoverPhotoFile(file);
                }}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <button
            onClick={handleEdit}
            className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 font-semibold py-2 px-4 rounded-full text-sm flex items-center transition-all"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Edit Cover
          </button>
        )}
      </div>

      {/* Profile Info */}
      <div className="p-6">
        <div className="flex justify-between items-start -mt-20">
          <div className="relative">
            <img
              src={
                avatarFile
                  ? URL.createObjectURL(avatarFile)
                  : profile?.avatar?.url
                  ? profile.avatar.url.startsWith("http")
                    ? profile.avatar.url
                    : baseUrl + profile.avatar.url
                  : "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=687&q=80"
              }
              alt="Profile"
              className="w-36 h-36 rounded-full border-4 border-white object-cover shadow-lg"
              onError={(e) => {
                console.log("Avatar failed to load:", e.currentTarget.src);
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=687&q=80";
              }}
            />
            {isEditing && (
              <label className="absolute bottom-2 right-2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg transition-all">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setAvatarFile(e.target.files[0]);
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center space-x-2 mt-20">
              <button
                onClick={handleEdit}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-all flex items-center"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Profile
              </button>
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full flex items-center transition-all">
                <Mail className="mr-2 h-4 w-4" />
                Message
              </button>
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full flex items-center transition-all">
                <UserPlus className="mr-2 h-4 w-4" />
                Follow
              </button>
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold p-3 rounded-full transition-all">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-6">
            <div className="flex justify-end space-x-2 mb-6">
              <button
                onClick={handleSave}
                disabled={isUpdating || isCreating}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-2 px-6 rounded-full transition-all"
              >
                {isUpdating || isCreating ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isUpdating || isCreating}
                className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-bold py-2 px-6 rounded-full transition-all"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    disabled
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm text-gray-500 cursor-not-allowed"
                    placeholder="Username cannot be changed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Tell us about yourself..."
                  maxLength={160}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {bio.length}/160 characters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Where are you located?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="yourwebsite.com"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
              {username && <p className="text-gray-500 text-lg">@{username}</p>}
            </div>

            {bio && (
              <div className="mt-4">
                <p className="text-gray-800 text-lg leading-relaxed">{bio}</p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-6 text-gray-600">
              {location && (
                <div className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  <span>{location}</span>
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                <span>
                  Joined {formatJoinDate(authUser?.createdAt) || "Unknown"}
                </span>
              </div>
              {website && (
                <div className="flex items-center">
                  <Link className="mr-2 h-5 w-5" />
                  <a
                    href={formatWebsiteUrl(website)}
                    className="text-blue-500 hover:text-blue-600 hover:underline transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {website}
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
                <div className="text-2xl font-bold text-gray-900">421</div>
                <div className="text-sm text-gray-500">Posts</div>
              </div>
            </div>

            {/* Follow Requests Panel */}
            <div className="mt-8">
              <FollowRequestsPanel />
            </div>

            {/* Posts Section */}
            <ProfilePostsSection
              userId={authUser?.id || 0}
              isOwnProfile={true}
              profileData={{
                avatar: profile?.avatar,
                coverPhoto: profile?.coverPhoto,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
