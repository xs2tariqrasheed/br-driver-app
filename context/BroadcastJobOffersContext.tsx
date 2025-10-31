import { RIDE_TYPES, TRIP_OFFER_TYPES } from "@/constants/global";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";

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
    customerId: string;
    pickup: { lat: number; lng: number; address?: string };
    dropoff: { lat: number; lng: number; address?: string };
    biddable: boolean;
    type: "sequential" | "broadcast";
    fare?: number;
    timestamp?: number;
    for?: "io" | "hired";
  };

  // LiveRideOfferItem required fields
  rideType: keyof typeof RIDE_TYPES;
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
  expiredAt?: string | Date | null;
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
  clearNonDemoBroadcastOffers: () => void;
  getBroadcastOffer: (offerId: string) => BroadcastJobOffer | undefined;
  markBroadcastOfferAsExpired: (tripId: string) => void;
  resetDemoOffers: () => Promise<void>;
}

const BroadcastJobOffersContext = createContext<
  BroadcastJobOffersContextType | undefined
>(undefined);

/**
 * Create demo broadcast offers for demonstration purposes
 * These offers are local-only and will not expire or make API calls
 */
function createDemoBroadcastOffers(): BroadcastJobOffer[] {
  const baseTimestamp = new Date().toISOString();
  const farFutureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year from now

  return [
    {
      id: "demo-offer-1",
      type: TRIP_OFFER_TYPES.BROADCAST,
      status: "offered",
      bidable: true,
      tripOffer: {
        tripId: "demo-offer-1",
        customerId: "demo-customer-1",
        pickup: { lat: 40.7128, lng: -74.006, address: "123 Main St, New York, NY" },
        dropoff: { lat: 40.7589, lng: -73.9851, address: "456 Broadway, New York, NY" },
        biddable: true,
        type: "broadcast",
        fare: 45,
        timestamp: Date.now(),
        for: "io",
      },
      rideType: RIDE_TYPES.ONE_WAY as keyof typeof RIDE_TYPES,
      peopleCount: 2,
      rating: 4.8,
      hasSpecialRequirements: true,
      hasPackage: false,
      pickupTime: 8,
      pickupDistance: 2.5,
      pickupAddress: "123 Main St, New York, NY",
      dropoffTime: 25,
      dropoffDistance: 12.3,
      dropoffAddress: "456 Broadway, New York, NY",
      rideTime: 20,
      rideDistance: 9.8,
      totalPrice: 45.50,
      driverEarn: 38.20,
      buttonTitle: "Bid",
      timestamp: baseTimestamp,
      timeout: 300000,
      expiredAt: null, // Never expires
    },
    {
      id: "demo-offer-2",
      type: TRIP_OFFER_TYPES.BROADCAST,
      status: "offered",
      bidable: false,
      tripOffer: {
        tripId: "demo-offer-2",
        customerId: "demo-customer-2",
        pickup: { lat: 34.0522, lng: -118.2437, address: "789 Sunset Blvd, Los Angeles, CA" },
        dropoff: { lat: 34.0689, lng: -118.4452, address: "321 Santa Monica Blvd, Santa Monica, CA" },
        biddable: false,
        type: "broadcast",
        fare: 28,
        timestamp: Date.now(),
        for: "io",
      },
      rideType: RIDE_TYPES.ONE_WAY as keyof typeof RIDE_TYPES,
      peopleCount: 1,
      rating: 4.5,
      hasSpecialRequirements: false,
      hasPackage: true,
      pickupTime: 5,
      pickupDistance: 1.2,  
      pickupAddress: "789 Sunset Blvd, Los Angeles, CA",
      dropoffTime: 18,
      dropoffDistance: 8.5,
      dropoffAddress: "321 Santa Monica Blvd, Santa Monica, CA",
      rideTime: 15,
      rideDistance: 7.3,
      totalPrice: 28,
      driverEarn: 24,
      buttonTitle: "Accept",
      timestamp: baseTimestamp,
      timeout: 300000,
      expiredAt: null,
    },
    {
      id: "demo-offer-3",
      type: TRIP_OFFER_TYPES.BROADCAST,
      status: "offered",
      bidable: true,
      tripOffer: {
        tripId: "demo-offer-3",
        customerId: "demo-customer-3",
        pickup: { lat: 41.8781, lng: -87.6298, address: "555 Michigan Ave, Chicago, IL" },
        dropoff: { lat: 41.8781, lng: -87.6298, address: "555 Michigan Ave, Chicago, IL" },
        biddable: true,
        type: "broadcast",
        fare: 65,
        timestamp: Date.now(),
        for: "io",
      },
      rideType: RIDE_TYPES.ROUND_TRIP as keyof typeof RIDE_TYPES ,
      peopleCount: 3,
      rating: 4.9,
      hasSpecialRequirements: false,
      hasPackage: false,
      pickupTime: 12,
      pickupDistance: 3.8,
      pickupAddress: "555 Michigan Ave, Chicago, IL",
      dropoffTime: 0,
      dropoffDistance: 0,
      dropoffAddress: "555 Michigan Ave, Chicago, IL",
      rideTime: 60,
      rideDistance: 25.0,
      totalPrice: 65,
      driverEarn: 54.60,
      buttonTitle: "Bid",
      timestamp: baseTimestamp,
      timeout: 300000,
      expiredAt: null,
    },
    {
      id: "demo-offer-4",
      type: TRIP_OFFER_TYPES.BROADCAST,
      status: "offered",
      bidable: false,
      tripOffer: {
        tripId: "demo-offer-4",
        customerId: "demo-customer-4",
        pickup: { lat: 29.7604, lng: -95.3698, address: "100 Main St, Houston, TX" },
        dropoff: { lat: 29.7616, lng: -95.3625, address: "200 Commerce St, Houston, TX" },
        biddable: false,
        type: "broadcast",
        fare: 22.5,
        timestamp: Date.now(),
        for: "io",
      },
      rideType: RIDE_TYPES.ONE_WAY as keyof typeof RIDE_TYPES,
      peopleCount: 2,
      rating: 4.7,
      hasSpecialRequirements: true,
      hasPackage: true,
      pickupTime: 6,
      pickupDistance: 1.5,
      pickupAddress: "100 Main St, Houston, TX",
      dropoffTime: 15,
      dropoffDistance: 5.2,
      dropoffAddress: "200 Commerce St, Houston, TX",
      rideTime: 12,
      rideDistance: 3.7,
    totalPrice: 22.5,
      driverEarn: 18,
      buttonTitle: "Accept",
      timestamp: baseTimestamp,
      timeout: 300000,
      expiredAt: null,
    },
    {
      id: "demo-offer-5",
      type: TRIP_OFFER_TYPES.BROADCAST,
      status: "offered",
      bidable: true,
      tripOffer: {
        tripId: "demo-offer-5",
        customerId: "demo-customer-5",
        pickup: { lat: 25.7617, lng: -80.1918, address: "300 Ocean Dr, Miami Beach, FL" },
        dropoff: { lat: 25.7907, lng: -80.1300, address: "500 Biscayne Blvd, Miami, FL" },
        biddable: true,
        type: "broadcast",
        fare: 35,
        timestamp: Date.now(),
        for: "io",
      },
      rideType: RIDE_TYPES.ONE_WAY as keyof typeof RIDE_TYPES,
      peopleCount: 4,
      rating: 4.6,
      hasSpecialRequirements: false,
      hasPackage: false,
      pickupTime: 10,
      pickupDistance: 2.1,
      pickupAddress: "300 Ocean Dr, Miami Beach, FL",
      dropoffTime: 22,
      dropoffDistance: 10.8,
      dropoffAddress: "500 Biscayne Blvd, Miami, FL",
      rideTime: 18,
      rideDistance: 8.7,
      totalPrice: 35,
      driverEarn: 29,
      buttonTitle: "Bid",
      timestamp: baseTimestamp,
      timeout: 300000,
      expiredAt: null,
    },
    {
      id: "demo-offer-6",
      type: TRIP_OFFER_TYPES.BROADCAST,
      status: "offered",
      bidable: false,
      tripOffer: {
        tripId: "demo-offer-6",
        customerId: "demo-customer-6",
        pickup: { lat: 47.6062, lng: -122.3321, address: "700 Pine St, Seattle, WA" },
        dropoff: { lat: 47.6086, lng: -122.3377, address: "800 Pike St, Seattle, WA" },
        biddable: false,
        type: "broadcast",
        fare: 18,
        timestamp: Date.now(),
        for: "io",
      },
      rideType: RIDE_TYPES.HOURLY as keyof typeof RIDE_TYPES,
      peopleCount: 1,
      rating: 4.4,
      hasSpecialRequirements: false,
      hasPackage: false,
      pickupTime: 7,
      pickupDistance: 1.8,
      pickupAddress: "700 Pine St, Seattle, WA",
      dropoffTime: 30,
      dropoffDistance: 2.5,
      dropoffAddress: "800 Pike St, Seattle, WA",
      rideTime: 90,
      rideDistance: 15.0,
      totalPrice: 18,
      driverEarn: 15,
      buttonTitle: "Accept",
      timestamp: baseTimestamp,
      timeout: 300000,
      expiredAt: null,
    },
  ];
}

