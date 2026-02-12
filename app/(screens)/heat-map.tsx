import Header from "@/components/Header";
import HeatMap from "@/components/HeatMap";
import MapLoading from "@/components/MapLoading";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { HEATMAP_ENDPOINTS } from "@/constants/endpoints";
import {
  API_CLIENT_TYPES,
  HEATMAP_DEMAND_WEIGHTS,
  HEATMAP_REFRESH_INTERVAL_MS,
} from "@/constants/global";
import { HEATMAP_CONTENT_KEYS } from "@/content/heat-map-keys";
import { useGetContent } from "@/hooks/useGetContent";
import { usePost } from "@/hooks/usePost";
import { calculateETA, getCurrentLocation, logger } from "@/utils/helpers";
import { buildRequest } from "@/utils/requestBuilder";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";

// Define the structure of heatmap data point
export interface HeatmapDataPoint {
  lat: number;
  lng: number;
  weight: number;
  eta?: string; // ETA string like "3 mins", "5 mins"
  demandLevel?: "high" | "medium" | "low";
}

// Define the API response structure from DB action
interface HeatmapDbResponse {
  data?: {
    jHeader?: {
      responseCode?: string | number;
      message?: string;
    };
    jData?: {
      heatmapCoordinates?: HeatmapCoordinate[];
    };
  };
  jHeader?: {
    responseCode?: string | number;
    message?: string;
  };
  jData?: {
    heatmapCoordinates?: HeatmapCoordinate[];
  };
  message?: string;
}

interface HeatmapCoordinate {
  lat?: number;
  lng?: number;
  demandLevel?: "high" | "medium" | "low" | string;
  [key: string]: any; // Allow other fields
}

