import React, { useState, useRef, useEffect } from "react";
import { FaHome, FaUserFriends, FaBell, FaSearch } from "react-icons/fa";
import { FiLogOut, FiSettings } from "react-icons/fi";
import { FaRegMessage } from "react-icons/fa6";
import { useLogoutMutation } from "../../redux/features/authApi"; // adjust path as needed
import { Link } from "react-router-dom";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [logout, { isLoading }] = useLogoutMutation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await logout().unwrap();
      setDropdownOpen(false);
      // After logout, do any redirect or cleanup here:
      // e.g., navigate to login page or clear local storage
      window.location.href = "/login"; // example redirect
    } catch (error) {
      console.error("Logout failed:", error);
      // optionally show user feedback here
    }
  };

  return (
    <nav className="bg-white shadow-lg px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      {/* Left side - Logo */}
      <div className="flex items-center space-x-3">
        <img
          src="/logo.png"
          alt="Connectify Logo"
          className="w-30 h-10 object-contain"
          draggable={false}
        />
      </div>

      {/* Middle - Search bar */}
      <div className="flex items-center border border-gray-200 rounded-full px-4 py-2 w-1/3 max-w-md shadow-inner focus-within:ring-2 focus-within:ring-blue-500">
        <FaSearch className="text-gray-400 mr-3 text-lg" />
        <input
          type="search"
          placeholder="Search on Connectify"
          className="bg-transparent outline-none w-full text-sm placeholder-gray-500"
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {/* Right side - Navigation & Profile */}
      <div className="flex items-center space-x-6 text-gray-700">
        {[FaHome, FaUserFriends, FaRegMessage, FaBell].map((Icon, i) => (
          <Icon
            key={i}
            className="text-xl cursor-pointer transition-colors duration-200 hover:text-blue-600"
            title={
              Icon === FaHome
                ? "Home"
                : Icon === FaUserFriends
                ? "Friends"
                : Icon === FaRegMessage
                ? "Messages"
                : "Notifications"
            }
          />
        ))}

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <img
            src="/user.jpg"
            alt="User Avatar"
            className="rounded-full w-10 h-10 cursor-pointer border-2 border-gray-300 hover:border-blue-500 transition-all duration-300"
            draggable={false}
            onClick={() => setDropdownOpen((prev) => !prev)}
          />
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-44 bg-white shadow-xl rounded-lg transition-opacity duration-300 z-50">
              <ul className="py-2">
                <li className="hover:bg-gray-100 transition-colors duration-150">
                  <Link
                    to="/userprofile"
                    className="px-5 py-3 flex items-center space-x-3 cursor-pointer"
                  >
                    <FiSettings className="text-lg" />
                    <span className="font-medium text-gray-700">Profile</span>
                  </Link>
                </li>

                <li
                  className={`hover:bg-gray-100 transition-colors duration-150 ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <button
                    onClick={() => !isLoading && handleSignOut()}
                    className="px-5 py-3 flex items-center space-x-3 w-full text-left"
                    disabled={isLoading}
                  >
                    <FiLogOut className="text-lg" />
                    <span className="font-medium text-gray-700">
                      {isLoading ? "Signing Out..." : "Sign Out"}
                    </span>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
