/**
 * Global API Endpoints
 *
 * Note: Using dummy URLs for now. Replace with real paths when backend is ready.
 */

export const AUTH_ENDPOINTS = {
  /** Temporary dummy endpoint for login */
  login: "https://jsonplaceholder.typicode.com/posts",
  /** Dummy endpoint to request OTP */
  requestOtp: "https://jsonplaceholder.typicode.com/posts",
  /** Dummy endpoint to verify OTP */
  verifyOtp: "https://jsonplaceholder.typicode.com/posts",
  /** Dummy endpoint to reset password */
  resetPassword: "https://jsonplaceholder.typicode.com/posts",
  /** Dummy endpoint to update/change password */
  updatePassword: "https://jsonplaceholder.typicode.com/posts",
} as const;

export type AuthEndpointKey = keyof typeof AUTH_ENDPOINTS;
