import { showToast } from "@/components/Toast";
import { TRIP_OFFER_TYPES } from "@/constants/global";
import { logger } from "@/utils/helpers";

/**
 * Centralized service for managing offer expiration
 * Handles both Sequential and Broadcast offer expiration
 */
export class ExpirationService {
  private static instance: ExpirationService;
  private log = logger();

  private constructor() {}

  public static getInstance(): ExpirationService {
    if (!ExpirationService.instance) {
      ExpirationService.instance = new ExpirationService();
    }
    return ExpirationService.instance;
  }

  /**
   * Handle offer expiration from server
   * @param data - Server payload containing tripId and offerType
   * @param contexts - Object containing context methods for updating offers
   */
  public async handleOfferExpiration(
    data: {
      tripId: string;
      offerType?: "sequential" | "broadcast";
      timestamp?: string;
    },
    contexts: {
      markSequentialOfferAsExpired?: (tripId: string) => void;
      markBroadcastOfferAsExpired?: (tripId: string) => void;
      hideRideOfferModal?: () => void;
      setHasAnyActiveOffer?: (value: boolean) => Promise<void>;
    }
  ): Promise<void> {
    try {
      const { tripId, offerType, timestamp } = data;

      this.log(
        `⏰ Handling offer expiration for tripId: ${tripId}, type: ${offerType}`
      );

      // Show consistent toast message for all expired offers
      showToast("Ride offer expired!", {
        variant: "warning",
        position: "top",
      });

      // Determine offer type and handle accordingly
      if (offerType === TRIP_OFFER_TYPES.SEQUENTIAL || !offerType) {
        // Handle Sequential offer expiration
        this.log(`📱 Handling Sequential offer expiration: ${tripId}`);

        if (contexts.markSequentialOfferAsExpired) {
          contexts.markSequentialOfferAsExpired(tripId);
        }

        if (contexts.hideRideOfferModal) {
          contexts.hideRideOfferModal();
        }

        if (contexts.setHasAnyActiveOffer) {
          await contexts.setHasAnyActiveOffer(false);
        }
      } else if (offerType === TRIP_OFFER_TYPES.BROADCAST) {
        // Handle Broadcast offer expiration
        this.log(`📡 Handling Broadcast offer expiration: ${tripId}`);

        if (contexts.markBroadcastOfferAsExpired) {
          contexts.markBroadcastOfferAsExpired(tripId);
        }
      } else {
        // Fallback: try to handle both types
        this.log(
          `🔄 Fallback: Handling offer expiration for both types: ${tripId}`
        );

        if (contexts.markSequentialOfferAsExpired) {
          contexts.markSequentialOfferAsExpired(tripId);
        }

        if (contexts.markBroadcastOfferAsExpired) {
          contexts.markBroadcastOfferAsExpired(tripId);
        }

        if (contexts.hideRideOfferModal) {
          contexts.hideRideOfferModal();
        }

        if (contexts.setHasAnyActiveOffer) {
          await contexts.setHasAnyActiveOffer(false);
        }
      }

      this.log(
        `✅ Successfully handled offer expiration for tripId: ${tripId}`
      );
    } catch (error) {
      this.log(`❌ Error handling offer expiration:`, error);
      showToast("Failed to process expired offer", {
        variant: "error",
        position: "top",
      });
    }
  }

  /**
   * Mark a specific offer as expired by tripId
   * This is a utility method for manual expiration handling
   */
  public markOfferAsExpired(
    tripId: string,
    offerType: "sequential" | "broadcast",
    contexts: {
      markSequentialOfferAsExpired?: (tripId: string) => void;
      markBroadcastOfferAsExpired?: (tripId: string) => void;
    }
  ): void {
    this.log(
      `🔧 Manually marking offer as expired: ${tripId}, type: ${offerType}`
    );

    if (
      offerType === TRIP_OFFER_TYPES.SEQUENTIAL &&
      contexts.markSequentialOfferAsExpired
    ) {
      contexts.markSequentialOfferAsExpired(tripId);
    } else if (
      offerType === TRIP_OFFER_TYPES.BROADCAST &&
      contexts.markBroadcastOfferAsExpired
    ) {
      contexts.markBroadcastOfferAsExpired(tripId);
    }
  }
}

// Export singleton instance
export const expirationService = ExpirationService.getInstance();
