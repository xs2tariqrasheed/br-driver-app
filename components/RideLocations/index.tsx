import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { FREE_WAIT_DURATION_SECONDS } from "@/constants/global";
import useCountdown from "@/hooks/useCountdown";
import useStopwatch from "@/hooks/useStopwatch";
import React, { useEffect } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

export interface RideLocationsProps {
  /** Pickup address text. When provided, renders a PU row. */
  pickupAddress?: string;
  /** Dropoff address text. When provided, renders a DO row. */
  dropoffAddress?: string;
  /** Show the free waiting countdown row */
  showFreeWaitTimer?: boolean;
  /** Hide/stop the free waiting countdown row */
  hideFreeWaitTimer?: boolean;
  /** Callback on 'Passenger not found' icon press (visible during paid wait) */
  onNotPassengerFoundClick?: () => void;
  /** Reset and hide the free countdown row */
  resetCountdown?: boolean;
  /** Reset and hide the paid stopwatch row */
  resetStopwatch?: boolean;
}

const LOCATION_ICON = require("../../assets/images/map/location-icon.png");
const FREE_WAIT_ICON = require("../../assets/images/map/free-wait-timer.png");
const PAID_WAIT_ICON = require("../../assets/images/map/paid-wait-timer.png");
const PASSENGER_NOT_FOUND_ICON = require("../../assets/images/map/no-passenger-found.png");

const RideLocations: React.FC<RideLocationsProps> = ({
  pickupAddress,
  dropoffAddress,
  showFreeWaitTimer,
  hideFreeWaitTimer,
  onNotPassengerFoundClick,
  resetCountdown,
  resetStopwatch,
}) => {
  const rows: { label: "PU:" | "DO:"; value: string }[] = [];
  if (pickupAddress) rows.push({ label: "PU:", value: pickupAddress });
  if (dropoffAddress) rows.push({ label: "DO:", value: dropoffAddress });

  const {
    seconds: freeSeconds,
    formatted: formattedFree,
    reset: resetFree,
  } = useCountdown({
    durationSeconds: FREE_WAIT_DURATION_SECONDS,
    isActive: Boolean(
      showFreeWaitTimer && !hideFreeWaitTimer && !resetCountdown
    ),
    resetOnActivate: true,
  });

  // Paid wait starts when free reaches 0 and not reset
  const paidActive = Boolean(
    showFreeWaitTimer &&
      !hideFreeWaitTimer &&
      freeSeconds === 0 &&
      !resetStopwatch
  );
  const { formatted: formattedPaid, reset: resetPaid } = useStopwatch({
    isActive: paidActive,
  });

  // Reset timers based on individual reset props
  useEffect(() => {
    if (resetCountdown) {
      resetFree();
    }
  }, [resetCountdown, resetFree]);

  useEffect(() => {
    if (resetStopwatch) {
      resetPaid();
    }
  }, [resetStopwatch, resetPaid]);

  if (rows.length === 0 && !showFreeWaitTimer) return null;

  return (
    <View style={styles.container}>
      {rows.map((row, index) => (
        <View key={`${row.label}-${index}`} style={styles.row}>
          <Image
            source={LOCATION_ICON}
            style={styles.icon}
            resizeMode="contain"
          />
          <Typography
            type="bodyMedium"
            weight="semibold"
            style={styles.text}
            numberOfLines={0}
          >
            {row.label} {row.value}
          </Typography>
        </View>
      ))}

      {showFreeWaitTimer &&
        !hideFreeWaitTimer &&
        !resetCountdown &&
        freeSeconds > 0 && (
          <View style={styles.row}>
            <Image
              source={FREE_WAIT_ICON}
              style={styles.icon}
              resizeMode="contain"
            />
            <Typography
              type="bodyMedium"
              weight="semibold"
              style={styles.text}
              numberOfLines={1}
            >
              Free Wait: {formattedFree} mins
            </Typography>
          </View>
        )}

      {paidActive && (
        <View style={styles.rowSpaceBetween}>
          <View style={styles.rowLeft}>
            <Image
              source={PAID_WAIT_ICON}
              style={styles.icon}
              resizeMode="contain"
            />
            <Typography
              type="bodyMedium"
              weight="semibold"
              style={styles.text}
              numberOfLines={1}
            >
              Wait: {formattedPaid} mins
            </Typography>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onNotPassengerFoundClick}
            disabled={!onNotPassengerFoundClick}
            style={styles.rightIconButton}
          >
            <Image
              source={PASSENGER_NOT_FOUND_ICON}
              style={styles.rightIcon}
              resizeMode="contain"
            />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  rowSpaceBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    flex: 1,
  },
  icon: {
    width: 24,
    height: 24,
  },
  text: {
    flex: 1,
    flexWrap: "wrap",
    color: textColors.black,
  },
  rightIconButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  rightIcon: {
    width: 24,
    height: 24,
  },
});

export default RideLocations;
