/**
 * Socket.IO Client Utilities for React Native Expo
 *
 * Caller: Components needing real-time communication with socket server
 * Purpose: Provide centralized socket management with mobile optimizations
 * Input/Output:
 *   - Input: joinToken, event names, event handlers, auth tokens
 *   - Output: Socket connection, event listeners, connection status
 * Description: Manages Socket.IO connections with React Native optimizations including
 *             automatic reconnection, mobile-specific timeouts, and AsyncStorage integration.
 *             Handles authentication tokens from AsyncStorage and provides comprehensive
 *             connection state management for mobile networks.
 * Expected Outcome: Reliable real-time communication with automatic handling of
 *                   mobile network conditions and connection recovery.
 */

import { SOCKET } from "@/constants/global";
import io from "socket.io-client";

let socket: ReturnType<typeof io> | null = null;

type SocketHandler = (...args: any[]) => void;

const eventHandlers = new Map<string, Set<SocketHandler>>();
const disconnectHandlers = new Set<SocketHandler>();

const attachStoredHandlers = () => {
  if (!socket) {
    return;
  }

  eventHandlers.forEach((handlers, eventName) => {
    handlers.forEach((handler) => {
      socket?.on(eventName, handler);
    });
  });

  disconnectHandlers.forEach((handler) => {
    socket?.on("disconnect", handler as (reason: string) => void);
  });
};

/**
 * Connects to the Socket.IO server with mobile-optimized configuration
 *
 * @description Establishes a new Socket.IO connection with mobile-specific optimizations
 * including automatic reconnection, timeout handling, and transport fallbacks.
 * Disconnects any existing socket before creating a new connection.
 *
 * @returns {Promise<ReturnType<typeof io>>} Promise that resolves to the socket instance
 *
 * @example
 * ```typescript
 * const socket = await connectSocket();
 * socket.on('connect', () => console.log('Connected!'));
 * ```
 */
export const connectSocket = async (): Promise<ReturnType<typeof io>> => {
  const serverUrl = SOCKET.OFFERS_SERVER_URL;
  console.log("🔌 Connecting to offers socket server:", serverUrl);

  // Disconnect existing socket if any
  if (socket) {
    socket.off();
    socket.disconnect();
    socket = null;
  }

  // Mobile-optimized socket configuration using environment variables
  socket = io(serverUrl, {
    transports: ["websocket", "polling"], // Prefer websocket, fallback to polling
    autoConnect: true,
    path: "/auction/socket.io", // Updated path for auction service
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

  return socket;
};

/**
 * Registers a listener for socket disconnect events
 *
 * @description Attaches a handler to the socket's 'disconnect' event. Returns a cleanup
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
 * const cleanup = onDisconnect((reason) => {
 *   console.log('Socket disconnected:', reason);
 * });
 *
 * // Later, remove the listener
 * cleanup();
 * ```
 */
export const onDisconnect = (
  handler: (reason: string) => void
): (() => void) => {
  disconnectHandlers.add(handler);

  if (socket) {
    socket.on("disconnect", handler);
  }

  return () => {
    disconnectHandlers.delete(handler);
    if (!socket) return;
    socket.off("disconnect", handler);
  };
};

/**
 * Emits an event to the socket server
 *
 * @description Sends an event with optional data to the connected socket server.
 * If no socket is connected, the function returns early without emitting.
 *
 * @param {string} eventName - The name of the event to emit
 * @param {any} [data] - Optional data payload to send with the event
 *
 * @example
 * ```typescript
 * // Emit a simple event
 * emitEvent('user_online');
 *
 * // Emit an event with data
 * emitEvent('location_update', { lat: 40.7128, lng: -74.0060 });
 * ```
 */
export const emitEvent = (eventName: string, data?: any): void => {
  if (!socket) return;
  let payload = data || {};
  socket.emit(eventName, payload);
};

/**
 * Registers a listener for a specific socket event
 *
 * @description Attaches a handler to listen for a specific event from the socket server.
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
 * const cleanup = onEvent('new_ride_offer', (data) => {
 *   console.log('New ride offer received:', data);
 * });
 *
 * // Later, remove the listener
 * cleanup();
 * ```
 */
export const onEvent = (
  eventName: string,
  handler: (data: any) => void
): (() => void) => {
  const handlers = eventHandlers.get(eventName) ?? new Set();
  handlers.add(handler);
  eventHandlers.set(eventName, handlers);

  if (socket) {
    socket.on(eventName, handler);
  }

  return () => {
    if (!eventHandlers.has(eventName)) return;
    const existingHandlers = eventHandlers.get(eventName);
    existingHandlers?.delete(handler);
    if (existingHandlers && existingHandlers.size === 0) {
      eventHandlers.delete(eventName);
    }

    if (!socket) return;
    socket.off(eventName, handler);
  };
};

/**
 * Disconnects the socket from the server
 *
 * @description Disconnects the current socket connection if one exists.
 * This is useful when the driver goes offline or when the app needs to
 * clean up the connection.
 *
 * @example
 * ```typescript
 * disconnectSocket();
 * ```
 */
export const disconnectSocket = (): void => {
  if (socket) {
    console.log("🔌 Disconnecting socket");
    socket.off();
    socket.disconnect();
    socket = null;
  }

  eventHandlers.clear();
  disconnectHandlers.clear();
};
