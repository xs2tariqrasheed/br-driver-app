import { AUTO_LOGOUT_IDLE_TIMEOUT_MINUTES } from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { useRideOffer } from "@/context/RideOfferContext";
import { logger } from "@/utils/helpers";
import { performLogout } from "@/utils/logout";
import { usePathname, useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

const IDLE_TIMEOUT_MS = AUTO_LOGOUT_IDLE_TIMEOUT_MINUTES * 60 * 1000;
const CHECK_INTERVAL_MS = 60_000;

interface AutoLogoutContextValue {
  resetIdleTimer: () => void;
}

const AutoLogoutContext = createContext<AutoLogoutContextValue>({
  resetIdleTimer: () => {},
});

export const useAutoLogout = () => useContext(AutoLogoutContext);

export function AutoLogoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const log = logger();
  const router = useRouter();
  const pathname = usePathname();
  const [auth] = useAuth();
  const [driver, setDriver] = useDriver();
  const { removeRetrievalId, removeTripId } = useDriver();
  const { setHasAnyActiveOffer, temporaryRides, removeTemporaryRide } =
    useRideOffer();

  const lastActivityRef = useRef(Date.now());
  const isLoggingOutRef = useRef(false);

  // Refs keep the interval callback reading fresh values without recreating it.
  const driverRef = useRef(driver);
  const authRef = useRef(auth);
  const temporaryRidesRef = useRef(temporaryRides);

  useEffect(() => {
    driverRef.current = driver;
  }, [driver]);
  useEffect(() => {
    authRef.current = auth;
  }, [auth]);
  useEffect(() => {
    temporaryRidesRef.current = temporaryRides;
  }, [temporaryRides]);

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Reset on navigation changes
  useEffect(() => {
    resetIdleTimer();
  }, [pathname, resetIdleTimer]);

  // Reset when the app returns to the foreground
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        resetIdleTimer();
      }
    };
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [resetIdleTimer]);

  // Periodic idle check — stable deps only (callbacks from contexts are stable).
  useEffect(() => {
    if (!auth) return;

    const interval = setInterval(async () => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed < IDLE_TIMEOUT_MS) return;

      const currentDriver = driverRef.current;
      const currentAuth = authRef.current;
      if (!currentAuth) return;

      const hasActiveTrip = !!(
        currentDriver?.retrievalId != null &&
        currentDriver?.retrievalId !== "" &&
        currentDriver?.tripId != null &&
        currentDriver?.tripId !== ""
      );

      if (hasActiveTrip) {
        resetIdleTimer();
        return;
      }

      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;

      console.log("[AutoLogout] Idle timeout reached, performing auto-logout");

      try {
        await performLogout({
          driverId: currentAuth?.user?.id,
          driver: currentDriver,
          setDriver,
          removeRetrievalId,
          removeTripId,
          setHasAnyActiveOffer,
          temporaryRides: temporaryRidesRef.current,
          removeTemporaryRide,
        });
        router.replace("/(screens)/auth/login");
      } catch (error) {
        console.log("[AutoLogout] Error during auto-logout:", error);
      } finally {
        isLoggingOutRef.current = false;
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [
    auth,
    setDriver,
    removeRetrievalId,
    removeTripId,
    setHasAnyActiveOffer,
    removeTemporaryRide,
    router,
    resetIdleTimer,
    log,
  ]);

  return (
    <AutoLogoutContext.Provider value={{ resetIdleTimer }}>
      {children}
    </AutoLogoutContext.Provider>
  );
}
