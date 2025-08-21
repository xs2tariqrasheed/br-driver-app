// Token helpers bound to the app's chosen token key
export const TOKEN_KEY = "@token";
// Global auth object storage key
export const AUTH_STORAGE_KEY = "@auth";
// Driver status storage key
export const DRIVER_STORAGE_KEY = "@driver";

// Driver status display labels (used in UI)
export const DRIVER_STATUS = {
  ONLINE: "Online",
  OFFLINE: "Offline",
} as const;

export type DriverStatusLabel =
  (typeof DRIVER_STATUS)[keyof typeof DRIVER_STATUS];

// URLs
export const URLS = {
  requestRegistration: "https://google.com",
  // Temporary Expo Go client links for testing share flow
  appStore: "https://apps.apple.com/app/expo-go/id982107779",
  playStore: "https://play.google.com/store/apps/details?id=host.exp.exponent",
};

// OTP / Verification
// Default countdown seconds before allowing resend. Can be updated centrally.
export const OTP_RESEND_SECONDS = 40;

// OTP length used across verification flows (e.g., Verify OTP screen)
export const OTP_LENGTH = 6;

// Biometric-related UI strings used in auth flows
export const BIOMETRIC_DISABLED_TITLE = "Face Recognition Not Enable";
export const BIOMETRIC_DISABLED_MESSAGE =
  "Face recognition is not enabled. Please enable it to proceed next.";

// Supported biometric authentication methods used in UI and checks
export type BiometricMethod = "fingerprint" | "faceId" | "faceRecognition";

// Skeleton loader defaults used across the app
export const SKELETON_DEFAULT_HEIGHT = 200;
export const SKELETON_DEFAULT_RADIUS = 10;
export const SKELETON_DEFAULT_DURATION_MS = 1200;

// Contact Base info used in More → Contact Base bottom sheet
// Centralized so content and assets are easy to update later
export const CONTACT_BASE = {
  address: "3272 Gale Ave Long Island City, NY 11101",
  // Primary dispatcher number used by the Call Dispatcher button
  dispatcherPhone: "000-000-0000",
  // Listed numbers
  driverRelationsPhone: "000-000-0000",
  businessOfficePhone: "000-000-0000",
} as const;

// App Settings screen configuration
export const APP_SETTINGS_ITEMS = [
  { key: "login", label: "Login Settings" },
  { key: "ride-preferences", label: "Ride Preferences" },
  { key: "availability", label: "Availability & Scheduling" },
  { key: "safety", label: "Safety Settings" },
  { key: "notifications", label: "Notifications" },
  { key: "app-info", label: "App Info" },
] as const;

// Application version shown in App Info section
export const APP_VERSION = "1.0.0" as const;
