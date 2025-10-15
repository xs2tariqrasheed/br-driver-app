/**
 * Active Trip Socket.IO Client Utilities for React Native Expo
 *
 * Caller: Components needing real-time communication with active trip socket server
 * Purpose: Provide centralized active trip socket management with mobile optimizations
 * Input/Output:
 *   - Input: driverId, retrievalId, tripId, event names, event handlers
 *   - Output: Active trip socket connection, event listeners, connection status
 * Description: Manages Socket.IO connections to active trip server with mobile-specific optimizations
 *             including automatic reconnection, mobile-specific timeouts, and proper authentication.
 *             Handles trip-specific events and provides comprehensive connection state management.
 * Expected Outcome: Reliable real-time communication for active trips with automatic handling of
 *                   mobile network conditions and connection recovery.
 */

import { SOCKET } from "@/constants/global";
import io from "socket.io-client";

let activeTripSocket: ReturnType<typeof io> | null = null;

type SocketHandler = (...args: any[]) => void;

const eventHandlers = new Map<string, Set<SocketHandler>>();
const disconnectHandlers = new Set<SocketHandler>();

const attachStoredHandlers = () => {
  if (!activeTripSocket) {
    return;
  }

  eventHandlers.forEach((handlers, eventName) => {
    handlers.forEach((handler) => {
      activeTripSocket?.on(eventName, handler);
    });
  });

  disconnectHandlers.forEach((handler) => {
    activeTripSocket?.on("disconnect", handler as (reason: string) => void);
  });
};

/**
 * Connects to the Active Trip Socket.IO server with mobile-optimized configuration
 *
 * @description Establishes a new Socket.IO connection to the active trip server with mobile-specific
 * optimizations including automatic reconnection, timeout handling, and transport fallbacks.
 * Disconnects any existing active trip socket before creating a new connection.
 * Requires authentication with driverId, retrievalId, and tripId.
 *
 * @param {string} driverId - The driver's unique identifier
 * @param {string} retrievalId - The retrieval ID for the active trip
 * @param {string} tripId - The trip's unique identifier
 * @returns {Promise<ReturnType<typeof io>>} Promise that resolves to the socket instance
 *
 * @example
 * ```typescript
 * const socket = await connectActiveTripSocket("driver123", "retrieval456", "trip789");
 * socket.on('connect', () => console.log('Connected to active trip server!'));
 * ```
 */
export const connectActiveTripSocket = async (
  driverId: string,
  retrievalId: string,
  tripId: string
): Promise<ReturnType<typeof io>> => {
  const serverUrl = SOCKET.ACTIVE_TRIP_SERVER_URL;
  console.log("🔌 Connecting to active trip socket server:", serverUrl);
  console.log("🔌 Driver ID:", driverId);
  console.log("🔌 Retrieval ID:", retrievalId);
  console.log("🔌 Trip ID:", tripId);

  // Disconnect existing socket if any
  if (activeTripSocket) {
    activeTripSocket.off();
    activeTripSocket.disconnect();
    activeTripSocket = null;
  }

  // Mobile-optimized socket configuration for active trip server
  activeTripSocket = io(serverUrl, {
    transports: ["websocket", "polling"], // Prefer websocket, fallback to polling
    autoConnect: true,
    path: "/socket.io", // Use standard socket.io path
    // Mobile-specific optimizations
    timeout: 20000, // 20 seconds timeout for mobile networks
    forceNew: true, // Force new connection
    reconnection: true,
    reconnectionAttempts: 5, // More reconnection attempts for mobile
    reconnectionDelay: 1000, // Start with 1 second delay
    reconnectionDelayMax: 5000, // Max 5 seconds between reconnection attempts
    randomizationFactor: 0.5, // Add randomness to reconnection delay
  });

  attachStoredHandlers();

  // Emit driver-connect event with required authentication data
  activeTripSocket.emit("driver-connect", {
    driverId,
    retrievalId,
    tripId,
  });

  return activeTripSocket;
};

