import { RIDE_TYPES, TRIP_OFFER_TYPES } from "@/constants/global";

/**
 * Server socket data structure from terminal output
 */
interface ServerSocketData {
  timeout: number;
  timestamp: string;
  tripOffer: {
    customerId: string;
    dropoff: { lat: number; lng: number };
    fare: number;
    pickup: { lat: number; lng: number };
    timestamp: number;
    tripId: string;
    type: string;
    biddable?: boolean;
  };
  type: string;
}

/**
 * Frontend data structure for trip offers
 */
export interface FormattedTripOffer {
  tripId: string;
  customerId: string;
  driverId?: string; // Will be set per driver during distribution
  pickup: {
    lat: number;
    lng: number;
  };
  dropoff: {
    lat: number;
    lng: number;
  };
  fare: number;
  biddable: boolean;
  type: "sequential" | "broadcast";

  // Comprehensive ride details for frontend
  rideDetails: {
    id: string;
    rideType: keyof typeof RIDE_TYPES;
    peopleCount: number;
    rating: number;
    hasSpecialRequirements: boolean;
    hasPackage: boolean;
    pickupTime: number; // Minutes to reach pickup point
    pickupDistance: number; // Miles
    pickupAddress: string;
    dropoffTime: number; // Minutes
    dropoffDistance: number; // Miles
    dropoffAddress: string;
    rideTime: number; // Total ride time in minutes
    rideDistance: number; // Total ride distance in miles
    totalPrice: number;
    driverEarn: number; // 80% of total price
    carType: string;
    created_at: string;
    driverInstructions: string;
  };

  specialRequirements: {
    totalPassengers: string;
    totalBags: string;
    hasPets: boolean;
    needWheelchair: boolean;
    childSeat: {
      infantCount: string;
      toddlerCount: string;
      boosterCount: string;
    };
    isArmed: boolean;
    language: string;
  };

  packageInfo: {
    totalPackages: string;
    weight: string;
    phoneNumber: string;
    recipientName: string;
    instructions: string;
  };

  fareDetails: {
    ridePrice: string;
    tollsPrice: string;
    tips: string;
    discount: string;
    serviceCharges: string;
    fuelSurcharge: string;
    NYCCongestionSurcharge: string;
  };

  customerDetails: {
    name: string;
    carType: string;
    offerPrice: string;
    accountNumber: string;
    profileNumber: string;
  };
}

/**
 * Default values for missing data
 */
const DEFAULT_VALUES = {
  // Ride details defaults
  rideType: RIDE_TYPES.ONE_WAY,
  peopleCount: 2,
  rating: 4.8,
  hasSpecialRequirements: false,
  hasPackage: false,
  pickupTime: 5,
  pickupDistance: 0.8,
  pickupAddress: "123 Main St, New York, NY 10001",
  dropoffTime: 15,
  dropoffDistance: 3.2,
  dropoffAddress: "456 Broadway, New York, NY 10013",
  rideTime: 20,
  rideDistance: 4.0,
  carType: "Sedan",
  driverInstructions: "Please call customer when you arrive",

  // Special requirements defaults
  specialRequirements: {
    totalPassengers: "2",
    totalBags: "1",
    hasPets: false,
    needWheelchair: false,
    childSeat: {
      infantCount: "0",
      toddlerCount: "0",
      boosterCount: "0",
    },
    isArmed: false,
    language: "English",
  },

  // Package info defaults
  packageInfo: {
    totalPackages: "0",
    weight: "0",
    phoneNumber: "+1-555-0123",
    recipientName: "John Doe",
    instructions: "Leave at front door",
  },

  // Fare details defaults
  fareDetails: {
    ridePrice: "0",
    tollsPrice: "2.50",
    tips: "0.00",
    discount: "0.00",
    serviceCharges: "1.50",
    fuelSurcharge: "1.00",
    NYCCongestionSurcharge: "2.75",
  },

  // Customer details defaults
  customerDetails: {
    name: "John Smith",
    carType: "Sedan",
    offerPrice: "0",
    accountNumber: "123456789",
    profileNumber: "987654321",
  },
};

/**
 * Helper function to calculate driver earnings (80% of total price)
 */
function calculateDriverEarn(totalPrice: number): number {
  return Math.round(totalPrice * 0.8);
}

