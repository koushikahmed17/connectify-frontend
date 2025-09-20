// Utility functions for handling user avatars

export const getAvatarUrl = (user: any, fallbackText?: string): string => {
  if (!user) {
    return getDefaultAvatar(fallbackText || "U");
  }

  if (user.profile?.avatar?.url) {
    // If the URL is already a full URL, use it as is
    if (user.profile.avatar.url.startsWith("http")) {
      return user.profile.avatar.url;
    }
    // If it's a relative path, prepend the backend URL
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    return `${backendUrl}${user.profile.avatar.url}`;
  }

  // Return a default avatar with user's initial
  const initial = fallbackText || user.username?.charAt(0).toUpperCase() || "U";
  return getDefaultAvatar(initial);
};

export const getAvatarUrlFromString = (
  avatarUrl: string | undefined | null
): string | null => {
  if (!avatarUrl) return null;

  if (avatarUrl.startsWith("http")) {
    return avatarUrl;
  }

  const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  return `${backendUrl}${avatarUrl}`;
};

export const getDefaultAvatar = (text: string): string => {
  // Create a data URI for a simple colored circle with text
  // This avoids external dependencies and network issues
  const size = 150;
  const backgroundColor = "#6366f1"; // Purple color
  const textColor = "#ffffff"; // White text

  // Create SVG data URI
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${
    size / 2
  }" fill="${backgroundColor}"/>
      <text x="50%" y="50%" text-anchor="middle" dy="0.35em" font-family="Arial, sans-serif" font-size="${
        size / 3
      }" font-weight="bold" fill="${textColor}">${text}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const handleAvatarError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackText?: string
) => {
  // Hide the image and show the fallback div instead
  const img = e.currentTarget;
  const fallbackDiv = img.nextElementSibling as HTMLElement;

  if (fallbackDiv) {
    img.style.display = "none";
    fallbackDiv.style.display = "flex";
  }
};
