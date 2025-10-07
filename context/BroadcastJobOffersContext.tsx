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
  status: "offered" | "accepted" | "rejected" | "expired";
  bidable: boolean;

  // Trip offer details
  tripOffer: {
    tripId: string;
    pickupLocation: { lat: number; lng: number };
    dropoffLocation: { lat: number; lng: number };
    fare: number;
    expiresAt: Date;
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
      // Check if offer already exists (avoid duplicates)
      const exists = prev.some((existing) => existing.id === offer.id);
      if (exists) {
        return prev;
      }
      return [offer, ...prev]; // Add to beginning
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
    setBroadcastOffers((prev) =>
      prev.map((offer) =>
        offer.id === offerId ? { ...offer, ...updates } : offer
      )
    );
  };

  // Clear all broadcast offers
  const clearAllBroadcastOffers = () => {
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
          const isExpired = new Date(offer.tripOffer.expiresAt) <= now;
          if (isExpired && offer.status !== "expired") {
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
