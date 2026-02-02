import Button from "@/components/Button";
import Counter from "@/components/Counter";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { useOverlayInsets } from "@/context/OverlayInsetsContext";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface ETAModalProps {
  open?: boolean;
  onClose: () => void;
  onSubmit: (eta: number) => void;
  isLoading?: boolean;
}

/**
 * ETA Modal Component
 * A bottom sheet modal that allows selecting ETA and submitting.
 * Matches the UI style of SpecialRequirementsModal and PackageInfoModal.
 */
const ETAModal: React.FC<ETAModalProps> = ({
  open = false,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const { overlayBottomInset } = useOverlayInsets();
  const [eta, setEta] = useState(15); // Default 15 minutes

  const handleSubmit = () => {
    onSubmit(eta);
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={styles.container}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Typography
              type="bodyLarge"
              weight="semibold"
              style={styles.headerTitle}
            >
              Provide ETA
            </Typography>
            <View style={styles.placeholder} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={[styles.content, { paddingBottom: overlayBottomInset -20 }]}>
            {/* ETA Section */}
            <View style={styles.etaSection}>
              <Typography
                type="bodyLarge"
                weight="semibold"
                style={styles.etaSectionTitle}
              >
                Est.Time of Arrival{" "}
                <Typography
                  type="bodyLarge"
                  weight="regular"
                  style={styles.etaSectionTitle}
                >
                  (ETA)
                </Typography>
              </Typography>
              <Counter
                containerStyle={styles.etaCounterContainer}
                value={eta}
                onChange={setEta}
                min={1}
                max={60}
                step={1}
                formatLabel={(value) => `${value} mins`}
                disabled={isLoading}
              />
            </View>

            {/* Submit Button */}
            <View style={styles.submitSection}>
              <Button
                variant="primary"
                rounded="half"
                onPress={handleSubmit}
                disabled={isLoading}
                loading={isLoading}
              >
                Submit
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
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
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
    fontSize: 18,
    color: textColors.black,
    fontWeight: "700",
  },
  headerTitle: {
    color: textColors.black,
    fontSize: 18,
  },
  placeholder: {
    width: 32,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  etaSection: {
    flexDirection: "column",
    gap: 0,
    marginVertical: 16,
  },
  etaSectionTitle: {
    color: textColors.black,
  },
  etaCounterContainer: {
    width: "100%",
  },
  submitSection: {
    marginTop: 8,
  },
});

export default ETAModal;
