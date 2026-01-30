/**
 * Global API Endpoints
 **/

import { getNumericDriverId } from "@/utils/helpers";

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
  /** Get heatmap coordinates for customer pickup addresses */
  getHeatmapCoordinates: "/settings-service/heatmap/coordinates",
} as const;

export const BASE_OFFICE_ENDPOINTS = {
  /** Get base office contact details */
  getContactDetails: "/settings-service/base-office/contact-details",
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
  /** Get system suggested bid prices */
  getSystemSuggestedBidPrices:
    "/auction/trip-offers/system-suggested-bid-prices",
} as const;

export const DRIVER_ENDPOINTS = {
  /** Mark driver as offline */
  markOffline: (driverId: string | number | undefined) => {
    const numericValue = getNumericDriverId(driverId);
    return `/online-drivers/drivers/${numericValue}`;
  },
  /** Post or update driver's current location while online */
  postOnlineLocation: (driverId: string | number | undefined) => {
    const numericValue = getNumericDriverId(driverId);
    return `/online-drivers/drivers/${numericValue}/location`;
  },
  /** Get driver's current location */
  getOnlineLocation: (driverId: string | number | undefined) => {
    const numericValue = getNumericDriverId(driverId);
    return `/online-drivers/drivers/${numericValue}/location`;
  },
  /** Update driver online/offline status */
  updateStatus: (driverId: string | number | undefined) => {
    const numericValue = getNumericDriverId(driverId);
    return `/online-drivers/drivers/${numericValue}/status`;
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
  updateDestination: (id: number) =>
    `/settings-service/driver/desired-destinations/${id}`,
  /** Delete a desired destination */
  deleteDestination: (id: number) =>
    `/settings-service/driver/desired-destinations/${id}`,
} as const;

export const NOTIFICATIONS_ENDPOINTS = {
  /** Get all notifications for the driver */
  getNotifications: "/notifications/notifications",
  /** Mark a notification as read */
  markAsRead: (id: string | number) =>
    `/notifications/notifications/${id}/read`,
  /** Reply to an actionable notification */
  reply: (id: string | number) => `/notifications/notifications/${id}/reply`,
  /** Register (upsert) Expo push token for this device */
  registerPushToken: "/notifications/push-tokens",
} as const;

// Active Trip API Routes
export const ACTIVE_TRIP_ROUTES = {
  RETRIEVAL_ID: "/active-trips/active-trips/retrieval-id",
  DRIVER_ACTION: "/active-trips/active-trips/driver-action",
  ADD_STOP: "/active-trips/active-trips/add-stop",
  CANCEL: "/active-trips/active-trips/cancel",
  UPDATE_ETA: "/active-trips/active-trips/update-eta",
  GET_ETA: "/active-trips/active-trips/get-eta",
  SUBMIT_FEEDBACK: "/active-trips/active-trips/submit-feedback",
  GET_TRIP_BY_NUMBER: "/active-trips/active-trips/trip-by-number",
} as const;
