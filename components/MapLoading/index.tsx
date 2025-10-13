import { textColors } from "@/constants/colors";
import { useCallback, useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

/**
 * Props for the MapLoading component
 */
interface MapLoadingProps {
  /**
   * Whether the loading animation should be visible
   */
  isLoading?: boolean;
  /**
   * Optional callback when animation starts
   */
  onAnimationStart?: () => void;
  /**
   * Optional callback when animation stops
   */
  onAnimationStop?: () => void;
}

/**
 * A reusable loading component that displays an animated location icon
 * with three concentric pulse rings creating a wave effect.
 *
 * Features:
 * - Three pulse rings with different sizes (80px, 100px, 120px)
 * - Staggered animation timing for wave effect
 * - Centered location icon from assets
 * - Black color scheme
 * - Smooth native animations
 *
 * @param props - The component props
 * @returns JSX element containing the loading animation
 */
export default function MapLoading({
  isLoading = true,
  onAnimationStart,
  onAnimationStop,
}: MapLoadingProps) {
  // Animated values for loading animation
  const mapIconScale = useRef(new Animated.Value(0.8));
  const mapIconOpacity = useRef(new Animated.Value(0));
  const pulse1Scale = useRef(new Animated.Value(1));
  const pulse1Opacity = useRef(new Animated.Value(0.6));
  const pulse2Scale = useRef(new Animated.Value(1));
  const pulse2Opacity = useRef(new Animated.Value(0.4));
  const pulse3Scale = useRef(new Animated.Value(1));
  const pulse3Opacity = useRef(new Animated.Value(0.2));

  // Icon source
  const locationIcon = require("@/assets/images/location-icon.png");

  // Loading animation effect
  useEffect(() => {
    if (isLoading) {
      startLoadingAnimation();
      onAnimationStart?.();
    } else {
      stopLoadingAnimation();
      onAnimationStop?.();
    }
  }, [isLoading, onAnimationStart, onAnimationStop]);

  /**
   * Start loading animation
   */
  const startLoadingAnimation = useCallback(() => {
    // Map icon animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(mapIconScale.current, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(mapIconOpacity.current, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(mapIconScale.current, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Multiple pulse rings animation
    const animatePulses = () => {
      const createPulseAnimation = (
        pulseScale: Animated.Value,
        pulseOpacity: Animated.Value,
        delay: number
      ) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(pulseScale, {
                toValue: 2.5,
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(pulseOpacity, {
                toValue: 0,
                duration: 1500,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(pulseScale, {
                toValue: 1,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(pulseOpacity, {
                toValue:
                  pulseOpacity === pulse1Opacity.current
                    ? 0.6
                    : pulseOpacity === pulse2Opacity.current
                    ? 0.4
                    : 0.2,
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
          ])
        );
      };

      const pulse1Anim = createPulseAnimation(
        pulse1Scale.current,
        pulse1Opacity.current,
        0
      );
      const pulse2Anim = createPulseAnimation(
        pulse2Scale.current,
        pulse2Opacity.current,
        500
      );
      const pulse3Anim = createPulseAnimation(
        pulse3Scale.current,
        pulse3Opacity.current,
        1000
      );

      Animated.parallel([pulse1Anim, pulse2Anim, pulse3Anim]).start();
    };

    animatePulses();
  }, []);

  /**
   * Stop loading animation
   */
  const stopLoadingAnimation = useCallback(() => {
    // Stop all animations
    mapIconScale.current.stopAnimation();
    mapIconOpacity.current.stopAnimation();
    pulse1Scale.current.stopAnimation();
    pulse1Opacity.current.stopAnimation();
    pulse2Scale.current.stopAnimation();
    pulse2Opacity.current.stopAnimation();
    pulse3Scale.current.stopAnimation();
    pulse3Opacity.current.stopAnimation();
  }, []);

  if (!isLoading) {
    return null;
  }

  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        {/* Multiple pulse rings */}
        <Animated.View
          style={[
            styles.pulseRing,
            styles.pulseRing1,
            {
              transform: [{ scale: pulse1Scale.current }],
              opacity: pulse1Opacity.current,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseRing,
            styles.pulseRing2,
            {
              transform: [{ scale: pulse2Scale.current }],
              opacity: pulse2Opacity.current,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseRing,
            styles.pulseRing3,
            {
              transform: [{ scale: pulse3Scale.current }],
              opacity: pulse3Opacity.current,
            },
          ]}
        />

        {/* Center location icon */}
        <Animated.View
          style={[
            styles.locationIconContainer,
            {
              transform: [{ scale: mapIconScale.current }],
              opacity: mapIconOpacity.current,
            },
          ]}
        >
          <Image
            source={locationIcon}
            style={styles.locationIcon}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: textColors.white,
  },
  loadingContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    borderRadius: 100,
    borderWidth: 1,
    borderColor: textColors.black, // Black color
    backgroundColor: "transparent",
  },
  pulseRing1: {
    width: 80,
    height: 80,
  },
  pulseRing2: {
    width: 100,
    height: 100,
  },
  pulseRing3: {
    width: 120,
    height: 120,
  },
  locationIconContainer: {
    position: "absolute",
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  locationIcon: {
    width: 50,
    height: 50,
  },
});
