import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseStopwatchOptions {
  /** Whether the stopwatch should be running */
  isActive?: boolean;
  /** Called when stopwatch is stopped (optional) */
  onStop?: (elapsedSeconds: number) => void;
}

export interface UseStopwatchResult {
  /** Elapsed seconds since start */
  seconds: number;
  /** Formatted as MM:SS */
  formatted: string;
  /** Is the stopwatch currently running */
  isRunning: boolean;
  /** Start/resume */
  start: () => void;
  /** Pause */
  stop: () => void;
  /** Reset to 0 (does not auto-start) */
  reset: () => void;
}

export function useStopwatch(
  options: UseStopwatchOptions = {}
): UseStopwatchResult {
  const { isActive = false, onStop } = options;

  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(Boolean(isActive));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (timerRef.current) return;
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    clear();
    setIsRunning(false);
    onStop?.(seconds);
  }, [clear, onStop, seconds]);

  const reset = useCallback(() => {
    setSeconds(0);
  }, []);

  // React to external isActive changes
  useEffect(() => {
    if (isActive) {
      start();
    } else {
      stop();
    }
    return stop;
  }, [isActive, start, stop]);

  const formatted = useMemo(() => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${sec}`;
  }, [seconds]);

  return { seconds, formatted, isRunning, start, stop, reset };
}

export default useStopwatch;
