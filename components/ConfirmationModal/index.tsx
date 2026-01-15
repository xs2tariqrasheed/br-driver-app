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
  /** Optional to reduce accidental double taps */
  disabled?: boolean;
  /** Whether the confirm action is loading */
  loading?: boolean;
  /** Loading text to show on confirm button when loading */
  loadingText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  cancelButtonText,
  confirmButtonText,
  disabled = false,
  loading = false,
  loadingText = "Loading...",
}) => {
  // Prevent closing when loading
  const handleCancel = () => {
    if (!loading) {
      onCancel();
    }
  };

  const handleOverlayPress = () => {
    if (!loading) {
      onCancel();
    }
  };

  const handleRequestClose = () => {
    if (!loading) {
      onCancel();
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={handleRequestClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleOverlayPress}
        disabled={loading}
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
            <TouchableOpacity 
              style={[styles.closeButton, loading && styles.closeButtonDisabled]} 
              onPress={handleCancel}
              disabled={loading}
            >
              <Typography
                type="bodyLarge"
                weight="semibold"
                style={[styles.closeButtonText, loading && styles.closeButtonTextDisabled]}
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
                onPress={handleCancel}
                disabled={disabled || loading}
              >
                {cancelButtonText}
              </Button>
              <Button
                variant="danger"
                rounded="half"
                block="half"
                onPress={loading ? () => {} : onConfirm}
                disabled={disabled || loading}
                loading={loading}
              >
                {loading ? loadingText : confirmButtonText}
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
  closeButtonDisabled: {
    opacity: 0.5,
  },
  closeButtonTextDisabled: {
    opacity: 0.5,
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
