import Header from "@/components/Header";
import HeatMap from "@/components/HeatMap";
import MapLoading from "@/components/MapLoading";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { HEATMAP_ENDPOINTS } from "@/constants/endpoints";
import { HEATMAP_REFRESH_INTERVAL_MS, API_CLIENT_TYPES } from "@/constants/global";
import { usePost } from "@/hooks/usePost";
import { buildRequest } from "@/utils/requestBuilder";
import { calculateETA, getCurrentLocation, logger } from "@/utils/helpers";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
  success?: boolean;
  data?: {
    jHeader?: {
      responseCode?: string | number;
      message?: string;
    };
    jData?: {
      contents?: any; // Heatmap coordinates data from database
    };
  };
  jHeader?: {
    responseCode?: string | number;
    message?: string;
  };
  jData?: {
    contents?: any; // Heatmap coordinates data from database
  };
  message?: string;
}

// Define expected structure from database contents
interface HeatmapCoordinate {
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lng?: number | string;
  weight?: number | string;
  demandLevel?: "high" | "medium" | "low" | string;
  demand_level?: "high" | "medium" | "low" | string;
  [key: string]: any; // Allow other fields
}

export default function HeatMapScreen() {
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
  const { execute: fetchHeatmapApi, loading: apiLoading } = usePost<HeatmapDbResponse>(
    HEATMAP_ENDPOINTS.getHeatmapCoordinates,
    API_CLIENT_TYPES.SETTINGS
  );

  // Dummy heatmap data for now - will be replaced with real API call
  const dummyHeatmapData: HeatmapDataPoint[] = [
    {
      // JFK Airport - High demand
      lat: 40.6413,
      lng: -73.7781,
      weight: 0.9,
      demandLevel: "high",
    },
    {
      // LaGuardia Airport - Medium demand
      lat: 40.7769,
      lng: -73.8740,
      weight: 0.7,
      demandLevel: "medium",
    },
    {
      // Manhattan - Low demand
      lat: 40.7831,
      lng: -73.9712,
      weight: 0.3,
      demandLevel: "low",
    },
  ];

  /**
   * Transform database response to heatmap data points
   */
  const transformDbResponseToHeatmapData = (
    contents: any,
    currentUserLocation: { latitude: number; longitude: number } | null
  ): HeatmapDataPoint[] => {
    if (!contents) {
      return [];
    }

    // Handle different possible response structures
    let coordinates: HeatmapCoordinate[] = [];

    // If contents is an array
    if (Array.isArray(contents)) {
      coordinates = contents;
    }
    // If contents is an object with a data/coordinates/points array
    else if (contents.data && Array.isArray(contents.data)) {
      coordinates = contents.data;
    } else if (contents.coordinates && Array.isArray(contents.coordinates)) {
      coordinates = contents.coordinates;
    } else if (contents.points && Array.isArray(contents.points)) {
      coordinates = contents.points;
    }
    // If contents is an object with coordinate properties
    else if (typeof contents === "object") {
      // Try to extract coordinates from object structure
      const keys = Object.keys(contents);
      if (keys.length > 0) {
        // Check if first value is an array
        const firstValue = contents[keys[0]];
        if (Array.isArray(firstValue)) {
          coordinates = firstValue;
        } else {
          // Single coordinate object
          coordinates = [contents];
        }
      }
    }

    // Transform coordinates to HeatmapDataPoint format
    const heatmapPoints: HeatmapDataPoint[] = coordinates
      .map((coord: HeatmapCoordinate): HeatmapDataPoint | null => {
        // Extract latitude and longitude (handle different field names)
        const lat =
          coord.lat !== undefined
            ? Number(coord.lat)
            : coord.latitude !== undefined
            ? Number(coord.latitude)
            : null;
        const lng =
          coord.lng !== undefined
            ? Number(coord.lng)
            : coord.longitude !== undefined
            ? Number(coord.longitude)
            : null;

        // Skip if coordinates are invalid
        if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
          return null;
        }

        // Extract weight (demand intensity)
        const weight =
          coord.weight !== undefined
            ? Number(coord.weight)
            : coord.demandLevel === "high" || coord.demand_level === "high"
            ? 0.9
            : coord.demandLevel === "medium" || coord.demand_level === "medium"
            ? 0.7
            : coord.demandLevel === "low" || coord.demand_level === "low"
            ? 0.3
            : 0.5; // Default weight

        // Extract demand level
        const demandLevel =
          coord.demandLevel || coord.demand_level || "medium";

        // Calculate ETA if user location is available
        let eta: string | undefined;
        if (currentUserLocation) {
          eta = calculateETA(
            currentUserLocation,
            { lat, lng },
            demandLevel as "high" | "medium" | "low"
          );
        }

        return {
          lat,
          lng,
          weight: Math.max(0, Math.min(1, weight)), // Clamp between 0 and 1
          eta,
          demandLevel: demandLevel as "high" | "medium" | "low",
        };
      })
      .filter((point): point is HeatmapDataPoint => point !== null);

    return heatmapPoints;
  };

  // Fetch heatmap data from API
  const fetchHeatmapData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user location first
      let currentUserLocation = userLocation;
      if (!currentUserLocation) {
        try {
          const location = await getCurrentLocation();
          currentUserLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
          };
          setUserLocation(currentUserLocation);
        } catch (locationError) {
          log("Could not get user location:", locationError);
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
        }
      );

      log("[HeatMapScreen] Fetching heatmap data from API...");

      // Call the API
      const response = await fetchHeatmapApi(requestBody);

      // The usePost hook extracts response.data.data or response.data
      // So response here is the DB response object: { jHeader, jData: { contents } }
      // OR it could be wrapped: { success: true, data: { jHeader, jData: { contents } } }
      
      // Handle both response structures
      const dbResponse = (response as any)?.data || response;
      const responseCode =
        dbResponse?.jHeader?.responseCode ?? response?.jHeader?.responseCode;
      const isSuccess =
        responseCode === "0" || responseCode === 0 || responseCode === undefined;

      if (!isSuccess) {
        const errorMessage =
          dbResponse?.jHeader?.message ||
          response?.jHeader?.message ||
          (response as any)?.message ||
          "Failed to load heatmap data";
        throw new Error(errorMessage);
      }

      // Extract contents from response
      const contents =
        dbResponse?.jData?.contents || response?.jData?.contents;

      // Transform database response to heatmap data points
      let processedData = transformDbResponseToHeatmapData(
        contents,
        currentUserLocation
      );

      // If no data from API, fallback to dummy data
      if (processedData.length === 0) {
        log("[HeatMapScreen] No data from API, using dummy data");
        processedData = dummyHeatmapData;
        if (currentUserLocation) {
          processedData = processedData.map((point) => ({
            ...point,
            eta: calculateETA(
              currentUserLocation!,
              { lat: point.lat, lng: point.lng },
              point.demandLevel
            ),
          }));
        }
      }

      setHeatmapData(processedData);
      log(
        "[HeatMapScreen] Heatmap data loaded:",
        processedData.length,
        "points"
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      log("[HeatMapScreen] Error fetching heatmap data:", errorMessage);

      // Fallback to dummy data in case of error
      let fallbackData = dummyHeatmapData;
      if (userLocation) {
        fallbackData = fallbackData.map((point) => ({
          ...point,
          eta: calculateETA(
            userLocation,
            { lat: point.lat, lng: point.lng },
            point.demandLevel
          ),
        }));
      }
      setHeatmapData(fallbackData);
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
    }, []) // Empty dependency array - fetch fresh data on every focus
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
        <Header title="Heat Map" onBackPress={handleGoBack} />
        <MapLoading isLoading={isLoading || apiLoading} />
      </SafeAreaView>
    );
  }

  if (error && heatmapData.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Heat Map" onBackPress={handleGoBack} />
        <View style={styles.errorContainer}>
          <Typography type="bodyLarge" style={styles.errorText}>
            {error}
          </Typography>
          <Typography type="bodyMedium" style={styles.errorSubtext}>
            Please check your connection and try again.
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Heat Map" onBackPress={handleGoBack} />
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
      </View>
      {error && (
        <View style={styles.errorBanner}>
          <Typography type="bodySmall" style={styles.bannerText}>
            ⚠️ Using cached data - connection issues detected
          </Typography>
        </View>
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: textColors.grey100,
  },
  errorText: {
    color: textColors.red600,
    textAlign: "center",
    marginBottom: 8,
  },
  errorSubtext: {
    color: textColors.grey600,
    textAlign: "center",
  },
  errorBanner: {
    backgroundColor: textColors.yellow100,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: textColors.yellow200,
  },
  bannerText: {
    color: textColors.yellow800,
    textAlign: "center",
  },
});
