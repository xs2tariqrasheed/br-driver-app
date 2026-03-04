/**
 * Request Builder Utility for DB Request Format
 *
 * Builds requests in the format required by the backend:
 * { jHeader, jMetaData, jData }
 *
 * Similar to BR-Backend/apps/fe-admin/src/utils/dbRequest.ts
 * Adapted for React Native/Expo environment
 */

import {
  API_VERSION,
  CLIENT_VERSION,
  CONTENT_ACTION_CODE,
  CONTENT_AFFILIATE_NUM,
  CONTENT_APP_NAME,
  CONTENT_VIEW_NAME,
  DEFAULT_ACCESS_KEY,
  DEFAULT_ACCESS_TOKEN,
  SYSTEM_SETTINGS_ACTION_CODE,
} from "@/constants/global";
import type { DbRequestJson, GpsData, JHeader } from "@/types/dbRequest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Location from "expo-location";
import { logger } from "./helpers";

const log = logger();

// Storage keys for access token and key
const ACCESS_TOKEN_KEY = "@accessToken";
const ACCESS_KEY_KEY = "@accessKey";
const DEVICE_ID_KEY = "@device_id";

/**
 * Gets or initializes device ID
 * Stores in AsyncStorage for persistence
 */
export async function getDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    // Generate a unique device ID
    // Use Device.osInternalBuildId if available, otherwise generate UUID-like string
    let deviceId: string;

    if (Device.osInternalBuildId) {
      deviceId = Device.osInternalBuildId;
    } else if (Device.modelId) {
      deviceId = `${Device.modelId}_${Date.now()}`;
    } else {
      // Fallback: generate a simple unique ID
      deviceId = `dev_${Math.random().toString(16).slice(2)}_${Date.now()}`;
    }

    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch (error) {
    log("Error getting device ID:", error);
    // Fallback to timestamp-based ID
    return `dev_${Date.now()}`;
  }
}

/**
 * Gets device information string
 * Returns device model and manufacturer info
 */
export function getDeviceInfo(): string {
  try {
    const parts: string[] = [];

    if (Device.manufacturer) {
      parts.push(Device.manufacturer);
    }

    if (Device.modelName) {
      parts.push(Device.modelName);
    } else if (Device.modelId) {
      parts.push(Device.modelId);
    }

    if (Device.osName) {
      parts.push(Device.osName);
    }

    if (Device.osVersion) {
      parts.push(Device.osVersion);
    }

    return parts.length > 0 ? parts.join(" ") : "Unknown Device";
  } catch (error) {
    log("Error getting device info:", error);
    return "Unknown Device";
  }
}

/**
 * Gets device type
 * Returns "Mobile" for React Native apps
 */
export function getDeviceType(): string {
  return "Mobile";
}

/**
 * Gets client IP (placeholder)
 * Backend overrides this with server-detected IP
 */
export function getClientIP(): string {
  return "127.0.0.1"; // Placeholder - backend will replace with server IP
}

/**
 * Gets GPS data from device location
 * Handles permissions and timeouts gracefully
 * Returns null if unavailable (doesn't block request)
 */
export async function getGPSData(
  timeoutMs: number = 4000,
): Promise<GpsData | null> {
  try {
    // Check if location services are available
    const isAvailable = await Location.hasServicesEnabledAsync();
    if (!isAvailable) {
      log("Location services not available");
      return null;
    }

    // Request permissions (non-blocking - won't throw if denied)
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      log("Location permission not granted");
      return null;
    }

    // Get current position with timeout
    const location = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), timeoutMs),
      ),
    ]);

    if (!location) {
      log("GPS timeout or unavailable");
      return null;
    }

    const coords = location.coords;
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      speed: coords.speed ?? null,
      bearing: coords.heading ?? null,
    };
  } catch (error) {
    log("Error getting GPS data:", error);
    return null;
  }
}

/**
 * Gets or initializes access token from AsyncStorage
 * Uses default if not available
 */
