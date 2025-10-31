/**
 * @fileoverview FutureJobOffersContext - Context for managing future job offers for hired drivers
 *
 * This context provides:
 * - Dummy future job offers data (will be replaced with real API when backend is ready)
 * - State management for future job offers
 * - Availability confirmation/revocation methods
 * - Periodic polling setup (ready for real API integration)
 *
 * Migration Path: When backend confirms API approach, replace dummy data with useFetch hook
 * and update confirmAvailability/revokeAvailability to call real API endpoints.
 */

import { logger } from "@/utils/helpers";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

// Types
export interface FutureJobOffer {
  id: string;
  rideType: "one-way" | "round-trip" | "hourly";
  peopleCount: number;
  rating: number;
  hasSpecialRequirements: boolean;
  specialRequirements?: any;
  hasPackage: boolean;
  packageInfo?: any;
  bidable: boolean;
  pickupTime: number; // minutes from now
  pickupDistance: number; // miles
  pickupAddress: string;
  dropoffTime: number; // minutes from now
  dropoffDistance: number; // miles
  dropoffAddress: string;
  rideTime: number; // minutes
  rideDistance: number; // miles
  totalPrice: number;
  driverEarn: number;
  status: "offered" | "accepted" | "rejected" | "expired";
  availabilityConfirmed: boolean; // New field for tracking availability
  notes?: string; // Driver instructions/notes
  pickupDate?: string; // Pickup date for future jobs
  scheduledPickupTime?: string; // Scheduled pickup time for future jobs
  timestamp: number;
}

interface FutureJobOffersContextType {
  futureOffers: FutureJobOffer[];
  updateFutureOffer: (
    offerId: string,
    updates: Partial<FutureJobOffer>
  ) => void;
  clearAllFutureOffers: () => void;
  confirmAvailability: (offerId: string) => void;
  revokeAvailability: (offerId: string) => void;
  loading: boolean;
  error: string | null;
}

const FutureJobOffersContext = createContext<
  FutureJobOffersContextType | undefined
>(undefined);

const log = logger();

// Dummy data - will be replaced with real API when backend is ready
const DUMMY_FUTURE_OFFERS: FutureJobOffer[] = [
  {
    id: "future-job-1",
    rideType: "one-way",
    peopleCount: 1,
    rating: 5.0,
    hasSpecialRequirements: false,
    hasPackage: false,
    bidable: false,
    pickupTime: 180, // 3 hours from now
    pickupDistance: 2.5,
    pickupAddress: "Pascal Ave N & N Terrace AR. Roseville 69 Main Street",
    dropoffTime: 240, // 4 hours from now
    dropoffDistance: 15.2,
    dropoffAddress: "36-01 37th St, Long Island City, NY 11101, USA",
    rideTime: 60, // 1 hour
    rideDistance: 12.7,
    totalPrice: 195,
    driverEarn: 165,
    status: "offered",
    availabilityConfirmed: false,
    notes:
      "Xmas party. 3 hours guaranteed @$65/hour. Prompt payment via Zelle, check, Paypal. Extra time, if any, will be paid also.",
    timestamp: Date.now(),
    pickupDate: "07-10-2025",
    scheduledPickupTime: "8:00 PM",
  },
  {
    id: "future-job-2",
    rideType: "round-trip",
    peopleCount: 2,
    rating: 4.8,
    hasSpecialRequirements: true,
    specialRequirements: {
      wheelchair: true,
      childSeat: false,
    },
    hasPackage: true,
    packageInfo: {
      size: "medium",
      weight: "5kg",
    },
    bidable: false,
    pickupTime: 360, // 6 hours from now
    pickupDistance: 1.8,
    pickupAddress: "123 Main Street, Downtown",
    dropoffTime: 480, // 8 hours from now
    dropoffDistance: 25.4,
    dropoffAddress: "456 Airport Road, JFK Terminal 4",
    rideTime: 90, // 1.5 hours
    rideDistance: 18.3,
    totalPrice: 320,
    driverEarn: 280,
    status: "offered",
    availabilityConfirmed: false,
    notes:
      "Airport pickup. Please arrive 10 minutes early. Customer has mobility assistance requirements.",
    timestamp: Date.now(),
    pickupDate: "07-10-2025",
    scheduledPickupTime: "8:00 PM",
  },
  {
    id: "future-job-3",
    rideType: "hourly",
    peopleCount: 3,
    rating: 4.9,
    hasSpecialRequirements: false,
    hasPackage: false,
    bidable: false,
    pickupTime: 720, // 12 hours from now
    pickupDistance: 3.2,
    pickupAddress: "789 Business District, Corporate Center",
    dropoffTime: 960, // 16 hours from now
    dropoffDistance: 3.2,
    dropoffAddress: "789 Business District, Corporate Center",
    rideTime: 240, // 4 hours
    rideDistance: 0, // Round trip
    totalPrice: 400,
    driverEarn: 350,
    status: "offered",
    availabilityConfirmed: false,
    notes:
      "Corporate event transportation. 4-hour minimum. Wait time included. Professional attire required.",
    timestamp: Date.now(),
    pickupDate: "07-10-2025",
    scheduledPickupTime: "8:00 PM",
  },
];

