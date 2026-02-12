// Import colors for bid status
import { ImageSourcePropType } from "react-native";
import { bidStatusColors } from "./colors";

// Testing Mode Configuration
// Set to true to route all API services and socket connections to testing URLs
// Set to false to use production environment variables or deployed URLs
// WARNING: Default is false for production safety
export const IS_TESTING = true;

// Token helpers bound to the app's chosen token key
export const TOKEN_KEY = "@token";
// Global auth object storage key
export const AUTH_STORAGE_KEY = "@auth";
// Driver status storage key
export const DRIVER_STORAGE_KEY = "@driver";
// Retrieval ID storage key
export const RETRIEVAL_ID_STORAGE_KEY = "@retrieval_id";
// Trip ID storage key
export const TRIP_ID_STORAGE_KEY = "@trip_id";
// Ride state storage key
export const RIDE_STATE_STORAGE_KEY = "@ride_state";
// Content cache storage key
export const CONTENT_STORAGE_KEY = "@content_cache";
// Deployed base URL storage key
export const DEPLOYED_BASE_URL_STORAGE_KEY = "@deployed_base_url";
// Notifications backup storage key (used during logout to preserve notifications)
export const NOTIFICATIONS_BACKUP_STORAGE_KEY = "@notifications_backup";

// Driver status display labels (used in UI)
export const DRIVER_STATUS = {
  ONLINE: "Online",
  OFFLINE: "Offline",
} as const;

// Car types
export const CAR_TYPE = {
  ECONOMY: "economy",
  SEDAN: "sedan",
  SUV: "suv",
  LUXURY: "luxury",
} as const;

export type CarType = (typeof CAR_TYPE)[keyof typeof CAR_TYPE];

// Driver status display labels (used in UI)
export const RIDE_TOGGLE_LABELS = {
  MAP: "Map",
  DETAILS: "Details",
} as const;

// Previous location storage key (used for online location posting)
export const PREVIOUS_LOCATION_STORAGE_KEY = "@previous_location";
// Offer timeout (in milliseconds) - matches backend OFFER_TIMEOUT
export const OFFER_TIMEOUT = 20000; // 20 seconds
// Threshold in meters before re-posting location
export const MENTIONED_DISTANCE = 10;
// Interval (ms) for posting driver's online location
export const ONLINE_LOCATION_INTERVAL_MS = 5000;

export type RideToggleLabel =
  (typeof RIDE_TOGGLE_LABELS)[keyof typeof RIDE_TOGGLE_LABELS];

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

// DB action defaults for driver app (aligned with @br-backend/constants DbActionDefaults)
// Used when the backend does not provide company/affiliate in the user (e.g. base-office contact-details)
// Prefer auth.user.company_id / auth.user.affiliate_num when the API returns them
export const DB_ACTION_DEFAULTS = {
  COMPANY_ID: 1,
  AFFILIATE_NUM: 101,
  APP_NAME: "driver-ios",
} as const;

// Content service defaults for mobile app
export const CONTENT_APP_NAME = "driverapp" as const;
export const CONTENT_VIEW_NAME = "APP_CONTENT" as const;
export const CONTENT_ACTION_CODE = "CMN.S.APP_CONTENT" as const;
export const CONTENT_AFFILIATE_NUM = 101 as const;

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
  address: "36-01 37th St, Long Island City, NY 11101, USA",
  // Primary dispatcher number used by the Call Dispatcher button
  dispatcherPhone: "000-000-0000",
  // Listed numbers
  driverRelationsPhone: "000-000-0000",
  businessOfficePhone: "000-000-0000",
} as const;

// SOS Emergency Numbers
// Centralized so phone numbers can be easily updated
export const SOS_NUMBERS = {
  DISPATCH: "000-000-0000", // Dispatcher emergency number
  EMERGENCY: "911", // Emergency services number
} as const;

// Cancel Ride Configuration
// Hours driver will be set offline for vehicle issues
export const VEHICLE_ISSUE_OFFLINE_HOURS = 4; // Can be easily changed

