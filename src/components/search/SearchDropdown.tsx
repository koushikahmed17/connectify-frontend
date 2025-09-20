import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSearchUsersQuery } from "../../redux/features/searchApi";
import { getAvatarUrl, handleAvatarError } from "../../utils/avatarUtils";

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  isOpen,
  onClose,
  searchQuery,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: searchResults,
    isLoading,
    error,
  } = useSearchUsersQuery(
    { query: debouncedQuery, limit: 8 },
    { skip: !debouncedQuery || debouncedQuery.length < 2 }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const users = searchResults?.data || [];

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
    >
      {isLoading && debouncedQuery ? (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 text-sm mt-2">Searching...</p>
        </div>
      ) : error ? (
        <div className="p-4 text-center text-red-500 text-sm">
          Error searching users
        </div>
      ) : debouncedQuery.length < 2 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          Type at least 2 characters to search
        </div>
      ) : users.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          No users found for "{debouncedQuery}"
        </div>
      ) : (
        <div className="py-2">
          {users.map((user) => {
            const avatarUrl = getAvatarUrl(
              user,
              user.username?.charAt(0).toUpperCase()
            );

            return (
              <Link
                key={user.id}
                to={`profile/${user.id}`}
                className="flex items-center p-3 hover:bg-gray-50 transition-colors duration-150"
                onClick={onClose}
              >
                <div className="flex-shrink-0">
                  <img
                    src={avatarUrl}
                    alt={user.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    onError={(e) =>
                      handleAvatarError(
                        e,
                        user.username?.charAt(0).toUpperCase()
                      )
                    }
                  />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.displayName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    @{user.username}
                  </p>
                  {user.postsCount > 0 && (
                    <p className="text-xs text-gray-400">
                      {user.postsCount} post{user.postsCount !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
