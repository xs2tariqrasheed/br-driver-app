import { textColors } from "@/constants/colors";
import { useContent } from "@/context/ContentContext";
import { useFetchContent } from "@/hooks/useFetchContent";
import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const SPLASH_DURATION_MS = 5000;

export default function Index() {
  const { content, isHydrated, error } = useContent();
  const { fetchContent } = useFetchContent();
  const [splashElapsed, setSplashElapsed] = useState(false);
  const hasContent = Object.keys(content).length > 0;

  // Always show splash for 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setSplashElapsed(true), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  // Fetch content in background as soon as hydrated
  useEffect(() => {
    if (isHydrated) {
      fetchContent();
    }
  }, [isHydrated, fetchContent]);

  const retryFetchContent = async () => {
    try {
      await fetchContent();
    } catch (err) {
      console.error("Failed to fetch content:", err);
    }
  };

  // First 5 seconds: always show splash (content fetches behind the scenes)
  if (!splashElapsed) {
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

  // After 5 seconds: redirect if we have content, otherwise show Try again
  if (hasContent) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Redirect href="/(screens)/auth/login" />
      </>
    );
  }

  // After 5 seconds with no content: show error and Retry
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Failed to Load Content</Text>
        <Text style={styles.errorMessage}>
          Unable to fetch app content. Please check your connection and try
          again.
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={retryFetchContent}
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
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
