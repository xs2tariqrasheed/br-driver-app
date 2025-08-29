/**
 * Global API Endpoints
 **/

export const AUTH_ENDPOINTS = {
  /** Sign in */
  login: "/auth/signin",
  /** Request password reset OTP */
  requestOtp: "/auth/forgot-password",
  /** Verify email with OTP */
  verifyOtp: "/auth/verify",
  /** Reset password with OTP */
  resetPassword: "/auth/reset-password",
  /** Update/change password (authenticated flow) */
  updatePassword: "/auth/update-password",
  /** Create account */
  signup: "/auth/signup",
} as const;

export const HEATMAP_ENDPOINTS = {
  // Heatmap API endpoint (dummy for now)
  heatmapData: "https://api.example.com/heatmap-data",
} as const;

export type AuthEndpointKey = keyof typeof AUTH_ENDPOINTS;
