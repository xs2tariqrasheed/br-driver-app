import { textColors } from "@/constants/colors";
import {
  SKELETON_DEFAULT_DURATION_MS,
  SKELETON_DEFAULT_HEIGHT,
  SKELETON_DEFAULT_RADIUS,
} from "@/constants/global";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

/**
 * Shimmering placeholder for content that is loading.
 *
 * Defaults:
 * - width: 100%
 * - height: `SKELETON_DEFAULT_HEIGHT`
 * - borderRadius: `SKELETON_DEFAULT_RADIUS`
 * - durationMs: `SKELETON_DEFAULT_DURATION_MS`
 */
export type SkeletonLoaderProps = {
  /** Width of the skeleton container. Defaults to 100%. */
  width?: number | `${number}%`;
  /** Height of the skeleton container. Defaults to `SKELETON_DEFAULT_HEIGHT`. */
  height?: number;
  /** Border radius of the skeleton container. Defaults to `SKELETON_DEFAULT_RADIUS`. */
  borderRadius?: number;
  /** Optional style for outer container. */
  style?: StyleProp<ViewStyle>;
  /** Duration in ms for one shimmer sweep. Defaults to `SKELETON_DEFAULT_DURATION_MS`. */
  durationMs?: number;
};

/**
 * SkeletonLoader renders a grey container with a moving linear-gradient to mimic content loading.
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = "100%",
  height = SKELETON_DEFAULT_HEIGHT,
  borderRadius = SKELETON_DEFAULT_RADIUS,
  style,
  durationMs = SKELETON_DEFAULT_DURATION_MS,
}) => {
  const translateX = useRef(new Animated.Value(-1)).current;
  const [containerWidth, setContainerWidth] = useState<number>(0);

  /**
   * Width of the shimmer band. Scales with container width with sane minimum.
   */
  const shimmerWidth = useMemo(() => {
    if (containerWidth <= 0) return 60; // Fallback before layout
    return Math.max(60, Math.round(containerWidth * 0.4));
  }, [containerWidth]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.inOut(Easing.linear),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [translateX, durationMs]);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const animatedStyle = useMemo(() => {
    const translateRange = containerWidth + shimmerWidth;
    const translate = translateX.interpolate({
      inputRange: [-1, 1],
      outputRange: [-shimmerWidth, translateRange],
    });
    return {
      transform: [{ translateX: translate }],
    } as const;
  }, [translateX, containerWidth, shimmerWidth]);

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          backgroundColor: textColors.grey100,
        },
        style,
      ]}
      pointerEvents="none"
      accessibilityRole="progressbar"
      accessibilityLabel="Loading content"
    >
      <Animated.View
        style={[
          styles.shimmer,
          { width: shimmerWidth, borderRadius },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={[textColors.grey100, textColors.grey200, textColors.grey100]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default SkeletonLoader;