export function BroadcastJobOffersProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [broadcastOffers, setBroadcastOffers] = useState<BroadcastJobOffer[]>(
    []
  );
  const demoOffersInitialized = useRef(false);

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
    // Prevent removal of demo offers (they should only be hidden/skipped, not removed)
    if (offerId.startsWith("demo-")) {
      console.log(
        `[BroadcastJobOffersContext] Skipping removal of demo offer: ${offerId}`
      );
      return;
    }
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

  // Clear only non-demo broadcast offers, keep demo offers intact
  const clearNonDemoBroadcastOffers = () => {
    console.log(`[BroadcastJobOffersContext] Clearing non-demo broadcast offers`);
    setBroadcastOffers((prev) => prev.filter((offer) => offer.id.startsWith("demo-")));
  };

  // Get a specific broadcast offer
  const getBroadcastOffer = (offerId: string) => {
    return broadcastOffers.find((offer) => offer.id === offerId);
  };

  /**
   * Mark a broadcast offer as expired by tripId
   * This method is called by the ExpirationService when server sends expiration event
   */
  const markBroadcastOfferAsExpired = (tripId: string) => {
    // Skip expiration for demo offers
    if (tripId.startsWith("demo-")) {
      console.log(`⏰ Skipping expiration for demo offer: ${tripId}`);
      return;
    }

    console.log(`⏰ Marking broadcast offer as expired: ${tripId}`);

    // Update the offer status to expired
    setBroadcastOffers((prev) =>
      prev.map((offer) => {
        // Check if this offer matches the expired tripId
        if (offer.tripOffer.tripId === tripId && offer.status !== "expired") {
          console.log(
            `📡 Found matching broadcast offer to mark as expired: ${offer.id}`
          );
          return { ...offer, status: "expired" as const };
        }
        return offer;
      })
    );

    console.log("✅ Broadcast offer marked as expired successfully");
  };

  // Reset demo offers to default state
  const resetDemoOffers = async () => {
    console.log("[BroadcastJobOffersContext] Resetting demo offers to default state");
    
    // Remove all demo offers
    setBroadcastOffers((prev) => prev.filter((offer) => !offer.id.startsWith("demo-")));
    
    // Reset initialization flag
    demoOffersInitialized.current = false;
    
    // Re-initialize demo offers
    const demoOffers = createDemoBroadcastOffers();
    setBroadcastOffers((prev) => {
      // Ensure no demo offers exist before adding
      const filtered = prev.filter((offer) => !offer.id.startsWith("demo-"));
      demoOffersInitialized.current = true;
      return [...demoOffers, ...filtered];
    });
    
    console.log(
      `[BroadcastJobOffersContext] Reset and re-initialized ${demoOffers.length} demo offers`
    );
  };

  // Initialize demo offers on mount (only once)
  useEffect(() => {
    if (demoOffersInitialized.current) {
      return;
    }

    // Check if demo offers already exist in current state
    const hasDemoOffers = broadcastOffers.some((offer) =>
      offer.id.startsWith("demo-")
    );

    if (!hasDemoOffers) {
      console.log("[BroadcastJobOffersContext] Initializing demo offers");
      const demoOffers = createDemoBroadcastOffers();
      // Add all demo offers at once
      setBroadcastOffers((prev) => {
        // Double-check no demo offers exist
        const hasExistingDemo = prev.some((offer) =>
          offer.id.startsWith("demo-")
        );
        if (hasExistingDemo) {
          demoOffersInitialized.current = true;
          return prev;
        }
        demoOffersInitialized.current = true;
        return [...demoOffers, ...prev];
      });
      console.log(
        `[BroadcastJobOffersContext] Initialized ${demoOffers.length} demo offers`
      );
    } else {
      demoOffersInitialized.current = true;
    }
  }, [broadcastOffers]);

  const contextValue: BroadcastJobOffersContextType = {
    broadcastOffers,
    addBroadcastOffer,
    removeBroadcastOffer,
    updateBroadcastOffer,
    clearAllBroadcastOffers,
    clearNonDemoBroadcastOffers,
    getBroadcastOffer,
    markBroadcastOfferAsExpired,
    resetDemoOffers,
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
