// Token helpers bound to the app's chosen token key
export const TOKEN_KEY = "@token";
// Global auth object storage key
export const AUTH_STORAGE_KEY = "@auth";

// URLs
export const URLS = {
  requestRegistration: "https://google.com",
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
