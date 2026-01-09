/**
 * Type definitions for DB Request/Response format
 * 
 * These types match the backend's BaseRequestJson structure
 * as defined in BR-Backend/libs/global-validators/src/lib/global-validators.ts
 */

/**
 * JHeader structure for DB requests
 * Contains client, device, and request metadata
 */
export interface JHeader {
  client: string;
  clientIP: string;
  accessToken: string;
  accessKey: string;
  source: string;
  target: string;
  deviceType: string;
  deviceInfo: string;
  deviceID: string;
  viewName: string;
  clientVersion: string;
  APIVersion: string;
  requestedURL: string;
  debug: string;
  GPSLatitude?: string;
  GPSLongitude?: string;
  GPSSpeed?: string;
  GPSBearing?: string;
}

/**
 * Complete DB Request JSON structure
 * Matches backend's BaseRequestJson format
 */
export interface DbRequestJson {
  jHeader: JHeader;
  jMetaData?: Record<string, any>;
  jData: Record<string, any>;
}

/**
 * DB Response Header structure
 * Contains response metadata from database operations
 */
export interface DbResponseHeader {
  message?: string;
  responseCode?: string | number;
  status?: string;
  [key: string]: any; // Allow passthrough for additional fields
}

/**
 * Complete DB Response structure
 * Matches backend's DbResponse format
 */
export interface DbResponse {
  jHeader: DbResponseHeader;
  jData?: Record<string, any>;
  jMetaData?: Record<string, any>;
}

/**
 * API Response wrapper
 * Backend may wrap DbResponse in a success/data structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T | DbResponse;
  error?: string;
  errors?: Array<{ path: string; message: string }>;
}

/**
 * GPS Data structure for location information
 */
export interface GpsData {
  latitude: number;
  longitude: number;
  speed?: number | null;
  bearing?: number | null;
}
