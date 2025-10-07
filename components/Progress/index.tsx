import { textColors } from "@/constants/colors";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

export interface ProgressProps {
  progress: number;
  color?: string | string[];
  unfilledColor?: string;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  width?: number | string;
  height?: number;
  duration?: number;
  onEnd?: () => void;
  onComplete?: () => void;
  animated?: boolean;
  animationDuration?: number;
  direction?: "left-to-right" | "right-to-left";
}

const Progress: React.FC<ProgressProps> = ({
  progress,
  color = [textColors.teal400, textColors.teal850],
  unfilledColor = textColors.black,
  borderWidth = 0,
  borderColor = "transparent",
  borderRadius = 12,
  width = "100%",
  height = 20,
  duration,
  onEnd,
  onComplete,
  animated = true,
  animationDuration = 300,
  direction = "right-to-left",
}) => {
  const [currentProgress, setCurrentProgress] = useState(
    duration ? 1 : Math.max(0, Math.min(1, progress))
  );
  const [isTimerActive, setIsTimerActive] = useState(!!duration);
  const progressAnimation = useRef(
    new Animated.Value(duration ? 1 : Math.max(0, Math.min(1, progress)))
  ).current;
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Normalize progress for non-timer usage
  const normalizedProgress = Math.max(0, Math.min(1, progress));

  // Timer logic using requestAnimationFrame
  useEffect(() => {
    if (duration && duration > 0) {
      setIsTimerActive(true);
      setCurrentProgress(1);
      startTimeRef.current = Date.now();

      const updateProgress = () => {
        if (!startTimeRef.current) return;

        const elapsed = Date.now() - startTimeRef.current;
        const remainingTime = Math.max(duration - elapsed, 0);
        const progressValue = remainingTime / duration;

        // Clamp progress between 0 and 1
        const clampedProgress = Math.max(0, Math.min(1, progressValue));
        setCurrentProgress(clampedProgress);

        // Only trigger callbacks when progress is effectively 0
        if (clampedProgress <= 0.001) {
          // Small threshold for floating-point safety
          setIsTimerActive(false);
          setCurrentProgress(0);
          progressAnimation.setValue(0); // Ensure animation reflects 0
          onEnd?.();
          onComplete?.();
        } else {
          // Continue the animation loop
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
      };

      // Start the animation loop
      animationFrameRef.current = requestAnimationFrame(updateProgress);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      // Non-timer mode: use the progress prop
      setCurrentProgress(normalizedProgress);
      if (!animated) {
        progressAnimation.setValue(normalizedProgress);
      }
    }
  }, [duration, onEnd, onComplete, animated, progressAnimation, progress]);

  // Animate progress changes
  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnimation, {
        toValue: currentProgress,
        duration: animationDuration,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnimation.setValue(currentProgress);
    }
  }, [currentProgress, animated, animationDuration, progressAnimation]);

  // Trigger callbacks for non-timer mode when progress reaches 0
  useEffect(() => {
    if (!duration && normalizedProgress <= 0) {
      onEnd?.();
      onComplete?.();
    }
  }, [normalizedProgress, duration, onEnd, onComplete]);

  // Gradient colors
  const getGradientColors = () => {
    if (Array.isArray(color)) {
      return color;
    }
    return [color, color];
  };

  const gradientColors = getGradientColors();

  // Interpolate filled width
  const filledWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View
      style={[
        styles.container,
        {
          width: width as any,
          height,
          borderRadius,
          borderWidth,
          borderColor,
          backgroundColor: unfilledColor,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.filled,
          {
            width: filledWidth,
            height: "100%",
            borderRadius: borderRadius - (borderWidth || 0),
            backgroundColor: gradientColors[0],
            ...(direction === "right-to-left"
              ? { right: 0, left: undefined }
              : { left: 0, right: undefined }),
          },
        ]}
      >
        {Array.isArray(color) && color.length > 1 && (
          <View
            style={[
              styles.gradientOverlay,
              {
                borderRadius: borderRadius - (borderWidth || 0),
                backgroundColor: gradientColors[1],
                ...(direction === "right-to-left"
                  ? { right: 0, left: undefined }
                  : { left: 0, right: undefined }),
              },
            ]}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
  filled: {
    position: "absolute",
    top: 0,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "50%",
    opacity: 0.7,
  },
});

export default Progress;
