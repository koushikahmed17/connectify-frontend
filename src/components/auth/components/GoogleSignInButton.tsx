import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import GoogleAuthService from "../../../services/googleAuthService";

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  size?: "large" | "medium" | "small";
  theme?: "outline" | "filled_blue" | "filled_black";
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  className = "",
  text = "continue_with",
  size = "large",
  theme = "outline",
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const googleAuthService = GoogleAuthService.getInstance();

  useEffect(() => {
    const initializeButton = async () => {
      try {
        await googleAuthService.loadGoogleScript();

        if (buttonRef.current) {
          googleAuthService.renderButton(
            buttonRef.current,
            (credential) => {
              setIsLoading(true);
              onSuccess(credential);
            },
            (error) => {
              setIsLoading(false);
              if (onError) {
                onError(error);
              } else {
                toast.error(error);
              }
            },
            {
              theme,
              size,
              text,
              width: 300,
            }
          );
        }
      } catch (error) {
        console.error("Failed to initialize Google Sign-In:", error);
        if (onError) {
          onError("Failed to load Google Sign-In");
        } else {
          toast.error("Failed to load Google Sign-In");
        }
      }
    };

    initializeButton();
  }, [googleAuthService, onSuccess, onError, theme, size, text]);

  const handleClick = () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    googleAuthService.initializeGoogleSignIn(
      (credential) => {
        onSuccess(credential);
      },
      (error) => {
        setIsLoading(false);
        if (onError) {
          onError(error);
        } else {
          toast.error(error);
        }
      }
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={buttonRef}
        onClick={handleClick}
        className={`cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default GoogleSignInButton;

