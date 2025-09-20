// Google OAuth Service for Frontend
export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private gsiLoaded = false;

  private constructor() {}

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  // Load Google Identity Services script
  public async loadGoogleScript(): Promise<void> {
    if (this.gsiLoaded) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.gsiLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error("Failed to load Google Identity Services"));
      };

      document.head.appendChild(script);
    });
  }

  // Initialize Google Sign-In
  public async initializeGoogleSignIn(
    onSuccess: (credential: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    await this.loadGoogleScript();

    if (typeof window !== "undefined" && window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError("No credential received from Google");
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    } else {
      onError("Google Identity Services not loaded");
    }
  }

  // Render Google Sign-In button
  public renderButton(
    element: HTMLElement,
    onSuccess: (credential: string) => void,
    onError: (error: string) => void,
    options?: {
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      width?: number;
    }
  ): void {
    if (typeof window !== "undefined" && window.google) {
      window.google.accounts.id.renderButton(element, {
        theme: options?.theme || "outline",
        size: options?.size || "large",
        text: options?.text || "continue_with",
        shape: options?.shape || "rectangular",
        width: options?.width || 300,
      });

      // Set up click handler
      element.addEventListener("click", () => {
        this.initializeGoogleSignIn(onSuccess, onError);
      });
    }
  }

  // Sign out
  public signOut(): void {
    if (typeof window !== "undefined" && window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  }
}

// Global type declarations for Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export default GoogleAuthService;

