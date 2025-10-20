import { textColors } from "@/constants/colors";
import { BID_WAITING_TIMER_DURATION_MS } from "@/constants/global";
import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Progress from "../Progress";

interface ProgressTimerProps {
  duration: number;
  onComplete: () => void;
  isActive: boolean;
  height?: number;
  borderRadius?: number;
}

/**
 * A self-contained progress timer that maintains its own state
 * and doesn't restart when parent components re-render
 */
const ProgressTimer: React.FC<ProgressTimerProps> = ({
  duration = BID_WAITING_TIMER_DURATION_MS,
  onComplete,
  isActive,
  height = 20,
  borderRadius = 12,
}) => {
  const [progress, setProgress] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Update the callback ref when it changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Start the timer when component becomes active
  useEffect(() => {
    if (isActive && !isRunning) {
      setIsRunning(true);
      setProgress(1); // Start with full progress bar (right to left)
      startTimeRef.current = Date.now();

      const updateProgress = () => {
        if (!startTimeRef.current) return;

        const elapsed = Date.now() - startTimeRef.current;
        const remainingTime = Math.max(duration - elapsed, 0);
        const progressValue = remainingTime / duration; // Goes from 1 to 0 as time progresses

        const clampedProgress = Math.max(0, Math.min(1, progressValue));
        setProgress(clampedProgress);
        if (clampedProgress <= 0.001) {
          setIsRunning(false);
          setProgress(0);
          onCompleteRef.current();
        } else {
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
      };

      animationFrameRef.current = requestAnimationFrame(updateProgress);
    } else if (!isActive && isRunning) {
      // Pause the timer when not active
      setIsRunning(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isActive, duration, isRunning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <View style={{ width: "100%" }}>
      <Progress
        progress={progress}
        color={[textColors.teal850]}
        unfilledColor={textColors.black}
        height={height}
        borderRadius={borderRadius}
        animated={false}
        direction="left-to-right"
      />
    </View>
  );
};

export default ProgressTimer;
