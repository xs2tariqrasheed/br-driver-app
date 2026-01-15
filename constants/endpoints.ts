/**
 * Global API Endpoints
 **/

export const AUTH_ENDPOINTS = {
  /** Sign in */
  login: "/auth/signin",
  /** Request password reset OTP */
  requestOtp: "/auth/forgot-password",
  /** Request OTP for forgot user ID */
  requestOtpForUserId: "/auth/forgot-user-id",
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
  cancelBid: "/auction/trip-offers/bids/cancel",
  /** Mark a bid as expired */
  expireBid: "/auction/trip-offers/bids/expire",
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
  markOffline: (driverId: string) => {
    const numericId = driverId.match(/(\d+)$/)?.[1] || driverId;
    return `/online-drivers/drivers/${numericId}`;
  },
  /** Post or update driver's current location while online */
  postOnlineLocation: (driverId: string) => {
    const numericId = driverId.match(/(\d+)$/)?.[1] || driverId;
    return `/online-drivers/drivers/${numericId}/location`;
  },
  /** Get driver's current location */
  getOnlineLocation: (driverId: string) => {
    const numericId = driverId.match(/(\d+)$/)?.[1] || driverId;
    return `/online-drivers/drivers/${numericId}/location`;
  },
  /** Update driver online/offline status */
  updateStatus: (driverId: string) => {
    // Ensure we send only the numeric part of the driver ID (e.g., "d-1" -> "1")
    const numericId = driverId.match(/(\d+)$/)?.[1] || driverId;
    return `/online-drivers/drivers/${numericId}/status`;
  },
} as const;

export type AuthEndpointKey = keyof typeof AUTH_ENDPOINTS;

export const APP_ENDPOINTS = {
  /** Get app content */
  content: "/settings-service/content",
} as const;

export const DRIVER_SETTINGS_ENDPOINTS = {
  /** Get driver settings */
  getSettings: "/settings-service/driver/settings",
  /** Update driver settings */
  updateSettings: "/settings-service/driver/settings",
  /** Delete driver profile */
  deleteProfile: "/settings-service/driver/profile",
} as const;

export const DESIRED_DESTINATIONS_ENDPOINTS = {
  /** Get all desired destinations */
  getDestinations: "/settings-service/driver/desired-destinations",
  /** Create a new desired destination */
  createDestination: "/settings-service/driver/desired-destinations",
  /** Update a desired destination */
  updateDestination: (id: number) => `/settings-service/driver/desired-destinations/${id}`,
  /** Delete a desired destination */
  deleteDestination: (id: number) => `/settings-service/driver/desired-destinations/${id}`,
} as const;

export const NOTIFICATIONS_ENDPOINTS = {
  /** Get all notifications for the driver */
  getNotifications: "/notifications/notifications",
  /** Mark a notification as read */
  markAsRead: (id: string | number) => `/notifications/notifications/${id}/read`,
  /** Reply to an actionable notification */
  reply: (id: string | number) => `/notifications/notifications/${id}/reply`,
} as const;

// Active Trip API Routes
export const ACTIVE_TRIP_ROUTES = {
  RETRIEVAL_ID: "/active-trips/active-trips/retrieval-id",
  DRIVER_ACTION: "/active-trips/active-trips/driver-action",
  ADD_STOP: "/active-trips/active-trips/add-stop",
  CANCEL: "/active-trips/active-trips/cancel",
} as const;
