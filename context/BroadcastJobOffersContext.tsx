import { TRIP_OFFER_TYPES } from "@/constants/global";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export interface BroadcastJobOffer {
  // Basic job offer info
  id: string;
  type: (typeof TRIP_OFFER_TYPES)[keyof typeof TRIP_OFFER_TYPES];
  status:
    | "offered"
    | "accepted"
    | "rejected"
    | "expired"
    | "skipped"
    | "hidden";
  bidable: boolean;

  // Trip offer details
  tripOffer: {
    tripId: string;
    pickupLocation: { lat: number; lng: number };
    dropoffLocation: { lat: number; lng: number };
    fare: number;
  };

  // LiveRideOfferItem required fields
  rideType: "one-way" | "round-trip" | "hourly";
  peopleCount: number;
  rating: number;
  hasSpecialRequirements: boolean;
  hasPackage: boolean;

  // Pickup details
  pickupTime: number;
  pickupDistance: number;
  pickupAddress: string;

  // Dropoff details
  dropoffTime: number;
  dropoffDistance: number;
  dropoffAddress: string;

  // Ride details
  rideTime: number;
  rideDistance: number;
  totalPrice: number;
  driverEarn: number;

  // Button details
  buttonTitle: string;

  // Timestamps
  timestamp: string;
  timeout: number;
}

interface BroadcastJobOffersContextType {
  // State
  broadcastOffers: BroadcastJobOffer[];

  // Actions
  addBroadcastOffer: (offer: BroadcastJobOffer) => void;
  removeBroadcastOffer: (offerId: string) => void;
  updateBroadcastOffer: (
    offerId: string,
    updates: Partial<BroadcastJobOffer>
  ) => void;
  clearAllBroadcastOffers: () => void;
  getBroadcastOffer: (offerId: string) => BroadcastJobOffer | undefined;
}

const BroadcastJobOffersContext = createContext<
  BroadcastJobOffersContextType | undefined
>(undefined);

export function BroadcastJobOffersProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [broadcastOffers, setBroadcastOffers] = useState<BroadcastJobOffer[]>(
    []
  );

  // Add a new broadcast offer
  const addBroadcastOffer = (offer: BroadcastJobOffer) => {
    setBroadcastOffers((prev) => {
      console.log(
        `[BroadcastJobOffersContext] Previous offers count: ${prev.length}`
      );

      // Check if offer already exists - if so, replace it instead of skipping
      const existingIndex = prev.findIndex(
        (existing) => existing.id === offer.id
      );
      if (existingIndex !== -1) {
        console.log(
          `[BroadcastJobOffersContext] Offer ${offer.id} already exists, replacing with new status: ${offer.status}`
        );
        // Replace the existing offer with the new one
        const newOffers = [...prev];
        newOffers[existingIndex] = offer;
        console.log(
          `[BroadcastJobOffersContext] Replaced offer - offers count: ${newOffers.length}`
        );
        console.log(
          `[BroadcastJobOffersContext] All offers after replacement:`,
          newOffers.map((o) => ({ id: o.id, status: o.status }))
        );
        return newOffers;
      }

      // If offer doesn't exist, add it to the beginning
      const newOffers = [offer, ...prev];
      console.log(
        `[BroadcastJobOffersContext] New offer added - offers count: ${newOffers.length}`
      );
      console.log(
        `[BroadcastJobOffersContext] All offers:`,
        newOffers.map((o) => ({ id: o.id, status: o.status }))
      );

      return newOffers;
    });
  };

  // Remove a broadcast offer
  const removeBroadcastOffer = (offerId: string) => {
    setBroadcastOffers((prev) => prev.filter((offer) => offer.id !== offerId));
  };

  // Update a specific broadcast offer
  const updateBroadcastOffer = (
    offerId: string,
    updates: Partial<BroadcastJobOffer>
  ) => {
    console.log(
      `[BroadcastJobOffersContext] Updating offer ${offerId}:`,
      updates
    );

    setBroadcastOffers((prev) => {
      console.log(
        `[BroadcastJobOffersContext] Before update - offers count: ${prev.length}`
      );

      const updated = prev.map((offer) =>
        offer.id === offerId ? { ...offer, ...updates } : offer
      );

      console.log(
        `[BroadcastJobOffersContext] After update - offers count: ${updated.length}`
      );
      console.log(
        `[BroadcastJobOffersContext] All offers after update:`,
        updated.map((o) => ({ id: o.id, status: o.status }))
      );

      return updated;
    });
  };

  // Clear all broadcast offers
  const clearAllBroadcastOffers = () => {
    console.log(`[BroadcastJobOffersContext] Clearing all broadcast offers`);
    setBroadcastOffers([]);
  };

  // Get a specific broadcast offer
  const getBroadcastOffer = (offerId: string) => {
    return broadcastOffers.find((offer) => offer.id === offerId);
  };

  // Auto-cleanup expired offers every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setBroadcastOffers((prev) =>
        prev.map((offer) => {
          const expiresAt = new Date(offer.tripOffer.expiresAt);
          const isExpired = expiresAt <= now;

          if (isExpired && offer.status !== "expired") {
            console.log(
              `[BroadcastJobOffersContext] Marking offer ${offer.id} as expired:`,
              {
                offerId: offer.id,
                expiresAt: offer.tripOffer.expiresAt,
                parsedExpiresAt: expiresAt.toISOString(),
                now: now.toISOString(),
                isExpired,
              }
            );
            return { ...offer, status: "expired" as const };
          }
          return offer;
        })
      );
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const contextValue: BroadcastJobOffersContextType = {
    broadcastOffers,
    addBroadcastOffer,
    removeBroadcastOffer,
    updateBroadcastOffer,
    clearAllBroadcastOffers,
    getBroadcastOffer,
  };

  return (
    <BroadcastJobOffersContext.Provider value={contextValue}>
      {children}
    </BroadcastJobOffersContext.Provider>
  );
}

export function useBroadcastJobOffers(): BroadcastJobOffersContextType {
  const context = useContext(BroadcastJobOffersContext);
  if (context === undefined) {
    throw new Error(
      "useBroadcastJobOffers must be used within a BroadcastJobOffersProvider"
    );
  }
  return context;
}
