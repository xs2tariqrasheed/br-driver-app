import Header from "@/components/Header";
import HeatMap from "@/components/HeatMap";
import MapLoading from "@/components/MapLoading";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { HEATMAP_REFRESH_INTERVAL_MS } from "@/constants/global";
import { calculateETA, getCurrentLocation, logger } from "@/utils/helpers";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";

// Define the structure of heatmap data point
export interface HeatmapDataPoint {
  lat: number;
  lng: number;
  weight: number;
  eta?: string; // ETA string like "3 mins", "5 mins"
  demandLevel?: "high" | "medium" | "low";
}

// Define the API response structure
interface HeatmapApiResponse {
  success: boolean;
  data: HeatmapDataPoint[];
  message?: string;
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

      // For now, simulate API call with dummy data
      // In real implementation, this would be:
      // const response = await fetch(URLS.heatmapData);
      // const result: HeatmapApiResponse = await response.json();

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Calculate ETAs for dummy data if user location is available
      let processedData = dummyHeatmapData;
      if (currentUserLocation) {
        processedData = dummyHeatmapData.map((point) => ({
          ...point,
          eta: calculateETA(
            currentUserLocation!,
            { lat: point.lat, lng: point.lng },
            point.demandLevel
          ),
        }));
      }

      // Use processed data
      const result: HeatmapApiResponse = {
        success: true,
        data: processedData,
        message: "Heatmap data retrieved successfully",
      };

      if (result.success && result.data) {
        setHeatmapData(result.data);
        log("Heatmap data loaded:", result.data.length, "points");
      } else {
        throw new Error(result.message || "Failed to load heatmap data");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      log("Error fetching heatmap data:", errorMessage);

      // Fallback to dummy data in case of error
      setHeatmapData(dummyHeatmapData);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchHeatmapData();
  }, []);

  // Auto-refresh data at regular intervals to simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      log("Refreshing heatmap data...");
      fetchHeatmapData();
    }, HEATMAP_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Heat Map" onBackPress={handleGoBack} />
        <MapLoading isLoading={isLoading} />
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
