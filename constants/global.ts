// Import colors for bid status
import { bidStatusColors } from "./colors";

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
  // Driver portal (testing)
  driverPortal: "https://google.com",
  // Earnings portal (testing)
  earningsPortal: "https://google.com",
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

// Driver Settings (Featured Driver & Auto-bid) – central constants
export const FEATURED_DRIVER_PRICE_MIN = 0;
export const FEATURED_DRIVER_PRICE_MAX = 10;
export const ETA_BUFFER_MINUTES_MIN = 0;
export const ETA_BUFFER_MINUTES_MAX = 10;

// Auto-bid selectable price strategies. Keep labels user-facing for display.
export const AUTO_BID_PRICE_OPTIONS = [
  "Customer price +10%",
  "Customer price +5%",
  "Customer price",
  "Customer price -5%",
  "Customer price -10%",
] as const;

// Desired Destinations
// Maximum number of desired locations a user can configure for now.
// Tweak here to change globally.
export const MAX_DESIRED_LOCATIONS = 3;

// Desired destination expiration time in milliseconds
// Current: 6 hours - can be easily changed to 5 minutes (300000), 1 hour (3600000), etc.
export const DESIRED_DESTINATION_EXPIRY_MS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

// Coordinate format validation regex
// Matches coordinate format like "31.355034, 74.396754" (latitude, longitude)
export const COORDINATE_REGEX = /^-?\d+\.\d+,\s*-?\d+\.\d+$/;

// Google Maps API Key - loaded from environment variable
// Fallback to hardcoded key for development (should be removed in production)
export const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  "AIzaSyDXb5djCy2217thBLl785mPmds2_qudYC8";

// Heatmap configuration
// Auto-refresh interval for heatmap data in milliseconds
export const HEATMAP_REFRESH_INTERVAL_MS = 120000; // 2 minutes

// Ride Types
export const RIDE_TYPES = {
  ONE_WAY: "one-way",
  ROUND_TRIP: "round-trip",
  HOURLY: "hourly",
} as const;

export type RideType = (typeof RIDE_TYPES)[keyof typeof RIDE_TYPES];

// Live Job Offers
// API refresh interval for live job offers in milliseconds
export const LIVE_JOB_REFRESH_INTERVAL_MS = 60000; // 60 seconds

// Live Job Status types (API status)
export const LIVE_JOB_STATUS = {
  OFFERED: "offered",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  EXPIRED: "expired",
} as const;

export type LiveJobStatus =
  (typeof LIVE_JOB_STATUS)[keyof typeof LIVE_JOB_STATUS];

// Local UI Status types (for swipe/hide functionality)
export const LOCAL_JOB_STATUS = {
  VISIBLE: "visible",
  SKIPPED: "skipped",
  HIDDEN: "hidden",
} as const;

export type LocalJobStatus =
  (typeof LOCAL_JOB_STATUS)[keyof typeof LOCAL_JOB_STATUS];

// Sorting options for live jobs
export const JOB_SORT_OPTIONS = {
  DISTANCE: "distance",
  TIME: "time",
} as const;

export type JobSortOption =
  (typeof JOB_SORT_OPTIONS)[keyof typeof JOB_SORT_OPTIONS];

// Driver Types for live jobs
export const DRIVER_TYPES = {
  INDEPENDENT_OPERATOR: "independent-operator",
  HIRED: "hired",
} as const;

// Empty state messages
export const EMPTY_STATE_MESSAGES = {
  NO_JOBS_TITLE: "No Jobs Available Yet",
  NO_JOBS_MESSAGE:
    "There are no jobs available in your area at this time. Please keep the app open to see the ride offers. Or you can move to another area to see jobs in that area.",
} as const;

// Bid Waiting Timer
// Duration for the bid waiting timer in milliseconds
// Default: 30 seconds - can be easily changed to 15 seconds (15000), 1 minute (60000), etc.
export const BID_WAITING_TIMER_DURATION_MS = 30000; // 30 seconds

// Bid Status Types
export const BID_STATUS = {
  EXPIRED: "expired",
  UNSUCCESSFUL: "unsuccessful",
  ACCEPTED: "accepted",
} as const;

export type BidStatus = (typeof BID_STATUS)[keyof typeof BID_STATUS];

// Bid Status Messages
export const BID_STATUS_MESSAGES = {
  EXPIRED: {
    TITLE: "Bid Expired!",
    DESCRIPTION:
      "The customer didn't respond in time. You can rebid if you're still interested.",
  },
  UNSUCCESSFUL: {
    TITLE: "Bid Unsuccessful!",
    DESCRIPTION:
      "The customer chose another driver. Don't worry! more ride offers are coming your way.",
  },
  ACCEPTED: {
    TITLE: "Bid Accepted!",
    DESCRIPTION:
      "The customer accepted your offer. Get ready to start the ride.",
  },
} as const;

// Bid Status Background Colors - imported from colors.ts
export const BID_STATUS_COLORS = {
  EXPIRED: bidStatusColors.expired,
  UNSUCCESSFUL: bidStatusColors.unsuccessful,
  ACCEPTED: bidStatusColors.accepted,
} as const;

// Bid Status Countdown Timer Duration (in seconds)
export const BID_STATUS_COUNTDOWN_DURATION_SECONDS = 10;