async function getOrInitToken(key: string, fallback: string): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(key);
    if (existing) return existing;

    await AsyncStorage.setItem(key, fallback);
    return fallback;
  } catch (error) {
    log(`Error getting/init token for key ${key}:`, error);
    return fallback;
  }
}

/**
 * Gets access token
 */
export async function getAccessToken(): Promise<string> {
  return getOrInitToken(ACCESS_TOKEN_KEY, DEFAULT_ACCESS_TOKEN);
}

/**
 * Gets access key
 */
export async function getAccessKey(): Promise<string> {
  return getOrInitToken(ACCESS_KEY_KEY, DEFAULT_ACCESS_KEY);
}

/**
 * Gets client version from app.json or package.json
 */
export function getClientVersion(): string {
  return CLIENT_VERSION;
}

/**
 * Gets API version
 */
export function getAPIVersion(): string {
  return API_VERSION;
}

/**
 * Gets requested URL (for logging/tracking)
 * Returns a placeholder for mobile apps
 */
export function getRequestedURL(): string {
  // For mobile apps, we don't have a window.location
  // Return a placeholder that indicates it's from the mobile app
  return "br-driver-app://mobile";
}

/**
 * Builds the base jHeader for DB requests
 *
 * @param viewName - The view/action name (usually matches actionCode)
 * @param source - Source identifier (default: "NativeApp")
 * @param options - Optional configuration
 * @returns Promise resolving to complete jHeader
 */
export async function buildRequestHeader(
  viewName: string,
  source: string = "driverapp",
  options?: {
    actionCode?: string;
    includeGPS?: boolean;
  },
): Promise<JHeader> {
  const includeGPS = options?.includeGPS !== false; // Default to true
  const clientIP = getClientIP();

  // Get device info
  const deviceId = await getDeviceId();
  const deviceInfo = getDeviceInfo();
  const deviceType = getDeviceType();

  // Get tokens
  const accessToken = await getAccessToken();
  const accessKey = await getAccessKey();

  // Get versions
  const clientVersion = getClientVersion();
  const apiVersion = getAPIVersion();
  const requestedURL = getRequestedURL();

  // Build base header
  const jHeader: JHeader = {
    client: "BlinkRide",
    clientIP,
    accessToken,
    accessKey,
    source,
    target: "DBAPI",
    deviceType,
    deviceInfo,
    deviceID: deviceId,
    viewName,
    clientVersion,
    APIVersion: apiVersion,
    requestedURL,
    debug: "false",
  };

  // Add GPS data if requested and available
  if (includeGPS) {
    const gps = await getGPSData();
    if (gps) {
      jHeader.GPSLatitude = String(gps.latitude);
      jHeader.GPSLongitude = String(gps.longitude);
      if (gps.speed != null) {
        jHeader.GPSSpeed = String(gps.speed);
      }
      if (gps.bearing != null) {
        jHeader.GPSBearing = String(gps.bearing);
      }
    }
  }

  return jHeader;
}

/**
 * Builds a complete DB request with jHeader, jMetaData, and jData
 *
 * @param actionCode - The DB action code (e.g., "DRV.S.LOGIN_DRIVER")
 * @param jData - The jData parameters
 * @param options - Optional configuration
 * @returns Promise resolving to complete DbRequestJson
 */