/**
 * Helper function to format fare as string with 2 decimal places
 */
function formatFare(fare: number): string {
  return fare.toFixed(2);
}

/**
 * Helper function to generate realistic addresses based on coordinates
 */
function generateAddressFromCoordinates(
  lat: number,
  lng: number,
  type: "pickup" | "dropoff"
): string {
  // This is a simplified version - in production, you'd use reverse geocoding
  const baseAddress =
    type === "pickup"
      ? "123 Main St, New York, NY 10001"
      : "456 Broadway, New York, NY 10013";

  // Add some variation based on coordinates
  const variation = Math.abs(lat + lng) % 1000;
  return `${variation} ${baseAddress}`;
}

/**
 * Formats server socket data to frontend data structure
 *
 * @param serverData - Raw data from server socket
 * @param driverId - Optional driver ID to include in the formatted data
 * @returns Formatted trip offer data ready for frontend consumption
 */
export function formatSocketDataToTripOffer(
  serverData: ServerSocketData,
  driverId?: string
): FormattedTripOffer {
  const { tripOffer, timeout, timestamp } = serverData;

  // Determine offer type
  const offerType =
    tripOffer.type === TRIP_OFFER_TYPES.SEQUENTIAL ? "sequential" : "broadcast";

  // Calculate derived values
  const driverEarn = calculateDriverEarn(tripOffer.fare);
  const formattedFare = formatFare(tripOffer.fare);

  // Generate addresses from coordinates
  const pickupAddress = generateAddressFromCoordinates(
    tripOffer.pickup.lat,
    tripOffer.pickup.lng,
    "pickup"
  );
  const dropoffAddress = generateAddressFromCoordinates(
    tripOffer.dropoff.lat,
    tripOffer.dropoff.lng,
    "dropoff"
  );

  return {
    // Basic trip information from server
    tripId: tripOffer.tripId,
    customerId: tripOffer.customerId,
    driverId,
    pickup: {
      lat: tripOffer.pickup.lat,
      lng: tripOffer.pickup.lng,
    },
    dropoff: {
      lat: tripOffer.dropoff.lat,
      lng: tripOffer.dropoff.lng,
    },
    fare: tripOffer.fare,
    biddable: true, //tripOffer.biddable || false,
    type: offerType,

    // Comprehensive ride details
    rideDetails: {
      id: tripOffer.tripId,
      rideType: DEFAULT_VALUES.rideType as keyof typeof RIDE_TYPES,
      peopleCount: DEFAULT_VALUES.peopleCount,
      rating: DEFAULT_VALUES.rating,
      hasSpecialRequirements: DEFAULT_VALUES.hasSpecialRequirements,
      hasPackage: DEFAULT_VALUES.hasPackage,
      pickupTime: DEFAULT_VALUES.pickupTime,
      pickupDistance: DEFAULT_VALUES.pickupDistance,
      pickupAddress,
      dropoffTime: DEFAULT_VALUES.dropoffTime,
      dropoffDistance: DEFAULT_VALUES.dropoffDistance,
      dropoffAddress,
      rideTime: DEFAULT_VALUES.rideTime,
      rideDistance: DEFAULT_VALUES.rideDistance,
      totalPrice: tripOffer.fare,
      driverEarn,
      carType: DEFAULT_VALUES.carType,
      created_at: new Date(tripOffer.timestamp).toISOString(),
      driverInstructions: DEFAULT_VALUES.driverInstructions,
    },

    // Special requirements (using defaults for now)
    specialRequirements: { ...DEFAULT_VALUES.specialRequirements },

    // Package information (using defaults for now)
    packageInfo: { ...DEFAULT_VALUES.packageInfo },

    // Fare details
    fareDetails: {
      ...DEFAULT_VALUES.fareDetails,
      ridePrice: formattedFare,
    },

    // Customer details (using defaults for now)
    customerDetails: {
      ...DEFAULT_VALUES.customerDetails,
      offerPrice: formattedFare,
    },
  };
}

/**
 * Formats server socket data to the existing RideOffer interface
 * (for backward compatibility with current code)
 */
