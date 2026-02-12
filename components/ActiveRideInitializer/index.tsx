/**
 * Active Ride Initializer Component (Expo/React Native)
 *
 * Caller: Active job screen and other components that need to check for active rides
 * Purpose: Check for active rides and redirect or show appropriate UI
 * Input/Output:
 *   - Input: None (uses auth context to get driver ID)
 *   - Output: Redirects to active-ride screen with data or shows no active ride UI
 * Description: Calls the active trip API to check if there's an active ride for the driver.
 *             If successful, redirects to active-ride screen with the activeTrip data.
 *             If 404 error, shows appropriate UI for no active ride.
 *             Handles loading states and error scenarios properly.
 * Expected Outcome: Seamless user experience with proper routing based on ride status.
 */

import { textColors } from "@/constants/colors";
import { ACTIVE_TRIP_ROUTES } from "@/constants/endpoints";
import { API_CLIENT_TYPES } from "@/constants/global";
import { ACTIVE_RIDE_INITIALIZER_CONTENT_KEYS } from "@/content/components/active-ride-initializer-keys";
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { useFetch } from "@/hooks/useFetch";
import { useGetContent } from "@/hooks/useGetContent";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Types
interface ActiveTripData {
  retrievalId: string;
  tripId?: string;
  activeTrip: any; // Define proper type based on your backend response
}

interface RetrievalIdResponse {
  retrievalId: string;
  tripId?: string;
  activeTrip: any;
}

