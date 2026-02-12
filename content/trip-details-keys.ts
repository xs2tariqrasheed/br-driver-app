/**
 * Content keys for Trip Details screen and JobDetails component.
 * Reuses profile key for account number to avoid duplicate labels in DB.
 */

import { PROFILE_CONTENT_KEYS } from "@/content/profile-keys";

export const TRIP_DETAILS_CONTENT_KEYS = {
  // Screen
  HEADER_TITLE: "driver-app-trip-details-header-title",
  ERROR_PREFIX_LABEL: "driver-app-trip-details-error-prefix-label",
  ACTION_RETRY_LABEL: "driver-app-trip-details-action-retry-label",
  EMPTY_STATE_LABEL: "driver-app-trip-details-empty-state-label",
  ERROR_FETCH_LABEL: "driver-app-trip-details-error-fetch-label",
  ERROR_LOAD_LABEL: "driver-app-trip-details-error-load-label",
  DEMO_INSTRUCTIONS_LABEL: "driver-app-trip-details-demo-instructions-label",

  // JobDetails section titles
  DRIVER_INSTRUCTIONS_TITLE:
    "driver-app-trip-details-driver-instructions-title",
  FARE_DETAIL_TITLE: "driver-app-trip-details-fare-detail-title",
  CUSTOMER_DETAIL_TITLE: "driver-app-trip-details-customer-detail-title",

  // Fare detail labels (order must match helper/API fareDetails)
  FARE_RIDE_PRICE_LABEL: "driver-app-trip-details-fare-ride-price-label",
  FARE_TOLLS_LABEL: "driver-app-trip-details-fare-tolls-label",
  FARE_TIPS_LABEL: "driver-app-trip-details-fare-tips-label",
  FARE_DISCOUNT_LABEL: "driver-app-trip-details-fare-discount-label",
  FARE_SERVICE_CHARGES_LABEL:
    "driver-app-trip-details-fare-service-charges-label",
  FARE_FUEL_SURCHARGE_LABEL:
    "driver-app-trip-details-fare-fuel-surcharge-label",
  FARE_NYC_CONGESTION_SURCHARGE_LABEL:
    "driver-app-trip-details-fare-nyc-congestion-surcharge-label",

  // Customer detail labels (Account reuses profile to avoid duplicate in DB)
  CUSTOMER_NAME_LABEL: "driver-app-trip-details-customer-name-label",
  CUSTOMER_CAR_TYPE_LABEL: "driver-app-trip-details-customer-car-type-label",
  CUSTOMER_OFFER_PRICE_LABEL:
    "driver-app-trip-details-customer-offer-price-label",
  CUSTOMER_ACCOUNT_LABEL: PROFILE_CONTENT_KEYS.PAYMENT_ACCOUNT_NUMBER,
  CUSTOMER_PROFILE_NO_LABEL:
    "driver-app-trip-details-customer-profile-no-label",
} as const;

/** Fare label keys in the order used by tripDetailsApiResponseToJobOffer */
export const TRIP_DETAILS_FARE_LABEL_KEYS = [
  TRIP_DETAILS_CONTENT_KEYS.FARE_RIDE_PRICE_LABEL,
  TRIP_DETAILS_CONTENT_KEYS.FARE_TOLLS_LABEL,
  TRIP_DETAILS_CONTENT_KEYS.FARE_TIPS_LABEL,
  TRIP_DETAILS_CONTENT_KEYS.FARE_DISCOUNT_LABEL,
  TRIP_DETAILS_CONTENT_KEYS.FARE_SERVICE_CHARGES_LABEL,
  TRIP_DETAILS_CONTENT_KEYS.FARE_FUEL_SURCHARGE_LABEL,
  TRIP_DETAILS_CONTENT_KEYS.FARE_NYC_CONGESTION_SURCHARGE_LABEL,
] as const;

/** Customer label keys in the order used by tripDetailsApiResponseToJobOffer */
export const TRIP_DETAILS_CUSTOMER_LABEL_KEYS = [
  TRIP_DETAILS_CONTENT_KEYS.CUSTOMER_NAME_LABEL,
  TRIP_DETAILS_CONTENT_KEYS.CUSTOMER_CAR_TYPE_LABEL,
  TRIP_DETAILS_CONTENT_KEYS.CUSTOMER_OFFER_PRICE_LABEL,
  TRIP_DETAILS_CONTENT_KEYS.CUSTOMER_ACCOUNT_LABEL,
  TRIP_DETAILS_CONTENT_KEYS.CUSTOMER_PROFILE_NO_LABEL,
] as const;
