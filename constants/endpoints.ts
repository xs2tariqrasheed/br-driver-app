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
  /** Get current user */
  getCurrentUser: "/auth/me",
} as const;

export const HEATMAP_ENDPOINTS = {
  // Heatmap API endpoint (dummy for now)
  heatmapData: "https://api.example.com/heatmap-data",
} as const;

export const LIVE_JOB_ENDPOINTS = {
  /** Get live job offers */
  getLiveJobs: "/trip-offers",
  /** Submit a bid */
  submitBid: "/bids/submit",
  /** Cancel a bid */
  cancelBid: "/bids/cancel",
} as const;

export const DRIVER_ENDPOINTS = {
  /** Mark driver as offline */
  markOffline: (driverId: string) => `/api/drivers/${driverId}`,
  /** Post or update driver's current location while online */
  postOnlineLocation: (driverId: string) => `/api/drivers/${driverId}/location`,
} as const;

export type AuthEndpointKey = keyof typeof AUTH_ENDPOINTS;
