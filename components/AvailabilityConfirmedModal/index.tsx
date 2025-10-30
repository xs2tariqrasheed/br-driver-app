/**
 * @fileoverview AvailabilityConfirmedModal Component - Modal for confirming availability
 *
 * This component displays:
 * - Confirmation message that availability is confirmed
 * - Instructions about receiving further details
 * - Done button to close the modal
 *
 * Used when driver confirms availability for a future job.
 */

import { textColors } from "@/constants/colors";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import Button from "../Button";
import Typography from "../Typography";

export interface AvailabilityConfirmedModalProps {
  /**
   * Whether the modal is open/visible
   * @default false
   */
  open: boolean;
  /**
   * Callback function triggered when the done button is pressed
   */
  onDone: () => void;
}

const AvailabilityConfirmedModal: React.FC<AvailabilityConfirmedModalProps> = ({
  open,
  onDone,
}) => {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onDone}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDone}
      >
        <View
          style={styles.container}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Typography
              type="titleLarge"
              weight="semibold"
              style={styles.headerTitle}
            >
              Availability is confirmed.
            </Typography>
            <TouchableOpacity style={styles.closeButton} onPress={onDone}>
              <Typography
                type="bodyLarge"
                weight="semibold"
                style={styles.closeButtonText}
              >
                ✕
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.sheetContainer}>
            <Typography
              type="bodyLarge"
              weight="regular"
              style={styles.sheetDescriptionText}
            >
              You'll receive further instructions 2 hours before the job starts.
            </Typography>

            <View style={styles.sheetFooter}>
              <Button variant="primary" rounded="half" onPress={onDone}>
                Done
              </Button>
            </View>
          </View>
        </View>
      </TouchableOpacity>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: textColors.grey100,
    borderWidth: 2,
    borderColor: textColors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: textColors.black,
    fontSize: 18,
    fontWeight: "700",
  },
  headerTitle: {
    color: textColors.black,
    flex: 1,
    textAlign: "center",
  },
  sheetContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  sheetDescriptionText: {
    color: textColors.black,
    lineHeight: 22,
  },
  sheetFooter: {
    marginTop: 16,
  },
});

export default AvailabilityConfirmedModal;
