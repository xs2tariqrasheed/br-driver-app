import { extractZipCodeFromAddress } from "@/utils/helpers";

export type PlacePrediction = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export type PlaceDetailsResult = {
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  postalCode: string | null;
};

type AutocompleteResponse = {
  predictions?: Array<{
    description: string;
    place_id: string;
    structured_formatting?: {
      main_text: string;
      secondary_text?: string;
    };
  }>;
  status: string;
  error_message?: string;
};

type DetailsResponse = {
  result?: {
    place_id: string;
    formatted_address: string;
    geometry?: { location?: { lat: number; lng: number } };
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  };
  status: string;
  error_message?: string;
};

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

function postalCodeFromComponents(
  components?: AddressComponent[],
): string | null {
  if (!components?.length) return null;
  const pc = components.find((c) => c.types?.includes("postal_code"));
  return pc?.long_name ?? pc?.short_name ?? null;
}

/**
 * Google Places Autocomplete (legacy JSON API).
 * Ensure "Places API" is enabled for the API key.
 */
export async function fetchPlacePredictions(
  input: string,
  apiKey: string,
): Promise<PlacePrediction[]> {
  const q = input.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    input: q,
    key: apiKey,
  });

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
  const res = await fetch(url);
  const data = (await res.json()) as AutocompleteResponse;

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || `Places Autocomplete: ${data.status}`);
  }

  const list = data.predictions ?? [];
  return list.map((p) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting?.main_text ?? p.description,
    secondaryText: p.structured_formatting?.secondary_text ?? "",
  }));
}

/**
 * Place Details for lat/lng, formatted address, postal code, and canonical place_id.
 */
export async function fetchPlaceDetails(
  placeId: string,
  apiKey: string,
): Promise<PlaceDetailsResult> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: "place_id,formatted_address,geometry,address_components",
    key: apiKey,
  });

  const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
  const res = await fetch(url);
  const data = (await res.json()) as DetailsResponse;

  if (data.status !== "OK" || !data.result) {
    throw new Error(
      data.error_message || `Place Details: ${data.status ?? "UNKNOWN"}`,
    );
  }

  const r = data.result;
  const lat = r.geometry?.location?.lat;
  const lng = r.geometry?.location?.lng;
  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new Error("Place Details missing geometry");
  }

  let postalCode = postalCodeFromComponents(r.address_components);
  if (!postalCode) {
    postalCode = extractZipCodeFromAddress(r.formatted_address) || null;
  }

  return {
    placeId: r.place_id,
    formattedAddress: r.formatted_address,
    latitude: lat,
    longitude: lng,
    postalCode,
  };
}
