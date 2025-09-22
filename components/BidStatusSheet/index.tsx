/**
 * @fileoverview BidStatusSheet Component - A bottom sheet component for displaying bid status updates
 *
 * This component handles:
 * - Displaying bid status messages (Expired, Unsuccessful, Accepted)
 * - Countdown timer for expired bids (10 seconds)
 * - Different background colors for each status type
 * - Proper typography using SF Pro font family
 * - Callback functions for timer completion and close actions
 * - Integration with CustomBottomSheet for consistent UI
 */

import { textColors } from "@/constants/colors";
import {
  BID_STATUS,
  BID_STATUS_COLORS,
  BID_STATUS_COUNTDOWN_DURATION_SECONDS,
  BID_STATUS_MESSAGES,
  type BidStatus,
} from "@/constants/global";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import CustomBottomSheet from "../BottomSheet";
import Typography from "../Typography";

export interface BidStatusSheetProps {
  /**
   * Whether the bottom sheet is open/visible
   * @default false
   */
  open: boolean;
  /**
   * The status of the bid (expired, unsuccessful, accepted)
   */
  status: BidStatus;
  /**
   * Callback function triggered when the countdown timer completes
   * Only called for expired status
   */
  onTimerComplete: () => void;
  /**
   * Callback function triggered when the close button is pressed
   */
  onClose: () => void;
}

/**
 * BidStatusSheet Component
 *
 * A bottom sheet component that displays bid status updates with appropriate
 * messaging, styling, and countdown timer functionality.
 *
 * @param props - The component props
 * @returns JSX.Element
 */
const BidStatusSheet: React.FC<BidStatusSheetProps> = ({
  open,
  status,
  onTimerComplete,
  onClose,
}) => {
  const [countdown, setCountdown] = useState<number>(
    BID_STATUS_COUNTDOWN_DURATION_SECONDS
  );

  // Get status-specific data
  const statusData =
    BID_STATUS_MESSAGES[
      status.toUpperCase() as keyof typeof BID_STATUS_MESSAGES
    ];
  const backgroundColor =
    BID_STATUS_COLORS[status.toUpperCase() as keyof typeof BID_STATUS_COLORS];

  // Reset countdown when component opens
  useEffect(() => {
    if (open) {
      setCountdown(BID_STATUS_COUNTDOWN_DURATION_SECONDS);
    }
  }, [open]);

  // Handle countdown timer for expired status
  useEffect(() => {
    if (!open || status !== BID_STATUS.EXPIRED) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, status]);

  // Handle timer completion when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && open && status === BID_STATUS.EXPIRED) {
      onTimerComplete();
    }
  }, [countdown, open, status, onTimerComplete]);

  // Format countdown display
  const formatCountdown = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }, []);

  // Handle close button press
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <CustomBottomSheet
      open={open}
      snapPoints={["40%"]}
      initialSnapIndex={0}
      backdrop={true}
      swipeToClose={false}
      headerTitle={statusData.TITLE}
      onClose={handleClose}
      customBackgroundColor={backgroundColor}
    >
      <View style={[styles.sheetContainer, { backgroundColor }]}>
        {/* Description */}
        <Typography
          type="bodyLarge"
          weight="regular"
          style={styles.description}
        >
          {statusData.DESCRIPTION}
        </Typography>

        {/* Countdown timer for all statuses */}
        <Typography type="bodyLarge" weight="bold" style={styles.countdown}>
          Redirecting in {formatCountdown(countdown)}
        </Typography>
      </View>
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    paddingTop: 12,
    gap: 12,
  },
  description: {
    color: textColors.black,
    lineHeight: 22,
  },
  countdown: {
    color: textColors.black,
    textAlign: "center",
    marginTop: 8,
  },
});

export default BidStatusSheet;
