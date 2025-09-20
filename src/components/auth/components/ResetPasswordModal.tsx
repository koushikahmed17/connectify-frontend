import React, { useState } from "react";
import { X, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  otp: string;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  email,
  otp,
}) => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers,
    };
  };

  const passwordValidation = validatePassword(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!passwordValidation.isValid) {
      toast.error("Password does not meet requirements");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp,
            newPassword: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast.success("Password reset successfully");
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        toast.error(data.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Password Reset Successful!
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Your password has been reset successfully. You can now login with
              your new password.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
            >
              Continue to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 text-center rounded-t-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white italic">
              Reset Password
            </h2>
            <div className="w-5 h-5"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Create New Password
            </h3>
            <p className="text-gray-600 text-sm">
              Enter a strong password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  required
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
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

              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div
                    className={`text-xs flex items-center ${
                      passwordValidation.minLength
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    <div
                      className={`w-1 h-1 rounded-full mr-2 ${
                        passwordValidation.minLength
                          ? "bg-green-600"
                          : "bg-red-500"
                      }`}
                    ></div>
                    At least 6 characters
                  </div>
                  <div
                    className={`text-xs flex items-center ${
                      passwordValidation.hasUpperCase
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    <div
                      className={`w-1 h-1 rounded-full mr-2 ${
                        passwordValidation.hasUpperCase
                          ? "bg-green-600"
                          : "bg-red-500"
                      }`}
                    ></div>
                    One uppercase letter
                  </div>
                  <div
                    className={`text-xs flex items-center ${
                      passwordValidation.hasLowerCase
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    <div
                      className={`w-1 h-1 rounded-full mr-2 ${
                        passwordValidation.hasLowerCase
                          ? "bg-green-600"
                          : "bg-red-500"
                      }`}
                    ></div>
                    One lowercase letter
                  </div>
                  <div
                    className={`text-xs flex items-center ${
                      passwordValidation.hasNumbers
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    <div
                      className={`w-1 h-1 rounded-full mr-2 ${
                        passwordValidation.hasNumbers
                          ? "bg-green-600"
                          : "bg-red-500"
                      }`}
                    ></div>
                    One number
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  required
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>

              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="mt-2">
                  <div
                    className={`text-xs flex items-center ${
                      formData.password === formData.confirmPassword
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    <div
                      className={`w-1 h-1 rounded-full mr-2 ${
                        formData.password === formData.confirmPassword
                          ? "bg-green-600"
                          : "bg-red-500"
                      }`}
                    ></div>
                    {formData.password === formData.confirmPassword
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={
                isLoading ||
                !passwordValidation.isValid ||
                formData.password !== formData.confirmPassword
              }
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 transform ${
                isLoading ||
                !passwordValidation.isValid ||
                formData.password !== formData.confirmPassword
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Resetting Password...
                </div>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordModal;

