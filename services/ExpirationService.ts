import { showToast } from "@/components/Toast";
import { TRIP_OFFER_TYPES } from "@/constants/global";
import { ExpirationContexts } from "@/types/OfferExpiration";
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
   * @param data - Server payload containing tripId
   * @param contexts - Object containing context methods and data for updating offers
   */
  public async handleOfferExpiration(
    data: {
      tripId: string;
      timestamp?: string;
    },
    contexts: ExpirationContexts
  ): Promise<void> {
    try {
      const { tripId, timestamp } = data;

      // Skip expiration for demo offers
      if (tripId.startsWith("demo-")) {
        this.log(`⏰ Skipping expiration for demo offer: ${tripId}`);
        return;
      }

      this.log(`⏰ Handling offer expiration for tripId: ${tripId}`);

      // Find the offer by tripId to determine its type
      const offerInfo = this.findOfferByTripId(tripId, contexts);

      if (!offerInfo) {
        this.log(
          `❌ Offer not found for tripId: ${tripId} - skipping expiration`
        );
        return;
      }

      this.log(
        `🔍 Found offer: ${offerInfo.type} (${offerInfo.context}) for tripId: ${tripId}`
      );

      // Check if offer status has changed (driver performed action)
      // Only expire if offer is still in "offered" state
      const offerStatus = offerInfo.offer?.status;
      if (offerStatus && offerStatus !== "offered") {
        this.log(
          `⏸️ Skipping expiration for tripId: ${tripId} - offer status is "${offerStatus}" (driver has performed action)`
        );
        return;
      }

      // Show consistent toast message for all expired offers
      showToast("Ride offer expired!", {
        variant: "warning",
        position: "top",
      });

      // Handle expiration based on discovered offer type
      if (offerInfo.type === TRIP_OFFER_TYPES.SEQUENTIAL) {
        this.log(`📱 Handling Sequential offer expiration: ${tripId}`);
        if (contexts.markSequentialOfferAsExpired) {
          contexts.markSequentialOfferAsExpired(tripId);
        }
      } else if (offerInfo.type === TRIP_OFFER_TYPES.BROADCAST) {
        this.log(`📡 Handling Broadcast offer expiration: ${tripId}`);
        if (contexts.markBroadcastOfferAsExpired) {
          contexts.markBroadcastOfferAsExpired(tripId);
        }
      }

      // Close all modals when any offer expires
      if (contexts.closeAllModals) {
        this.log("🔽 Closing all modals due to offer expiration");
        contexts.closeAllModals();
      }

      // Close ride offer modal and update state
      if (contexts.hideRideOfferModal) {
        contexts.hideRideOfferModal();
      }

      if (contexts.setHasAnyActiveOffer) {
        await contexts.setHasAnyActiveOffer(false);
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
   * Find offer by tripId across all contexts
   * @param tripId - The trip ID to search for
   * @param contexts - Context data containing offers
   * @returns Offer information or null if not found
   */
  private findOfferByTripId(
    tripId: string,
    contexts: ExpirationContexts
  ): { type: string; context: string; offer: any } | null {
    this.log(`🔍 Searching for offer with tripId: ${tripId}`);

    // 1. Check Sequential offers (RideOfferContext)
    if (
      contexts.currentOffer &&
      contexts.currentOffer.tripOffer?.tripId === tripId
    ) {
      this.log(`📱 Found sequential offer for tripId: ${tripId}`);
      return {
        type: TRIP_OFFER_TYPES.SEQUENTIAL,
        context: "rideOffer",
        offer: contexts.currentOffer,
      };
    }

    // 2. Check Broadcast offers (BroadcastJobOffersContext)
    if (contexts.broadcastOffers) {
      const broadcastOffer = contexts.broadcastOffers.find(
        (offer) => offer.tripOffer?.tripId === tripId
      );

      if (broadcastOffer) {
        this.log(`📡 Found broadcast offer for tripId: ${tripId}`);
        return {
          type: TRIP_OFFER_TYPES.BROADCAST,
          context: "broadcastJobOffers",
          offer: broadcastOffer,
        };
      }
    }

    this.log(`❌ No offer found for tripId: ${tripId}`);
    return null;
  }

  /**
   * Mark a specific offer as expired by tripId
   * This is a utility method for manual expiration handling
   */
  public markOfferAsExpired(
    tripId: string,
    offerType: "sequential" | "broadcast",
    contexts: ExpirationContexts
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
