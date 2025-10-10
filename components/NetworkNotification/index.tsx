import { useNetwork } from "@/context/NetworkContext";
import { logger } from "@/utils/helpers";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const NetworkNotification: React.FC = () => {
  const log = logger();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const {
    showNetworkWarning,
    networkQuality,
    connectionType,
    hideNetworkWarning,
    getRecommendedAction,
    getConnectionTypeDisplay,
  } = useNetwork();

  // Animation and auto-hide logic
  useEffect(() => {
    if (showNetworkWarning) {
      log(
        "[NetworkNotification] Showing network warning for quality:",
        networkQuality
      );

      // Slide down and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide up and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [
    showNetworkWarning,
    slideAnim,
    fadeAnim,
    hideNetworkWarning,
    networkQuality,
    log,
  ]);

  if (!showNetworkWarning) return null;

  // Get notification content based on network quality
  const getNotificationContent = () => {
    switch (networkQuality) {
      case "offline":
        return {
          title: "No Internet Connection",
          message: "Please check your internet connection and try again.",
          backgroundColor: "#DC2626", // Red
        };
      case "critical":
        return {
          title: "Poor Connection",
          message:
            "Your internet connection is very weak. Some features may not work properly.",
          backgroundColor: "#DC2626", // Red
        };
      case "slow":
        return {
          title: "Slow Connection",
          message:
            "Your internet connection is slow. Some features may work slowly.",
          backgroundColor: "#F59E0B", // Amber
        };
      default:
        return {
          title: "Network Issue",
          message: "There's an issue with your internet connection.",
          backgroundColor: "#DC2626", // Red
        };
    }
  };

  const content = getNotificationContent();
  const recommendedAction = getRecommendedAction();
  const connectionTypeDisplay = getConnectionTypeDisplay();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top,
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <View
        style={[styles.banner, { backgroundColor: content.backgroundColor }]}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Image
              source={require("../../assets/images/no-internet.png")}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.message}>{content.message}</Text>
            {/* <Text style={styles.connectionInfo}>
              {connectionTypeDisplay} • {recommendedAction}
            </Text> */}
          </View>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={hideNetworkWarning}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: "white",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: "white",
    opacity: 0.9,
    marginBottom: 2,
  },
  connectionInfo: {
    fontSize: 12,
    color: "white",
    opacity: 0.8,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  dismissText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
});

export default NetworkNotification;
