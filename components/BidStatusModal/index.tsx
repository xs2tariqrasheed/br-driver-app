/**
 * @fileoverview BidStatusModal Component - A modal component for displaying bid status updates
 *
 * This component handles:
 * - Displaying bid status messages (Expired, Unsuccessful, Accepted)
 * - Countdown timer for expired and accepted bids (10 seconds)
 * - Different background colors for each status type
 * - Proper typography using SF Pro font family
 * - Callback functions for timer completion and close actions
 * - Integration with Modal for consistent UI
 */

import { textColors } from "@/constants/colors";
import {
  BID_STATUS,
  BID_STATUS_COLORS,
  BID_STATUS_COUNTDOWN_DURATION_SECONDS,
  BID_STATUS_MESSAGES,
  SPEECH_MESSAGES,
  type BidStatus,
} from "@/constants/global";
import { speechManager } from "@/utils/speechManager";
import React, { useCallback, useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Typography from "../Typography";

export interface BidStatusModalProps {
  /**
   * Whether the modal is open/visible
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
 * BidStatusModal Component
 *
 * A modal component that displays bid status updates with appropriate
 * styling, countdown timers, and callbacks. Matches the UI style of
 * SpecialRequirementsModal and PackageInfoModal.
 */
const BidStatusModal: React.FC<BidStatusModalProps> = ({
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

  // Speak the status message when modal opens
  useEffect(() => {
    if (open) {
      switch (status) {
        case BID_STATUS.EXPIRED:
          speechManager.speak(SPEECH_MESSAGES.BID_EXPIRED);
          break;
        case BID_STATUS.UNSUCCESSFUL:
          speechManager.speak(SPEECH_MESSAGES.BID_UNSUCCESSFUL);
          break;
        case BID_STATUS.ACCEPTED:
          speechManager.speak(SPEECH_MESSAGES.BID_ACCEPTED);
          break;
        default:
          break;
      }
    }
  }, [open, status]);

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
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor }]}>
          {/* Header */}
          <View style={styles.header}>
            <Typography
              type="bodyLarge"
              weight="semibold"
              style={styles.headerTitle}
            >
              {statusData?.TITLE}
            </Typography>
            <View style={styles.placeholder} />
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
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
              {status === BID_STATUS.ACCEPTED ? "Redirecting in" : "Closing in"}{" "}
              {formatCountdown(countdown)}
            </Typography>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 10001,
    elevation: 10001,
  },
  container: {
    backgroundColor: textColors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "50%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 20,
    backgroundColor: textColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: textColors.black,
    fontWeight: "600",
  },
  headerTitle: {
    color: textColors.black,
    fontSize: 18,
  },
  placeholder: {
    width: 32,
  },
  sheetContainer: {
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 20,
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

export default BidStatusModal;
