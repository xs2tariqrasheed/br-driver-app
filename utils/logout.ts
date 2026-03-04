import { apiClient } from "@/config/apiConfig";
import { DRIVER_ENDPOINTS } from "@/constants/endpoints";
import { disconnectSocket } from "@/utils/socket";
import { logger } from "@/utils/helpers";

const log = logger();

export interface PerformLogoutOptions {
  driverId?: string | number;
  driver: {
    online?: boolean;
    [key: string]: unknown;
  } | null;
  setDriver: (value: any) => Promise<void>;
  removeRetrievalId: () => Promise<void>;
  removeTripId: () => Promise<void>;
  setHasAnyActiveOffer: (hasActive: boolean) => Promise<void>;
  temporaryRides: { [notificationId: string]: unknown };
  removeTemporaryRide: (notificationId: string) => void;
}

/**
 * Shared logout cleanup used by both manual logout (More screen) and auto-logout.
 *
 * Marks the driver offline, resets driver/ride state, disconnects sockets, and
 * clears temporary ride offers. The caller is responsible for navigating to the
 * login screen after this resolves.
 */
export async function performLogout(
  options: PerformLogoutOptions,
): Promise<void> {
  const {
    driverId,
    driver,
    setDriver,
    removeRetrievalId,
    removeTripId,
    setHasAnyActiveOffer,
    temporaryRides,
    removeTemporaryRide,
  } = options;

  if (driver?.online && driverId) {
    try {
      log("[performLogout] Marking driver as offline via API");
      await apiClient.delete(DRIVER_ENDPOINTS.markOffline(driverId));
      log("[performLogout] Driver successfully marked as offline");
    } catch (error) {
      log("[performLogout] Error marking driver offline:", error);
    }
  }

  try {
    if (driver) {
      await setDriver({ ...driver, online: false });
      log("[performLogout] Driver state updated to offline");
    }
  } catch (error) {
    log("[performLogout] Error updating driver state:", error);
  }

  try {
    await removeRetrievalId();
    log("[performLogout] Retrieval ID removed successfully");
  } catch (error) {
    log("[performLogout] Error removing retrieval ID:", error);
  }

  try {
    await removeTripId();
    log("[performLogout] Trip ID removed successfully");
  } catch (error) {
    log("[performLogout] Error removing trip ID:", error);
  }

  try {
    disconnectSocket();
    log("[performLogout] Socket disconnected successfully");
  } catch (error) {
    log("[performLogout] Error disconnecting socket:", error);
  }

  try {
    await setHasAnyActiveOffer(false);
    log("[performLogout] Active offer state reset");
  } catch (error) {
    log("[performLogout] Error resetting active offer state:", error);
  }

  try {
    const temporaryRideIds = Object.keys(temporaryRides || {});
    temporaryRideIds.forEach((notificationId) => {
      removeTemporaryRide(notificationId);
    });
    log("[performLogout] Temporary rides cleared:", temporaryRideIds.length);
  } catch (error) {
    log("[performLogout] Error clearing temporary rides:", error);
  }
}
