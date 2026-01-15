import { updateBaseUrls } from "@/config/apiConfig";
import { textColors } from "@/constants/colors";
import { APP_ENDPOINTS, DRIVER_ENDPOINTS } from "@/constants/endpoints";
import { API_CLIENT_TYPES, DEPLOYED_BASE_URL_STORAGE_KEY } from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useContent } from "@/context/ContentContext";
import { useDriver } from "@/context/DriverContext";
import { useDelete } from "@/hooks/useDelete";
import { useFetch } from "@/hooks/useFetch";
import { getStorageItem, logger } from "@/utils/helpers";
import { Redirect, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const log = logger();
  const [auth] = useAuth();
  const [driver, setDriver] = useDriver();
  const [, setContent] = useContent();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [baseUrlChecked, setBaseUrlChecked] = useState(false);
  const [hasBaseUrl, setHasBaseUrl] = useState(false);

  // Check for base URL on mount and update API clients
  useEffect(() => {
    (async () => {
      try {
        const baseUrl = await getStorageItem(DEPLOYED_BASE_URL_STORAGE_KEY);
        if (baseUrl) {
          // Update all API clients with the stored base URL
          updateBaseUrls(baseUrl);
          setHasBaseUrl(true);
        }
      } catch (e) {
        console.error("Error checking base URL in Index:", e);
      } finally {
        setBaseUrlChecked(true);
      }
    })();
  }, []);

  const { data, loading, error, execute } = useFetch(
    APP_ENDPOINTS.content,
    API_CLIENT_TYPES.SETTINGS
  );
  const offlineCalledRef = useRef(false); // Track if offline API was already called

  // Offline API using shared delete hook
  const { execute: markDriverOffline } = useDelete(
    DRIVER_ENDPOINTS.markOffline(auth?.user?.id || "")
  );

  const fetchContent = async () => {
    try {
      offlineCalledRef.current = false; // Reset offline flag when retrying
      await execute();
    } catch (err) {
      // Error is already handled by the hook
      console.error("Failed to fetch content:", err);
    }
  };

  useEffect(() => {
    // If we have a base URL, we can redirect to login immediately
    // If not, the conditional redirect to base-url-setup will handle it below
    if (baseUrlChecked && hasBaseUrl) {
      setShouldRedirect(true);
    }
  }, [baseUrlChecked, hasBaseUrl]);

  // useEffect(() => {
  //   // Store content in context when data is available
  //   if (data && !error) {
  //     log("[Index] Content fetched successfully", data);
  //     // setContent(data);
  //     setShouldRedirect(true);
  //   }
  // }, [data, error, setContent, log]);

  // Call offline API when content fetch fails (only once)
  // useEffect(() => {
  //   const handleOffline = async () => {
  //     if (error && auth?.user?.id && !offlineCalledRef.current) {
  //       offlineCalledRef.current = true; // Mark as called to prevent infinite loop

  //       log("[Index] Content fetch failed, marking driver as offline");

  //       // Update driver context to offline FIRST (before API call)
  //       // This ensures driver is marked offline even if API call fails
  //       await setDriver({
  //         ...(driver ?? {}),
  //         online: false,
  //       });

  //       // Then try to notify the server
  //       try {
  //         await markDriverOffline();
  //         log("[Index] Driver successfully marked as offline on server");
  //       } catch (offlineError) {
  //         log(
  //           "[Index] Failed to notify server of offline status (driver is still offline locally):",
  //           offlineError
  //         );
  //         // Driver is already offline locally, so this failure is not critical
  //       }
  //     }
  //   };

  //   handleOffline();
  // }, [error, auth?.user?.id, markDriverOffline, driver, setDriver, log]);

  // Show loading state while checking URL or fetching
  if (!baseUrlChecked || (hasBaseUrl && loading && !shouldRedirect)) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Image
          source={require("../assets/images/splash-logo.gif")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Show error state if content fetch failed
  if (error) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Failed to Load Content</Text>
          <Text style={styles.errorMessage}>
            {error ||
              "Unable to fetch app content. Please check your connection and try again."}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchContent}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Redirect to base URL setup if missing
  if (baseUrlChecked && !hasBaseUrl) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Redirect href="/(screens)/base-url-setup" />
      </>
    );
  }

  // Redirect to login only after successful content fetch
  if (shouldRedirect) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Redirect href="/(screens)/auth/login" />
      </>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: textColors.white,
  },
  logo: {
    width: 200,
    height: 200,
  },
  errorContainer: {
    marginTop: 30,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: textColors.red600,
    marginBottom: 10,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    color: textColors.grey600,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: textColors.teal700,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: textColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