/**
 * Registers a listener for active trip socket disconnect events
 *
 * @description Attaches a handler to the active trip socket's 'disconnect' event. Returns a cleanup
 * function that removes the listener when called. If no socket is connected, returns
 * a no-op cleanup function.
 *
 * @param {function} handler - Function to call when socket disconnects
 * @param {string} handler.reason - The reason for disconnection
 *
 * @returns {function} Cleanup function to remove the listener
 *
 * @example
 * ```typescript
 * const cleanup = onActiveTripDisconnect((reason) => {
 *   console.log('Active trip socket disconnected:', reason);
 * });
 *
 * // Later, remove the listener
 * cleanup();
 * ```
 */
export const onActiveTripDisconnect = (
  handler: (reason: string) => void
): (() => void) => {
  disconnectHandlers.add(handler);

  if (activeTripSocket) {
    activeTripSocket.on("disconnect", handler);
  }

  return () => {
    disconnectHandlers.delete(handler);
    if (!activeTripSocket) return;
    activeTripSocket.off("disconnect", handler);
  };
};

/**
 * Emits an event to the active trip socket server
 *
 * @description Sends an event with optional data to the connected active trip socket server.
 * If no socket is connected, the function returns early without emitting.
 *
 * @param {string} eventName - The name of the event to emit
 * @param {any} [data] - Optional data payload to send with the event
 *
 * @example
 * ```typescript
 * // Emit a simple event
 * emitActiveTripEvent('send-message');
 *
 * // Emit an event with data
 * emitActiveTripEvent('send-message', { tripId: 'trip123', userId: 'driver456', message: 'Hello' });
 * ```
 */
export const emitActiveTripEvent = (eventName: string, data?: any): void => {
  if (!activeTripSocket) return;
  let payload = data || {};
  activeTripSocket.emit(eventName, payload);
};

/**
 * Registers a listener for a specific active trip socket event
 *
 * @description Attaches a handler to listen for a specific event from the active trip socket server.
 * Returns a cleanup function that removes the listener when called. If no socket is
 * connected, returns a no-op cleanup function.
 *
 * @param {string} eventName - The name of the event to listen for
 * @param {function} handler - Function to call when the event is received
 * @param {any} handler.data - The data payload received with the event
 *
 * @returns {function} Cleanup function to remove the listener
 *
 * @example
 * ```typescript
 * const cleanup = onActiveTripEvent('trip-stop-added', (data) => {
 *   console.log('New stop added to trip:', data);
 * });
 *
 * // Later, remove the listener
 * cleanup();
 * ```
 */
export const onActiveTripEvent = (
  eventName: string,
  handler: (data: any) => void
): (() => void) => {
  const handlers = eventHandlers.get(eventName) ?? new Set();
  handlers.add(handler);
  eventHandlers.set(eventName, handlers);

  if (activeTripSocket) {
    activeTripSocket.on(eventName, handler);
  }

  return () => {
    if (!eventHandlers.has(eventName)) return;
    const existingHandlers = eventHandlers.get(eventName);
    existingHandlers?.delete(handler);
    if (existingHandlers && existingHandlers.size === 0) {
      eventHandlers.delete(eventName);
    }

    if (!activeTripSocket) return;
    activeTripSocket.off(eventName, handler);
  };
};

/**
 * Disconnects the active trip socket from the server
 *
 * @description Disconnects the current active trip socket connection if one exists.
 * This is useful when the trip is completed, cancelled, or when the app needs to
 * clean up the connection.
 *
 * @example
 * ```typescript
 * disconnectActiveTripSocket();
 * ```
 */
export const disconnectActiveTripSocket = (): void => {
  if (activeTripSocket) {
    console.log("🔌 Disconnecting active trip socket");
    activeTripSocket.off();
    activeTripSocket.disconnect();
    activeTripSocket = null;
  }

  eventHandlers.clear();
  disconnectHandlers.clear();
};

/**
 * Gets the current active trip socket instance
 *
 * @description Returns the current active trip socket instance if connected, null otherwise.
 * Useful for checking connection status or accessing socket properties.
 *
 * @returns {ReturnType<typeof io> | null} The socket instance or null
 *
 * @example
 * ```typescript
 * const socket = getActiveTripSocket();
 * if (socket?.connected) {
 *   console.log('Active trip socket is connected');
 * }
 * ```
 */
export const getActiveTripSocket = (): ReturnType<typeof io> | null => {
  return activeTripSocket;
};
