/**
 * Client-side copy of server offer-eligibility rules (keep in sync with libs/global-types driver-offer-eligibility).
 */
import { CAR_TYPE, type CarType } from "@/constants/global";

export type RideTypePrefsClient = {
  economy: boolean;
  sedan: boolean;
  suv: boolean;
  luxury: boolean;
};

type Tier = "economy" | "sedan" | "suv" | "luxury";

function tripServiceTypeToTier(
  serviceType: string | undefined,
): Tier | null {
  if (!serviceType || typeof serviceType !== "string") return null;
  const u = serviceType.toUpperCase().trim();
  if (u === "ECONOMY_LITE" || u === "ECONOMY") return "economy";
  if (u === "SEDAN") return "sedan";
  if (u === "SUV") return "suv";
  if (u === "LUXURY") return "luxury";
  return null;
}

function vehicleClassToTier(vehicleClass: string | undefined): Tier | null {
  if (!vehicleClass || typeof vehicleClass !== "string") return null;
  const u = vehicleClass.toUpperCase().trim();
  if (u === "ECONOMY_LITE" || u === "ECONOMY") return "economy";
  if (u === "SEDAN") return "sedan";
  if (u === "SUV") return "suv";
  if (u === "LUXURY") return "luxury";
  return null;
}

/** Map driver app CAR_TYPE to backend vehicleServiceClass enum. */
export function carTypeToVehicleServiceClass(
  carType: string | undefined | null,
): string | undefined {
  if (!carType) return undefined;
  const v = String(carType).toLowerCase().trim();
  if (v === CAR_TYPE.ECONOMY) return "ECONOMY";
  if (v === CAR_TYPE.SEDAN) return "SEDAN";
  if (v === CAR_TYPE.SUV) return "SUV";
  if (v === CAR_TYPE.LUXURY) return "LUXURY";
  return undefined;
}

export function isDriverEligibleForTripOffer(
  tripServiceType: string | undefined,
  vehicleServiceClass: string | undefined,
  rideTypePrefs: RideTypePrefsClient | null | undefined,
): boolean {
  if (!vehicleServiceClass && !rideTypePrefs) return true;
  const tripTier = tripServiceTypeToTier(tripServiceType);
  if (tripTier == null) return true;
  const vehTier = vehicleClassToTier(vehicleServiceClass);
  if (vehTier != null && tripTier !== vehTier) return false;
  if (rideTypePrefs && rideTypePrefs[tripTier] === false) return false;
  return true;
}

export function buildRideTypePrefsFromSettings(rideTypes: {
  economy: boolean;
  sedan: boolean;
  suv: boolean;
  luxury: boolean;
}): RideTypePrefsClient {
  return {
    economy: !!rideTypes.economy,
    sedan: !!rideTypes.sedan,
    suv: !!rideTypes.suv,
    luxury: !!rideTypes.luxury,
  };
}

export type { CarType };

/** Best-effort map from auth /me user payload to app CAR_TYPE string. */
export function deriveCarTypeFromAuthUser(user: Record<string, unknown> | null | undefined): string | undefined {
  if (!user) return undefined;
  const raw =
    (user.primary_vehicle_service_type as string | undefined) ??
    (user.vehicle_service_class as string | undefined) ??
    (user.driver_vehicle_type as string | undefined) ??
    (user.vehicle_class as string | undefined) ??
    (user.vehicle_class_name as string | undefined) ??
    (user.trip_service_type as string | undefined);
  if (!raw) return undefined;
  const s = String(raw).toLowerCase();
  if (s.includes("economy")) return CAR_TYPE.ECONOMY;
  if (s.includes("sedan")) return CAR_TYPE.SEDAN;
  if (s.includes("suv")) return CAR_TYPE.SUV;
  if (s.includes("luxury")) return CAR_TYPE.LUXURY;
  return undefined;
}
