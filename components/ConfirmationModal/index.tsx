import { textColors } from "@/constants/colors";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import Button from "../Button";
import Typography from "../Typography";

export interface ConfirmationModalProps {
  /**
   * Whether the modal is open/visible
   * @default false
   */
  open: boolean;
  /**
   * Title of the confirmation modal
   */
  title: string;

  /**
   * Description of the confirmation modal
   */
  description: string;
  /**
   * Callback function triggered when the confirm button is pressed
   */
  onConfirm: () => void;

  /**
   * Callback function triggered when the cancel button is pressed
   */
  onCancel: () => void;
  /**
   * Text for the cancel button
   */
  cancelButtonText: string;
  /**
   * Text for the confirm button
   */
  confirmButtonText: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  cancelButtonText,
  confirmButtonText,
}) => {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onCancel}
      >
        <View
          style={styles.container}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Typography
              type="titleMedium"
              weight="semibold"
              style={styles.headerTitle}
              numberOfLines={0}
            >
              {title}
            </Typography>
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
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
              {description}
            </Typography>

            <View style={styles.sheetButtonsRow}>
              <Button
                variant="outlined"
                rounded="half"
                block="half"
                onPress={onCancel}
              >
                {cancelButtonText}
              </Button>
              <Button
                variant="danger"
                rounded="half"
                block="half"
                onPress={onConfirm}
              >
                {confirmButtonText}
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: textColors.white,
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
    marginRight: 12,
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
  sheetButtonsRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
  },
});

export default ConfirmationModal;