export function formatSocketDataToRideOffer(
  serverData: ServerSocketData,
  driverId?: string
) {
  const formattedTripOffer = formatSocketDataToTripOffer(serverData, driverId);

  return {
    // Basic ride offer info
    id: formattedTripOffer.tripId,
    type: formattedTripOffer.type as any,
    status: "offered" as const,
    bidable: formattedTripOffer.biddable,

    // Trip offer details
    tripOffer: {
      tripId: formattedTripOffer.tripId,
      pickupLocation: formattedTripOffer.pickup,
      dropoffLocation: formattedTripOffer.dropoff,
      fare: formattedTripOffer.fare,
    },

    // LiveRideOfferItem required fields
    rideType: formattedTripOffer.rideDetails.rideType,
    peopleCount: formattedTripOffer.rideDetails.peopleCount,
    rating: formattedTripOffer.rideDetails.rating,
    hasSpecialRequirements:
      formattedTripOffer.rideDetails.hasSpecialRequirements,
    hasPackage: formattedTripOffer.rideDetails.hasPackage,
    specialRequirements: formattedTripOffer.specialRequirements,
    packageInfo: formattedTripOffer.packageInfo,

    // Pickup details
    pickupTime: formattedTripOffer.rideDetails.pickupTime,
    pickupDistance: formattedTripOffer.rideDetails.pickupDistance,
    pickupAddress: formattedTripOffer.rideDetails.pickupAddress,

    // Dropoff details
    dropoffTime: formattedTripOffer.rideDetails.dropoffTime,
    dropoffDistance: formattedTripOffer.rideDetails.dropoffDistance,
    dropoffAddress: formattedTripOffer.rideDetails.dropoffAddress,

    // Ride details
    rideTime: formattedTripOffer.rideDetails.rideTime,
    rideDistance: formattedTripOffer.rideDetails.rideDistance,
    totalPrice: formattedTripOffer.rideDetails.totalPrice,
    driverEarn: formattedTripOffer.rideDetails.driverEarn,

    // Button details
    buttonTitle: formattedTripOffer.biddable ? "Bid" : "Accept",

    // Timestamps
    timestamp: serverData.timestamp,
    timeout: serverData.timeout,
  };
}

/**
 * Formats server socket data to BroadcastJobOffer interface
 * (for backward compatibility with current code)
 */
export function formatSocketDataToBroadcastOffer(
  serverData: ServerSocketData,
  driverId?: string
) {
  const formattedTripOffer = formatSocketDataToTripOffer(serverData, driverId);

  return {
    // Basic job offer info
    id: formattedTripOffer.tripId,
    type: formattedTripOffer.type as any,
    status: "offered" as const,
    bidable: formattedTripOffer.biddable,

    // Trip offer details
    tripOffer: {
      tripId: formattedTripOffer.tripId,
      pickupLocation: formattedTripOffer.pickup,
      dropoffLocation: formattedTripOffer.dropoff,
      fare: formattedTripOffer.fare,
    },

    // LiveRideOfferItem required fields
    rideType: formattedTripOffer.rideDetails.rideType,
    peopleCount: formattedTripOffer.rideDetails.peopleCount,
    rating: formattedTripOffer.rideDetails.rating,
    hasSpecialRequirements:
      formattedTripOffer.rideDetails.hasSpecialRequirements,
    hasPackage: formattedTripOffer.rideDetails.hasPackage,
    specialRequirements: formattedTripOffer.specialRequirements,
    packageInfo: formattedTripOffer.packageInfo,

    // Pickup details
    pickupTime: formattedTripOffer.rideDetails.pickupTime,
    pickupDistance: formattedTripOffer.rideDetails.pickupDistance,
    pickupAddress: formattedTripOffer.rideDetails.pickupAddress,

    // Dropoff details
    dropoffTime: formattedTripOffer.rideDetails.dropoffTime,
    dropoffDistance: formattedTripOffer.rideDetails.dropoffDistance,
    dropoffAddress: formattedTripOffer.rideDetails.dropoffAddress,

    // Ride details
    rideTime: formattedTripOffer.rideDetails.rideTime,
    rideDistance: formattedTripOffer.rideDetails.rideDistance,
    totalPrice: formattedTripOffer.rideDetails.totalPrice,
    driverEarn: formattedTripOffer.rideDetails.driverEarn,

    // Button details
    buttonTitle: formattedTripOffer.biddable ? "Bid" : "Accept",

    // Timestamps
    timestamp: serverData.timestamp,
    timeout: serverData.timeout,
  };
}
