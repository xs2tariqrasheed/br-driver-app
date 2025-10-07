import React from "react";
import { Modal, StyleSheet, View } from "react-native";

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * BottomSheetModal Component
 *
 * A modal wrapper specifically for bottom sheets that ensures they appear
 * above other modals by using a higher z-index and elevation.
 */
export default function BottomSheetModal({
  visible,
  onClose,
  children,
}: BottomSheetModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>{children}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 10000, // Higher than ride offer modal
    elevation: 10000,
  },
  container: {
    zIndex: 10000,
    elevation: 10000,
  },
});