export default function ActiveRideInitializer() {
  const { getContent } = useGetContent();

  const {
    loadingChecking,
    loadingDefault,
    timeoutTitle,
    timeoutMessage,
    noRideTitle,
    noRideMessage,
    noRideSubMessage,
    errorTitle,
    errorMessage,
    authRequiredTitle,
    authRequiredMessage,
    actionRetry,
  } = useMemo(() => {
    const get = getContent;
    return {
      loadingChecking: get(
        ACTIVE_RIDE_INITIALIZER_CONTENT_KEYS.LOADING_CHECKING,
      ),
      loadingDefault: get(ACTIVE_RIDE_INITIALIZER_CONTENT_KEYS.LOADING_DEFAULT),
      timeoutTitle: get(ACTIVE_RIDE_INITIALIZER_CONTENT_KEYS.TIMEOUT_TITLE),
      timeoutMessage: get(ACTIVE_RIDE_INITIALIZER_CONTENT_KEYS.TIMEOUT_MESSAGE),
      noRideTitle: get(ACTIVE_RIDE_INITIALIZER_CONTENT_KEYS.NO_RIDE_TITLE),
      noRideMessage: get(ACTIVE_RIDE_INITIALIZER_CONTENT_KEYS.NO_RIDE_MESSAGE),
      noRideSubMessage: get(
        ACTIVE_RIDE_INITIALIZER_CONTENT_KEYS.NO_RIDE_SUB_MESSAGE,
      ),
      errorTitle: get(ACTIVE_RIDE_INITIALIZER_CONTENT_KEYS.ERROR_TITLE),
      errorMessage: get(ACTIVE_RIDE_INITIALIZER_CONTENT_KEYS.ERROR_MESSAGE),
      authRequiredTitle: get(
        ACTIVE_RIDE_INITIALIZER_CONTENT_KEYS.AUTH_REQUIRED_TITLE,
      ),
      authRequiredMessage: get(
        ACTIVE_RIDE_INITIALIZER_CONTENT_KEYS.AUTH_REQUIRED_MESSAGE,
      ),
      actionRetry: get(ACTIVE_RIDE_INITIALIZER_CONTENT_KEYS.ACTION_RETRY),
    };
  }, [getContent]);

  const [auth] = useAuth();
  const driverId = auth?.user?.id;
  const [retryCount, setRetryCount] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const { setRetrievalId, removeRetrievalId, setTripId, removeTripId } =
    useDriver();

  // Ref to prevent multiple redirects
  const hasRedirectedRef = useRef(false);

  // Call the API to check for active ride
  const { data, loading, error, execute } = useFetch<RetrievalIdResponse>(
    driverId ? `${ACTIVE_TRIP_ROUTES.RETRIEVAL_ID}/${driverId}` : "",
    API_CLIENT_TYPES.ACTIVE_TRIP,
  );

  useEffect(() => {
    if (driverId) {
      // Reset redirect ref when driverId changes
      hasRedirectedRef.current = false;
      setHasTimedOut(false);
      execute();
    }
    // Intentionally exclude `execute` to avoid refetch loops if it's unstable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  // Timeout effect to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setHasTimedOut(true);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    // Reset redirect ref and timeout state on retry
    hasRedirectedRef.current = false;
    setHasTimedOut(false);
    if (driverId) {
      execute();
    }
  };

  useEffect(() => {
    if (data && !loading && !hasRedirectedRef.current) {
      // Success: We have an active ride, save retrieval ID and trip ID, then redirect
      hasRedirectedRef.current = true;

      const handleSuccess = async () => {
        try {
          // Save retrieval ID to context and AsyncStorage
          await setRetrievalId(data.retrievalId);

          // Save trip ID if provided
          if (data.tripId) {
            await setTripId(data.tripId);
          }

          // Redirect to active-ride screen with data
          router.replace({
            pathname: "/(screens)/active-ride",
            params: {
              activeTripData: JSON.stringify(data),
            },
          });
        } catch (error) {
          console.error("Error saving retrieval ID and trip ID:", error);
          // Still redirect even if saving fails
          router.replace({
            pathname: "/(screens)/active-ride",
            params: {
              activeTripData: JSON.stringify(data),
            },
          });
        }
      };

      handleSuccess();
    }
    // Remove setRetrievalId and setTripId from dependencies to prevent infinite loop
    // These functions are stable and don't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loading]);

  // Ensure hook order is stable: handle 404/no-active-ride cleanup in a top-level effect
  const hasCleanedNoActiveRideRef = useRef(false);
  useEffect(() => {
    if (!error) {
      hasCleanedNoActiveRideRef.current = false;
      return;
    }
    if (hasCleanedNoActiveRideRef.current) return;

    const isNoActiveRide =
      error.includes("not found") ||
      error.includes("404") ||
      error.includes("Resource not found") ||
      error.includes("Active trip resource not found");

    if (!isNoActiveRide) return;

    hasCleanedNoActiveRideRef.current = true;
    const cleanupIds = async () => {
      try {
        await removeRetrievalId();
        await removeTripId();
      } catch (cleanupError) {
        console.error("Error removing retrieval ID and trip ID:", cleanupError);
      }
    };
    cleanupIds();
    // Remove removeRetrievalId and removeTripId from dependencies to prevent infinite loop
    // These functions are stable and don't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  // Loading state
  if (loading && !hasTimedOut) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={textColors.teal700} />
        <Text style={styles.loadingText}>{loadingChecking}</Text>
      </View>
    );
  }

  // Timeout state
  if (hasTimedOut && loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{timeoutTitle}</Text>
        <Text style={styles.message}>{timeoutMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>{actionRetry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Error handling
  if (error) {
    // Check if it's a 404 error (no active ride)
    if (
      error.includes("not found") ||
      error.includes("404") ||
      error.includes("Resource not found") ||
      error.includes("Active trip resource not found")
    ) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>{noRideTitle}</Text>
          <Text style={styles.message}>{noRideMessage}</Text>
          <Text style={styles.subMessage}>{noRideSubMessage}</Text>
        </View>
      );
    }

    // Other errors
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{errorTitle}</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <Text style={styles.errorDetails}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>{actionRetry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No driver ID
  if (!driverId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{authRequiredTitle}</Text>
        <Text style={styles.message}>{authRequiredMessage}</Text>
      </View>
    );
  }

  // Default state (should not reach here normally)
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={textColors.teal700} />
      <Text style={styles.loadingText}>{loadingDefault}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: textColors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: textColors.black,
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: textColors.grey600,
    marginBottom: 8,
    textAlign: "center",
  },
  subMessage: {
    fontSize: 14,
    color: textColors.grey800,
    textAlign: "center",
  },
  loadingText: {
    fontSize: 16,
    color: textColors.grey600,
    marginTop: 16,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: textColors.red600,
    marginBottom: 8,
    textAlign: "center",
  },
  errorDetails: {
    fontSize: 14,
    color: textColors.grey800,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: textColors.teal700,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: textColors.white,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
