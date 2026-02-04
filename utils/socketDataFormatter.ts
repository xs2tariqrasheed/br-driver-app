import { CAR_TYPE, OFFER_TIMEOUT, RIDE_TYPES } from "@/constants/global";

/**
 * Server socket data structure from terminal output
 */
interface ServerSocketData {
  timeout: number;
  timestamp: string;
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
    tripType?: "ONE_WAY" | "ROUND_TRIP" | "HOURLY";
    tripCategory?: "INDIVIDUAL" | "FOOD" | "PACKAGE";
    serviceType?: "ECONOMY_LITE" | "ECONOMY" | "SEDAN" | "SUV";
    /** Dynamic values from backend (when available) */
    pickupTime?: number;
    pickupDistance?: number;
    dropoffTime?: number;
    dropoffDistance?: number;
    rideTime?: number;
    rideDistance?: number;
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
    rideType: (typeof RIDE_TYPES)[keyof typeof RIDE_TYPES]; // Value type: "one-way" | "round-trip" | "hourly"
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
    expiredAt: string | Date | null;
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
 * Maps backend tripType to frontend RIDE_TYPES values
 */
function mapTripType(
  backendTripType?: "ONE_WAY" | "ROUND_TRIP" | "HOURLY"
): (typeof RIDE_TYPES)[keyof typeof RIDE_TYPES] {
  if (!backendTripType) {
    return DEFAULT_VALUES.rideType;
  }

  // Map backend enum values to frontend RIDE_TYPES values (not keys)
  // Component expects: "one-way" | "round-trip" | "hourly"
  const mapping: Record<
    "ONE_WAY" | "ROUND_TRIP" | "HOURLY",
    (typeof RIDE_TYPES)[keyof typeof RIDE_TYPES]
  > = {
    ONE_WAY: RIDE_TYPES.ONE_WAY, // "one-way"
    ROUND_TRIP: RIDE_TYPES.ROUND_TRIP, // "round-trip"
    HOURLY: RIDE_TYPES.HOURLY, // "hourly"
  };

  return mapping[backendTripType] || DEFAULT_VALUES.rideType;
}

/**
 * Maps backend serviceType to frontend CAR_TYPE
 * Handles case-insensitive matching for flexibility
 */
function mapServiceType(
  backendServiceType?: "ECONOMY_LITE" | "ECONOMY" | "SEDAN" | "SUV" | string
): string {
  if (!backendServiceType) {
    return DEFAULT_VALUES.carType;
  }

  // Normalize to uppercase for case-insensitive matching
  const normalized = backendServiceType.toUpperCase().trim();

  const mapping: Record<string, string> = {
    ECONOMY_LITE: CAR_TYPE.ECONOMY, // Map ECONOMY_LITE to ECONOMY
    ECONOMY: CAR_TYPE.ECONOMY,
    SEDAN: CAR_TYPE.SEDAN,
    SUV: CAR_TYPE.SUV,
  };

  return mapping[normalized] || DEFAULT_VALUES.carType;
}

/**
 * Determines if trip has package based on tripCategory
 * Handles case-insensitive matching
 */
function hasPackageFromCategory(
  tripCategory?: "INDIVIDUAL" | "FOOD" | "PACKAGE" | string
): boolean {
  if (!tripCategory) {
    return false;
  }

  // Normalize to uppercase for case-insensitive matching
  const normalized = tripCategory.toUpperCase().trim();
  return normalized === "FOOD" || normalized === "PACKAGE";
}

/**
 * Determines if trip has special requirements based on tripCategory
 * Special requirements might be needed for FOOD or PACKAGE deliveries
 */
function hasSpecialRequirementsFromCategory(
  tripCategory?: "INDIVIDUAL" | "FOOD" | "PACKAGE" | string
): boolean {
  if (!tripCategory) {
    return DEFAULT_VALUES.hasSpecialRequirements;
  }

  // Normalize to uppercase for case-insensitive matching
  const normalized = tripCategory.toUpperCase().trim();
  
  // FOOD and PACKAGE deliveries might have special requirements
  // You can adjust this logic based on your business rules
  return normalized === "FOOD" || normalized === "PACKAGE";
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

  // Determine offer type - use the type directly from the backend
  const offerType = tripOffer.type as "sequential" | "broadcast";

  // Calculate derived values - handle optional fare
  const fare = tripOffer.fare || 0;
  const driverEarn = calculateDriverEarn(fare);
  const formattedFare = formatFare(fare);

  // Use server addresses if available, otherwise generate from coordinates
  const pickupAddress =
    tripOffer.pickup.address ||
    generateAddressFromCoordinates(
      tripOffer.pickup.lat,
      tripOffer.pickup.lng,
      "pickup"
    );
  const dropoffAddress =
    tripOffer.dropoff.address ||
    generateAddressFromCoordinates(
      tripOffer.dropoff.lat,
      tripOffer.dropoff.lng,
      "dropoff"
    );

  // Map backend fields to frontend values
  const rideType = mapTripType(tripOffer.tripType);
  const carType = mapServiceType(tripOffer.serviceType);
  const hasPackage = hasPackageFromCategory(tripOffer.tripCategory);
  const hasSpecialRequirements = hasSpecialRequirementsFromCategory(tripOffer.tripCategory);

  // Calculate expiration time using actual timeout from server (in milliseconds)
  // Use server timestamp if available, otherwise use current time
  const serverTimestamp = timestamp ? new Date(timestamp).getTime() : Date.now();
  const expirationTime = serverTimestamp + (timeout || OFFER_TIMEOUT);

  // Debug logging
  console.log("[formatSocketDataToTripOffer] Backend data:", {
    tripType: tripOffer.tripType,
    serviceType: tripOffer.serviceType,
    tripCategory: tripOffer.tripCategory,
    timeout,
    timestamp,
  });
  console.log("[formatSocketDataToTripOffer] Mapped values:", {
    rideType,
    carType,
    hasPackage,
    hasSpecialRequirements,
    expirationTime: new Date(expirationTime).toISOString(),
  });

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
    fare: fare,
    biddable: tripOffer.biddable,
    type: offerType,

    // Comprehensive ride details (use server values when provided for dynamic miles/times)
    rideDetails: {
      id: tripOffer.tripId,
      rideType: rideType,
      peopleCount: DEFAULT_VALUES.peopleCount,
      rating: DEFAULT_VALUES.rating,
      hasSpecialRequirements: hasSpecialRequirements,
      hasPackage: hasPackage,
      pickupTime: tripOffer.pickupTime ?? DEFAULT_VALUES.pickupTime,
      pickupDistance: tripOffer.pickupDistance ?? DEFAULT_VALUES.pickupDistance,
      pickupAddress,
      dropoffTime: tripOffer.dropoffTime ?? DEFAULT_VALUES.dropoffTime,
      dropoffDistance: tripOffer.dropoffDistance ?? DEFAULT_VALUES.dropoffDistance,
      dropoffAddress,
      rideTime: tripOffer.rideTime ?? DEFAULT_VALUES.rideTime,
      rideDistance: tripOffer.rideDistance ?? DEFAULT_VALUES.rideDistance,
      totalPrice: fare,
      driverEarn,
      carType: carType,
      created_at: tripOffer.timestamp
        ? new Date(tripOffer.timestamp).toISOString()
        : new Date().toISOString(),
      driverInstructions: DEFAULT_VALUES.driverInstructions,
      expiredAt: new Date(expirationTime).toISOString(), // Use actual timeout from server
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
      customerId: formattedTripOffer.customerId,
      pickup: formattedTripOffer.pickup,
      dropoff: formattedTripOffer.dropoff,
      biddable: formattedTripOffer.biddable,
      type: formattedTripOffer.type,
      fare: formattedTripOffer.fare,
      timestamp: serverData.tripOffer.timestamp || Date.now(),
      for: (serverData.tripOffer.for || "io") as "io" | "hired",
      tripType: serverData.tripOffer.tripType,
      tripCategory: serverData.tripOffer.tripCategory,
      serviceType: serverData.tripOffer.serviceType,
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
    carType: formattedTripOffer.rideDetails.carType, // Include carType from mapped serviceType

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
    expiredAt: formattedTripOffer.rideDetails.expiredAt,
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
      customerId: formattedTripOffer.customerId,
      pickup: formattedTripOffer.pickup,
      dropoff: formattedTripOffer.dropoff,
      biddable: formattedTripOffer.biddable,
      type: formattedTripOffer.type,
      fare: formattedTripOffer.fare,
      timestamp: serverData.tripOffer.timestamp || Date.now(),
      for: (serverData.tripOffer.for || "io") as "io" | "hired",
      tripType: serverData.tripOffer.tripType,
      tripCategory: serverData.tripOffer.tripCategory,
      serviceType: serverData.tripOffer.serviceType,
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
    carType: formattedTripOffer.rideDetails.carType, // Include carType from mapped serviceType

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
    expiredAt: formattedTripOffer.rideDetails.expiredAt,
  };
}