export default function HeatMapScreen() {
  // Page Content Start
  const { getContent } = useGetContent();
  const {
    headerTitle,
    emptyMessage,
    emptyOverlay,
    errorUnknown,
    errorLoadFailed,
  } = useMemo(() => {
    const get = getContent;
    return {
      headerTitle: get(HEATMAP_CONTENT_KEYS.HEADER_TITLE),
      emptyMessage: get(HEATMAP_CONTENT_KEYS.EMPTY_MESSAGE),
      emptyOverlay: get(HEATMAP_CONTENT_KEYS.EMPTY_OVERLAY),
      errorUnknown: get(HEATMAP_CONTENT_KEYS.ERROR_UNKNOWN),
      errorLoadFailed: get(HEATMAP_CONTENT_KEYS.ERROR_LOAD_FAILED),
    };
  }, [getContent]);
  // Page Content End

  const router = useRouter();
  const log = logger();

  // State for heatmap data
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // API hook for fetching heatmap data
  const { execute: fetchHeatmapApi, loading: apiLoading } =
    usePost<HeatmapDbResponse>(
      HEATMAP_ENDPOINTS.getHeatmapCoordinates,
      API_CLIENT_TYPES.SETTINGS,
    );

  // Fetch heatmap data from API
  const fetchHeatmapData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user location first
      let currentUserLocation = userLocation;
      if (!currentUserLocation) {
        try {
          // Always provide a fallback so ETA labels can still render
          // (matching HeatMap component behavior)
          const fallbackRegion = {
            latitude: 40.7128,
            longitude: -74.006,
            latitudeDelta: 0.3,
            longitudeDelta: 0.3,
          };
          const location = await getCurrentLocation(fallbackRegion);
          currentUserLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
          };
          setUserLocation(currentUserLocation);
        } catch (locationError) {
          console.log("Could not get user location:", locationError);
          // Fallback to default coordinates for ETA calculation
          currentUserLocation = { latitude: 40.7128, longitude: -74.006 };
          setUserLocation(currentUserLocation);
        }
      }

      // Build DB action request
      const actionCode = "CMN.S.HEATMAP_COORDINATES";
      const requestBody = await buildRequest(
        actionCode,
        {
          P_ACTION_CODE: actionCode,
          P_APP_NAME: "DriverApp-IOS",
        },
        {
          source: "NativeApp",
          includeGPS: true,
          includeActionCode: true, // Include P_ACTION_CODE for db-action endpoint
        },
      );

      log("[HeatMapScreen] Fetching heatmap data from API...");

      // Call the API
      const response = await fetchHeatmapApi(requestBody);

      // `usePost` returns `response.data.data ?? response.data`, so `response` is usually the DB response:
      // { jHeader, jData: { heatmapCoordinates } }
      const dbResponse = (response as any)?.jData
        ? (response as any)
        : (response as any)?.data;

      const responseCode = dbResponse?.jHeader?.responseCode;
      const isSuccess =
        responseCode === "0" ||
        responseCode === 0 ||
        responseCode === undefined;
      if (!isSuccess) {
        throw new Error(dbResponse?.jHeader?.message || errorLoadFailed);
      }

      const coords: HeatmapCoordinate[] =
        dbResponse?.jData?.heatmapCoordinates ?? [];

      if (!Array.isArray(coords) || coords.length === 0) {
        setHeatmapData([]);
        setError(emptyMessage);
        return;
      }

      // De-duplicate points by lat/lng (DB may return multiple entries at same coords with different demandLevel),
      // and keep the highest demand for that coordinate to avoid color/weight overlap.
      const demandRank = (d: "high" | "medium" | "low") =>
        d === "high" ? 3 : d === "medium" ? 2 : 1;

      const bestByCoord = new Map<
        string,
        { lat: number; lng: number; demandLevel: "high" | "medium" | "low" }
      >();

      for (const coord of coords) {
        const lat = coord?.lat;
        const lng = coord?.lng;
        if (typeof lat !== "number" || typeof lng !== "number") continue;

        const levelRaw = (coord?.demandLevel ?? "medium")
          .toString()
          .toUpperCase();
        const demandLevel: "high" | "medium" | "low" =
          levelRaw === "HIGH"
            ? "high"
            : levelRaw === "MEDIUM"
              ? "medium"
              : levelRaw === "LOW"
                ? "low"
                : "medium";

        const key = `${lat.toFixed(5)}|${lng.toFixed(5)}`;
        const existing = bestByCoord.get(key);
        if (
          !existing ||
          demandRank(demandLevel) > demandRank(existing.demandLevel)
        ) {
          bestByCoord.set(key, { lat, lng, demandLevel });
        }
      }

      const processedData: HeatmapDataPoint[] = Array.from(
        bestByCoord.values(),
      ).map(({ lat, lng, demandLevel }) => {
        const weight: number =
          demandLevel === "high"
            ? HEATMAP_DEMAND_WEIGHTS.HIGH
            : demandLevel === "medium"
              ? HEATMAP_DEMAND_WEIGHTS.MEDIUM
              : demandLevel === "low"
                ? HEATMAP_DEMAND_WEIGHTS.LOW
                : HEATMAP_DEMAND_WEIGHTS.DEFAULT;

        const eta = calculateETA(
          currentUserLocation!,
          { lat, lng },
          demandLevel,
        );
        return { lat, lng, weight, eta, demandLevel };
      });

      if (processedData.length === 0) {
        setHeatmapData([]);
        setError(emptyMessage);
        return;
      }

      setHeatmapData(processedData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : errorUnknown;
      log("[HeatMapScreen] Error fetching heatmap data:", errorMessage);
      setHeatmapData([]);
      setError(emptyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch fresh data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      log("[HeatMapScreen] Screen focused - fetching fresh heatmap data");
      let isActive = true;

      const loadHeatmapData = async () => {
        if (!isActive) return;
        try {
          await fetchHeatmapData();
        } catch (error) {
          if (!isActive) return;
          log("[HeatMapScreen] Error loading heatmap data on focus:", error);
        }
      };

      loadHeatmapData();

      // Cleanup function to prevent state updates if component unmounts
      return () => {
        log("[HeatMapScreen] Screen unfocused - cleanup");
        isActive = false;
      };
    }, []), // Empty dependency array - fetch fresh data on every focus
  );

  // Auto-refresh data at regular intervals while screen is focused
  useEffect(() => {
    const interval = setInterval(() => {
      log("[HeatMapScreen] Auto-refreshing heatmap data...");
      fetchHeatmapData();
    }, HEATMAP_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading || apiLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={headerTitle} onBackPress={handleGoBack} />
        <MapLoading isLoading={isLoading || apiLoading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title={headerTitle} onBackPress={handleGoBack} />
      <View style={styles.mapContainer}>
        <HeatMap
          heatmapData={heatmapData}
          onLocationSelect={(address, coordinates) => {
            log("Location selected on heatmap:", address, coordinates);
          }}
          heatmapOptions={{
            radius: 500,
            opacity: 0.7,
            showETALabels: true,
          }}
        />
        {heatmapData.length === 0 && (
          <View style={styles.emptyOverlay}>
            <Typography type="bodyMedium" style={styles.emptyOverlayText}>
              {emptyOverlay}
            </Typography>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
  },
  mapContainer: {
    flex: 1,
  },
  emptyOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: textColors.grey200,
  },
  emptyOverlayText: {
    color: textColors.grey800,
    textAlign: "center",
  },
});
