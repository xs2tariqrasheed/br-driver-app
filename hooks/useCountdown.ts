import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseCountdownOptions {
  /** Total duration to count down from, in seconds */
  durationSeconds: number;
  /** Whether the countdown should be running */
  isActive?: boolean;
  /** Reset the countdown back to full when it becomes active */
  resetOnActivate?: boolean;
  /** Called once when countdown reaches 0 */
  onComplete?: () => void;
}

export interface UseCountdownResult {
  /** Remaining seconds */
  seconds: number;
  /** Formatted as MM:SS */
  formatted: string;
  /** Is the countdown currently running */
  isRunning: boolean;
  /** Start/resume the countdown */
  start: () => void;
  /** Pause the countdown */
  stop: () => void;
  /** Reset to initial duration (does not auto-start) */
  reset: () => void;
}

export function useCountdown(options: UseCountdownOptions): UseCountdownResult {
  const {
    durationSeconds,
    isActive = false,
    resetOnActivate = false,
    onComplete,
  } = options;

  const [seconds, setSeconds] = useState<number>(durationSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(Boolean(isActive));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep latest onComplete in a ref to avoid stale closures
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setSeconds((prev) => {
      if (prev <= 1) {
        // Reaches 0
        clear();
        setIsRunning(false);
        onCompleteRef.current?.();
        return 0;
      }
      return prev - 1;
    });
  }, [clear]);

  const start = useCallback(() => {
    if (timerRef.current) return;
    setIsRunning(true);
    timerRef.current = setInterval(tick, 1000);
  }, [tick]);

  const stop = useCallback(() => {
    clear();
    setIsRunning(false);
  }, [clear]);

  const reset = useCallback(() => {
    setSeconds(durationSeconds);
  }, [durationSeconds]);

  // React to external isActive changes
  useEffect(() => {
    if (isActive) {
      if (resetOnActivate) {
        setSeconds(durationSeconds);
      }
      start();
    } else {
      stop();
    }
    return stop;
  }, [isActive, resetOnActivate, durationSeconds, start, stop]);

  // Derived formatted string MM:SS
  const formatted = useMemo(() => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${sec}`;
  }, [seconds]);

  return { seconds, formatted, isRunning, start, stop, reset };
}

export default useCountdown;
