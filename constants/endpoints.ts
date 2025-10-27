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
  getLiveJobs: "/auction/trip-offers",
  /** Get future job offers */
  getFutureJobs: "/auction/trip-offers/future",
  /** Submit a bid */
  submitBid: "/auction/bids/submit",
  /** Cancel a bid */
  cancelBid: "/auction/bids/cancel",
  /** Submit driver response to trip offer (bid, rebid, or skip) */
  driverResponse: "/auction/trip-offers/driver-response",
  /** Get trip offer details by ID */
  getTripOffer: "/auction/trip-offers/trip-offer",
  /** Get trip status by ID */
  getTripStatus: "/auction/trip-offers/trip-status",
  /** Get driver state by ID */
  getDriverState: "/auction/trip-offers/driver-state",
  /** Customer bid response */
  customerBidResponse: "/auction/trip-offers/customer-bid-response",
  /** Publish test offer */
  publishTest: "/auction/trip-offers/publish-test",
} as const;

export const DRIVER_ENDPOINTS = {
  /** Mark driver as offline */
  markOffline: (driverId: string) => `/online-drivers/drivers/${driverId}`,
  /** Post or update driver's current location while online */
  postOnlineLocation: (driverId: string) =>
    `/online-drivers/drivers/${driverId}/location`,
  /** Get driver's current location */
  getOnlineLocation: (driverId: string) =>
    `/online-drivers/drivers/${driverId}/location`,
} as const;

export type AuthEndpointKey = keyof typeof AUTH_ENDPOINTS;

export const APP_ENDPOINTS = {
  /** Get app content */
  content: "/settings-service/content",
} as const;

// Active Trip API Routes
export const ACTIVE_TRIP_ROUTES = {
  RETRIEVAL_ID: "/active-trips/active-trips/retrieval-id",
  DRIVER_ACTION: "/active-trips/active-trips/driver-action",
  ADD_STOP: "/active-trips/active-trips/add-stop",
} as const;