// Cancel ride reasons
export const CANCEL_RIDE_REASONS = [
  "Vehicle Issue",
  "Customer No Show",
  "Wrong Address",
  "Safety Concern",
  "Personal Emergency",
  "Other",
] as const;

export type CancelRideReason = (typeof CANCEL_RIDE_REASONS)[number];

// Driver Settings (Featured Driver & Auto-bid) – central constants
export const FEATURED_DRIVER_PRICE_MIN = 0;
export const FEATURED_DRIVER_PRICE_MAX = 30;
export const ETA_BUFFER_MINUTES_MIN = 0;
export const ETA_BUFFER_MINUTES_MAX = 20;

// Extra commission selectable price strategies. Keep values as numbers for backend.
export const EXTRA_COMMISSION_PRICE_OPTIONS = [
  { label: "Customer price +10%", value: 10 },
  { label: "Customer price +5%", value: 5 },
  { label: "Customer price", value: 0 },
  { label: "Customer price -5%", value: -5 },
  { label: "Customer price -10%", value: -10 },
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

// Heatmap demand weights (do not use API-provided weight)
export const HEATMAP_DEMAND_WEIGHTS = {
  HIGH: 0.9,
  MEDIUM: 0.7,
  LOW: 0.3,
  DEFAULT: 0.5,
} as const;

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

// Future Job Offers
// API refresh interval for future job offers in milliseconds
export const FUTURE_JOB_REFRESH_INTERVAL_MS = 300000; // 5 minutes

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
  VISIBLE: "offered",
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

// Offer Types for UI components
export const OFFER_TYPES = {
  LIVE: "live",
  HIRED: "hired",
  FUTURE: "future",
} as const;

export type OfferType = (typeof OFFER_TYPES)[keyof typeof OFFER_TYPES];

// Empty state messages
export const EMPTY_STATE_MESSAGES = {
  NO_JOBS_TITLE: "No Jobs Available Yet",
  NO_JOBS_MESSAGE:
    "There are no jobs available in your area at this time. Please keep the app open to see the ride offers. Or you can move to another area to see jobs in that area.",
  NO_HIRED_JOBS_MESSAGE:
    "There are no jobs assigned to you at the moment. Please keep the app open, new assignments will appear here once available.",
  NO_FUTURE_JOBS_MESSAGE:
    "There are no future jobs scheduled for you at this time. New assignments will appear here once the company schedules them.",
} as const;

// Bid Waiting Timer
// Duration for the bid waiting timer in milliseconds
// Default: 60 seconds - matches backend CUSTOMER_BID_RESPONSE_TIMEOUT
// This ensures driver timer matches the actual backend timeout for customer bid response
export const BID_WAITING_TIMER_DURATION_MS = 60000; // 60 seconds

// Bid Status Types
export const BID_STATUS = {
  EXPIRED: "expired",
  UNSUCCESSFUL: "unsuccessful",
  ACCEPTED: "accepted",
} as const;

export type BidStatus = (typeof BID_STATUS)[keyof typeof BID_STATUS];

// Bid Status Background Colors - imported from colors.ts
export const BID_STATUS_COLORS = {
  EXPIRED: bidStatusColors.expired,
  UNSUCCESSFUL: bidStatusColors.unsuccessful,
  ACCEPTED: bidStatusColors.accepted,
} as const;

// Bid Status Countdown Timer Duration (in seconds)
export const BID_STATUS_COUNTDOWN_DURATION_SECONDS = 10;

// Local static map for action icons (required for bundling local images)
export const ACTION_ICON_SOURCE_MAP: Record<string, ImageSourcePropType> = {
  "accept.png": require("../assets/images/actions/accept.png"),
  "reject.png": require("../assets/images/actions/reject.png"),
  "hide.png": require("../assets/images/actions/hide.png"),
  "skip.png": require("../assets/images/actions/skip.png"),
  "make-stop.png": require("../assets/images/actions/make-stop.png"),
  "add-toll.png": require("../assets/images/actions/add-toll.png"),
  "circling.png": require("../assets/images/actions/circling.png"),
  "cancel-ride.png": require("../assets/images/actions/cancel-ride.png"),
  "update-eta.png": require("../assets/images/actions/update-eta.png"),
  "sos.png": require("../assets/images/actions/sos.png"),
  "contact-customer.png": require("../assets/images/actions/contact-customer.png"),
  "details.png": require("../assets/images/actions/details.png"),
};

// Free Wait Timer duration (in seconds). Default: 5 minutes
export const FREE_WAIT_DURATION_SECONDS = 5 * 60;

// Swipe Button States and Titles
export const SWIPE_BUTTON_STATES = {
  MARK_ARRIVED: "mark_arrived",
  START_RIDE: "start_ride",
  END_RIDE: "end_ride",
  RESTART_RIDE: "restart_ride",
} as const;

export type SwipeButtonState =
  (typeof SWIPE_BUTTON_STATES)[keyof typeof SWIPE_BUTTON_STATES];

// Notification Types
export const NOTIFICATION_TYPES = {
  AUTHORIZATION: "authorization",
  INFO: "info",
  WARNING: "warning",
  SUCCESS: "success",
  ERROR: "error",
  SPECIAL_RIDE_OFFER: "special-ride-offer",
  MESSAGE: "message",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

// API Client Types
export const API_CLIENT_TYPES = {
  AUTH: "auth",
  ME: "me",
  AUCTION: "auction",
  SETTINGS: "settings",
  ACTIVE_TRIP: "active-trip",
  DEFAULT: "default",
} as const;

export type ApiClientType =
  (typeof API_CLIENT_TYPES)[keyof typeof API_CLIENT_TYPES];

export const SOCKET_EVENTS = {
  NEW_OFFER: "trip-offer",
  ACCEPTED_RESPONSE: "accept-response",
  BID_RESPONSE: "bid-response",
  EXPIRED_OFFER: "expired-offer",
} as const;

export const ACTIVE_TRIP_SOCKET_EVENTS = {
  TRIP_STOP_ADDED: "trip-stop-added",
  NEW_MESSAGE: "new-message",
  SEND_MESSAGE: "send-message",
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
export type ActiveTripSocketEvent =
  (typeof ACTIVE_TRIP_SOCKET_EVENTS)[keyof typeof ACTIVE_TRIP_SOCKET_EVENTS];

// Socket server URLs - dynamically resolved based on IS_TESTING flag
// Note: Using getter functions to avoid circular dependency with urlResolver
// The actual URL resolution happens in utils/socket.ts and utils/activeTripSocket.ts
// This constant is kept for backward compatibility but URLs are resolved at connection time
export const SOCKET = {
  get OFFERS_SERVER_URL(): string {
    return IS_TESTING
      ? SERVICES_TESTING_URLS["offers-socket"]
      : process.env.EXPO_PUBLIC_BASE_URL ||
          "https://djh0g1zn5pc6f.cloudfront.net";
  },
  get ACTIVE_TRIP_SERVER_URL(): string {
    return IS_TESTING
      ? SERVICES_TESTING_URLS["active-trip-socket"]
      : process.env.EXPO_PUBLIC_BASE_URL ||
          "https://djh0g1zn5pc6f.cloudfront.net";
  },
};

export const TRIP_OFFER_ACTIONS = {
  ACCEPT: "accept",
  SKIP: "skip",
  HIDE: "hide",
  BID: "bid",
  REJECT: "reject",
  EXPIRE: "expire",
} as const;

// Driver actions for active trips
export const DRIVER_ACTIONS = {
  START: "start",
  STOP: "stop",
  ARRIVED: "arrived",
  PICKED_UP: "picked_up",
  CIRCLING: "circling",
  COMPLETED: "completed",
} as const;

// Ride states for UI management
export const RIDE_STATES = {
  EN_ROUTE: "en_route",
  ON_SCENE: "on_scene",
  LOADED: "loaded",
  STOPPED: "stopped",
  COMPLETED: "completed",
} as const;

// Header titles based on ride state
export const RIDE_HEADER_TITLES = {
  [RIDE_STATES.EN_ROUTE]: "En Route",
  [RIDE_STATES.ON_SCENE]: "On Scene",
  [RIDE_STATES.LOADED]: "Loaded",
  [RIDE_STATES.STOPPED]: "Stop",
  [RIDE_STATES.COMPLETED]: "Completed",
} as const;

export const TRIP_OFFER_TYPES = {
  SEQUENTIAL: "sequential",
  BROADCAST: "broadcast",
} as const;

// Network Monitoring Constants
export const NETWORK_MONITORING = {
  // Connection type thresholds (in Mbps) - estimated based on connection type
  // Note: 1 Mbps = 125 KB/s, so 0.08 Mbps = 10 KB/s
  CONNECTION_THRESHOLDS: {
    wifi: { slow: 0.08, critical: 0.04 }, // WiFi: 10 KB/s slow, 5 KB/s critical
    cellular: { slow: 0.08, critical: 0.04 }, // Cellular: 10 KB/s slow, 5 KB/s critical
    bluetooth: { slow: 0.08, critical: 0.04 }, // Bluetooth: 10 KB/s slow, 5 KB/s critical
    ethernet: { slow: 0.08, critical: 0.04 }, // Ethernet: 10 KB/s slow, 5 KB/s critical
    unknown: { slow: 0.08, critical: 0.04 }, // Default: 10 KB/s slow, 5 KB/s critical
  },

  // Monitoring intervals (in milliseconds)
  BANDWIDTH_CHECK_INTERVAL: 10000, // Check every 10 seconds
  CONNECTION_CHECK_INTERVAL: 5000, // Check connection every 5 seconds

  // UI behavior
  // Note: Notifications now stay visible until connection improves (no auto-hide)

  // Network quality levels
  NETWORK_QUALITY: {
    EXCELLENT: "excellent",
    GOOD: "good",
    SLOW: "slow",
    CRITICAL: "critical",
    OFFLINE: "offline",
  } as const,
} as const;

export type NetworkQuality =
  (typeof NETWORK_MONITORING.NETWORK_QUALITY)[keyof typeof NETWORK_MONITORING.NETWORK_QUALITY];

const BASE_URL = "http://3.84.108.176";
// Testing purpose constant for all the services
// When IS_TESTING is true, these URLs will be used instead of environment variables
// All URLs should include the http:// protocol prefix for local testing
export const SERVICES_TESTING_URLS = {
  auth: `${BASE_URL}:3001`,
  auction: `${BASE_URL}:3002`,
  "online-drivers": `${BASE_URL}:3003`,
  settings: `${BASE_URL}:3004`,
  "active-trip": `${BASE_URL}:3005`,
  notifications: `${BASE_URL}:3006`, // Notifications service on port 3006
  me: `${BASE_URL}:3001`, // Shares with auth service
  "offers-socket": `${BASE_URL}:3002`, // Shares with auction service
  "active-trip-socket": `${BASE_URL}:3005`, // Shares with active-trip service
} as const;

// DB Request Format Constants
// Default access token and key (fallback values, should be updated after login if backend provides)
export const DEFAULT_ACCESS_TOKEN =
  "fad9017e31bd0927a6bc42996df9e22708b736112f3ef801fd30d7213c146a03";
export const DEFAULT_ACCESS_KEY =
  "0f5aac120ac2746e8548dcdb565b06d9772248b51ab669f45c08dc51a4291f16";

// API Version (matches backend APIVersion)
export const API_VERSION = "1.0.1";

// Client Version (from app.json version)
export const CLIENT_VERSION = "1.0.0";

// DB Action Codes
// Common action codes used across the app for database operations
export const DB_ACTION_CODES = {
  // Driver actions
  DRV_S_LOGIN_DRIVER: "DRV.S.LOGIN_DRIVER",
  // Add more action codes as needed
} as const;

export type DbActionCode =
  (typeof DB_ACTION_CODES)[keyof typeof DB_ACTION_CODES];