export async function buildRequest(
  actionCode: string,
  jData: Record<string, any>,
  options?: {
    source?: string;
    jMetaData?: Record<string, any>;
    includeGPS?: boolean;
    includeActionCode?: boolean; // Whether to include P_ACTION_CODE in jData (default: true)
  },
): Promise<DbRequestJson> {
  const jHeader = await buildRequestHeader(
    actionCode, // viewName matches actionCode
    options?.source || "NativeApp",
    {
      actionCode,
      includeGPS: options?.includeGPS,
    },
  );

  // Build final jData
  // Note: All mobile app services use callDbAction() which removes P_ACTION_CODE
  // and uses their own hardcoded value. The /settings-service/db-action endpoint
  // is only used by backend services and fe-admin, not the mobile app.
  // Therefore, we default to NOT including P_ACTION_CODE for mobile app requests.
  const finalJData = { ...jData };
  if (options?.includeActionCode === true) {
    // Only add if explicitly requested (for future direct DB endpoints if needed)
    if (!finalJData.P_ACTION_CODE) {
      finalJData.P_ACTION_CODE = actionCode;
    }
  } else {
    // Default: remove P_ACTION_CODE since backend services handle it
    delete finalJData.P_ACTION_CODE;
  }

  return {
    jHeader,
    jMetaData: options?.jMetaData || {},
    jData: finalJData,
  };
}

/**
 * Builds a login request in DB format
 *
 * @param input - Login credentials and options
 * @returns Promise resolving to complete DbRequestJson for login
 */
export async function buildLoginRequest(input: {
  loginId: string;
  password: string;
  appName?: string;
  affiliateNum?: number;
  companyId?: number;
}): Promise<DbRequestJson> {
  const actionCode = "DRV.S.LOGIN_DRIVER";

  // Note: The backend auth service (/auth/signin) removes P_ACTION_CODE from jData
  // and uses its own hardcoded action code. Since includeActionCode defaults to false,
  // we don't need to specify it explicitly.
  const jData: Record<string, any> = {
    P_APP_NAME: input.appName || "driver-ios",
    P_AFFILIATE_NUM: input.affiliateNum ?? 101,
    P_COMPANY_ID: input.companyId ?? 1,
    P_LOGIN_ID: input.loginId,
    P_PASSWORD: input.password,
  };

  return buildRequest(actionCode, jData, {
    source: "NativeApp",
    includeGPS: true, // Include GPS for login
    // includeActionCode defaults to false - backend handles it
  });
}

/**
 * Builds a forgot user ID request in DB format.
 *
 * IMPORTANT: Backend expects P_EMAIL_OR_PHONE for this endpoint (not P_LOGIN_ID).
 */
export async function buildForgotUserIdRequest(input: {
  emailOrPhone: string;
  phone: string;
  companyId?: number;
  appName?: string;
  affiliateNum?: number;
}): Promise<DbRequestJson> {
  const actionCode = "CMN.S.GET_USERNAME";

  const jData: Record<string, any> = {
    P_APP_NAME: input.appName || "driver-ios",
    P_AFFILIATE_NUM: input.affiliateNum ?? 101,
    P_COMPANY_ID: input.companyId ?? 1,
    P_EMAIL_OR_PHONE: input.emailOrPhone,
    P_PHONE: input.phone,
  };

  return buildRequest(actionCode, jData, {
    source: "NativeApp",
    includeGPS: true,
  });
}

/**
 * Builds a content fetch request for Settings Service (/content/app).
 */
export async function buildAppContentRequest(): Promise<DbRequestJson> {
  const jHeader = await buildRequestHeader(CONTENT_VIEW_NAME, "driverapp", {
    includeGPS: false,
  });

  const jData = {
    P_ACTION_CODE: CONTENT_ACTION_CODE,
    P_AFFILIATE_NUM: CONTENT_AFFILIATE_NUM,
    P_APP_NAME: CONTENT_APP_NAME,
  };

  return {
    jHeader,
    jMetaData: {},
    jData,
  };
}

/**
 * Builds a content fetch request for Settings Service (/content/app).
 */
export async function buildSystemSettingsRequest(): Promise<DbRequestJson> {
  const jHeader = await buildRequestHeader(CONTENT_VIEW_NAME, "driverapp", {
    includeGPS: false,
  });

  const jData = {
    P_ACTION_CODE: SYSTEM_SETTINGS_ACTION_CODE,
    P_AFFILIATE_NUM: CONTENT_AFFILIATE_NUM,
  };

  return {
    jHeader,
    jMetaData: {},
    jData,
  };
}
