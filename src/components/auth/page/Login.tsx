import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLoginMutation } from "../../../redux/features/authApi";
import { useDispatch } from "react-redux";
import { setUser } from "../../../redux/features/userSlice";
import { Eye, EyeOff, Mail, Lock, Smartphone } from "lucide-react";
import { toast } from "react-toastify";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import OTPVerificationModal from "../components/OTPVerificationModal";
import ResetPasswordModal from "../components/ResetPasswordModal";
import CustomGoogleButton from "../components/CustomGoogleButton";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [verifiedOTP, setVerifiedOTP] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Real-time email validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({
      ...formData,
      email: email,
    });

    // Clear previous error when user starts typing
    if (emailError) {
      setEmailError("");
    }

    // Validate email in real-time
    if (email && !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
    } else if (email && validateEmail(email)) {
      setEmailError("");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === "email") {
      handleEmailChange(e);
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    // Validate email format
    if (formData.email && !validateEmail(formData.email)) {
      setEmailError("Please enter a valid email address");
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const response = await login(formData).unwrap();

      // Store JWT token in localStorage
      if (response.access_token) {
        localStorage.setItem("access_token", response.access_token);
      }

      // Save user in redux store
      dispatch(setUser(response.user));

      // Redirect to home page
      navigate("/");
    } catch (err) {
      if (err?.data?.message) {
        setError(err.data.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  const handleForgotPasswordClick = () => {
    setShowForgotPassword(true);
  };

  const handleEmailSubmitted = (email: string) => {
    setForgotPasswordEmail(email);
    setShowForgotPassword(false);
    setShowOTPVerification(true);
  };

  const handleOTPVerified = (otp: string) => {
    setVerifiedOTP(otp);
    setShowOTPVerification(false);
    setShowResetPassword(true);
  };

  const handleResendOTP = async () => {
    // This will be handled by the OTPVerificationModal component
  };

  const handleCloseModals = () => {
    setShowForgotPassword(false);
    setShowOTPVerification(false);
    setShowResetPassword(false);
    setForgotPasswordEmail("");
    setVerifiedOTP("");
  };

  const handleGoogleSignIn = async (credential: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/google`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: credential }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Store user data in Redux
        dispatch(setUser(data.user));

        // Store token in localStorage for persistence
        localStorage.setItem("access_token", data.access_token);

        toast.success("Login successful!");
        navigate("/");
      } else {
        toast.error(data.message || "Google authentication failed");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Main Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header with Logo */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 text-center">
            <h1 className="text-xl font-bold text-white mb-1 italic">
              Connectify
            </h1>
            <p className="text-purple-100 text-xs">
              Welcome back! Please sign in to your account
            </p>
          </div>

          {/* Form Section */}
          <div className="px-6 py-4">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm text-center font-medium">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail
                      className={`h-5 w-5 ${
                        emailError ? "text-red-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    required
                    className={`w-full pl-12 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      emailError
                        ? "border-red-300 focus:ring-red-500 bg-red-50 focus:bg-red-50"
                        : "border-gray-200 focus:ring-purple-500 bg-gray-50 focus:bg-white"
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Enter your password"
                    required
                    className="w-full pl-12 pr-12 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={
                  isLoading ||
                  !!emailError ||
                  !formData.email ||
                  !formData.password
                }
                className={`w-full py-2.5 rounded-xl font-semibold text-white transition-all duration-200 transform ${
                  isLoading ||
                  !!emailError ||
                  !formData.email ||
                  !formData.password
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-3 flex items-center">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-4 text-sm text-gray-500 bg-white">or</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              <CustomGoogleButton
                onSuccess={handleGoogleSignIn}
                text="Sign in with Google"
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={handleCloseModals}
        onEmailSubmitted={handleEmailSubmitted}
      />

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={showOTPVerification}
        onClose={handleCloseModals}
        email={forgotPasswordEmail}
        onOTPVerified={handleOTPVerified}
        onResendOTP={handleResendOTP}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showResetPassword}
        onClose={handleCloseModals}
        email={forgotPasswordEmail}
        otp={verifiedOTP}
      />
    </div>
  );
}

export default Login;
