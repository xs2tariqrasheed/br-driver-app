/**
 * Type definitions for offer expiration events
 */

export interface ExpiredOfferEvent {
  tripId: string;
  offerType?: "sequential" | "broadcast";
  timestamp?: string;
}

export interface ExpirationContexts {
  markSequentialOfferAsExpired?: (tripId: string) => void;
  markBroadcastOfferAsExpired?: (tripId: string) => void;
  hideRideOfferModal?: () => void;
  setHasAnyActiveOffer?: (value: boolean) => Promise<void>;
}

export type OfferType = "sequential" | "broadcast";