export function FutureJobOffersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [futureOffers, setFutureOffers] =
    useState<FutureJobOffer[]>(DUMMY_FUTURE_OFFERS);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with real API call when backend is ready
  const fetchFutureOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // For now, return dummy data
      // When backend is ready, replace with:
      // const response = await apiClient.get(LIVE_JOB_ENDPOINTS.getFutureJobs);
      // setFutureOffers(response.data);

      setFutureOffers(DUMMY_FUTURE_OFFERS);
      log("[FutureJobOffersContext] Dummy future offers loaded");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch future offers";
      setError(errorMessage);
      log("[FutureJobOffersContext] Error fetching future offers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a specific future offer
  const updateFutureOffer = useCallback(
    (offerId: string, updates: Partial<FutureJobOffer>) => {
      setFutureOffers((prev) =>
        prev.map((offer) =>
          offer.id === offerId ? { ...offer, ...updates } : offer
        )
      );
      log(`[FutureJobOffersContext] Updated future offer ${offerId}:`, updates);
    },
    []
  );

  // Clear all future offers
  const clearAllFutureOffers = useCallback(() => {
    setFutureOffers([]);
    log("[FutureJobOffersContext] Cleared all future offers");
  }, []);

  // Confirm availability for a future job
  const confirmAvailability = useCallback(
    (offerId: string) => {
      updateFutureOffer(offerId, {
        availabilityConfirmed: true,
        status: "accepted",
      });
      log(
        `[FutureJobOffersContext] Confirmed availability for future offer ${offerId}`
      );

      // TODO: When backend is ready, add API call here:
      // await apiClient.post(`/api/future-jobs/${offerId}/confirm-availability`);
    },
    [updateFutureOffer]
  );

  // Revoke availability for a future job
  const revokeAvailability = useCallback(
    (offerId: string) => {
      updateFutureOffer(offerId, {
        availabilityConfirmed: false,
        status: "offered",
      });
      log(
        `[FutureJobOffersContext] Revoked availability for future offer ${offerId}`
      );

      // TODO: When backend is ready, add API call here:
      // await apiClient.post(`/api/future-jobs/${offerId}/revoke-availability`);
    },
    [updateFutureOffer]
  );

  // Load future offers on mount
  useEffect(() => {
    fetchFutureOffers();
  }, [fetchFutureOffers]);

  // TODO: Set up periodic polling when backend is ready
  // useEffect(() => {
  //   const interval = setInterval(fetchFutureOffers, FUTURE_JOB_REFRESH_INTERVAL_MS);
  //   return () => clearInterval(interval);
  // }, [fetchFutureOffers]);

  const value: FutureJobOffersContextType = {
    futureOffers,
    updateFutureOffer,
    clearAllFutureOffers,
    confirmAvailability,
    revokeAvailability,
    loading,
    error,
  };

  return (
    <FutureJobOffersContext.Provider value={value}>
      {children}
    </FutureJobOffersContext.Provider>
  );
}

export function useFutureJobOffers() {
  const context = useContext(FutureJobOffersContext);
  if (context === undefined) {
    throw new Error(
      "useFutureJobOffers must be used within a FutureJobOffersProvider"
    );
  }
  return context;
}
