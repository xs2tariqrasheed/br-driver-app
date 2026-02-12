/**
 * @fileoverview BidStatusSheet Component - A bottom sheet component for displaying bid status updates
 *
 * This component handles:
 * - Displaying bid status messages (Expired, Unsuccessful, Accepted)
 * - Countdown timer for expired and accepted bids (10 seconds)
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
  type BidStatus,
} from "@/constants/global";
import { BID_STATUS_MODAL_CONTENT_KEYS } from "@/content/components/bid-status-modal-keys";
import { useGetContent } from "@/hooks/useGetContent";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
   * Called for expired and accepted statuses
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

  const { getContent } = useGetContent();
  const {
    titleExpired,
    descriptionExpired,
    titleUnsuccessful,
    descriptionUnsuccessful,
    titleAccepted,
    descriptionAccepted,
    countdownRedirecting,
    countdownClosing,
  } = useMemo(() => {
    const get = getContent;
    return {
      titleExpired: get(BID_STATUS_MODAL_CONTENT_KEYS.TITLE_EXPIRED),
      descriptionExpired: get(
        BID_STATUS_MODAL_CONTENT_KEYS.DESCRIPTION_EXPIRED,
      ),
      titleUnsuccessful: get(BID_STATUS_MODAL_CONTENT_KEYS.TITLE_UNSUCCESSFUL),
      descriptionUnsuccessful: get(
        BID_STATUS_MODAL_CONTENT_KEYS.DESCRIPTION_UNSUCCESSFUL,
      ),
      titleAccepted: get(BID_STATUS_MODAL_CONTENT_KEYS.TITLE_ACCEPTED),
      descriptionAccepted: get(
        BID_STATUS_MODAL_CONTENT_KEYS.DESCRIPTION_ACCEPTED,
      ),
      countdownRedirecting: get(
        BID_STATUS_MODAL_CONTENT_KEYS.COUNT_DOWN_REDIRECTING,
      ),
      countdownClosing: get(BID_STATUS_MODAL_CONTENT_KEYS.COUNT_DOWN_CLOSING),
    };
  }, [getContent]);

  const statusTitle =
    status === BID_STATUS.EXPIRED
      ? titleExpired
      : status === BID_STATUS.UNSUCCESSFUL
        ? titleUnsuccessful
        : titleAccepted;
  const statusDescription =
    status === BID_STATUS.EXPIRED
      ? descriptionExpired
      : status === BID_STATUS.UNSUCCESSFUL
        ? descriptionUnsuccessful
        : descriptionAccepted;
  const countdownLabel =
    status === BID_STATUS.ACCEPTED ? countdownRedirecting : countdownClosing;

  const backgroundColor =
    BID_STATUS_COLORS[status.toUpperCase() as keyof typeof BID_STATUS_COLORS];

  // Reset countdown when component opens
  useEffect(() => {
    if (open) {
      setCountdown(BID_STATUS_COUNTDOWN_DURATION_SECONDS);
    }
  }, [open]);

  // Handle countdown timer for expired and accepted status
  useEffect(() => {
    if (
      !open ||
      (status !== BID_STATUS.EXPIRED && status !== BID_STATUS.ACCEPTED)
    )
      return;

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
    if (!open || countdown !== 0) return;

    if (status === BID_STATUS.EXPIRED || status === BID_STATUS.ACCEPTED) {
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
      headerTitle={statusTitle}
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
          {statusDescription}
        </Typography>

        {/* Countdown timer for all statuses */}
        <Typography type="bodyLarge" weight="bold" style={styles.countdown}>
          {countdownLabel} {formatCountdown(countdown)}
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
