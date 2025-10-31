import Button from "@/components/Button";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { usePackageInfo } from "@/context/PackageInfoContext";
import { useModalManager } from "@/context/ModalManagerContext";
import React from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Divider from "../Divider";
import InfoRow from "../PackageInfoSheet/InfoRow";
import ValueBox from "../SpecialRequirementsSheet/ValueBox";

const { height: screenHeight } = Dimensions.get("window");

const PackageInfoModal: React.FC = () => {
  const { isOpen, data, closePackageInfo } = usePackageInfo();
  const { registerModal, unregisterModal } = useModalManager();

  // Register with Modal Manager
  React.useEffect(() => {
    registerModal("packageInfo", () => closePackageInfo());
    return () => unregisterModal("packageInfo");
  }, [registerModal, unregisterModal, closePackageInfo]);

  if (!data) return null;

  const {
    numberOfPackages = 0,
    weight = "",
    phoneNumber = "",
    recipientName = "",
    instructions = "",
  } = data;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={closePackageInfo}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={closePackageInfo}
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
              Package Information
            </Typography>
            <View style={styles.placeholder} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closePackageInfo}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Number of Packages */}
            <InfoRow
              label="Number of Packages"
              value={<ValueBox value={numberOfPackages} />}
            />

            {/* Weight */}
            <InfoRow label="Weight" value={weight} />

            <Divider />
            {/* Phone Number */}
            <InfoRow
              style={styles.infoRow}
              label="Phone Number"
              value={phoneNumber}
            />

            {/* Recipient Name */}
            <InfoRow label="Recipient Name" value={recipientName} />
            <Divider marginVertical={8} />
            {/* Instructions */}
            <View style={styles.instructionsSection}>
              <Typography
                type="bodyMedium"
                weight="semibold"
                style={styles.instructionsLabel}
              >
                Instructions:
              </Typography>
              <Typography
                type="bodyMedium"
                weight="regular"
                style={styles.instructionsText}
              >
                {instructions}
              </Typography>
            </View>

            {/* Continue Button */}
            <Button
              variant="primary"
              onPress={closePackageInfo}
              style={styles.continueButton}
              rounded="half"
            >
              Continue
            </Button>
          </ScrollView>
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
    maxHeight: screenHeight * 0.85,
    zIndex: 10001,
    elevation: 10001,
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
  instructionsSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  instructionsLabel: {
    color: textColors.black,
    marginBottom: 8,
  },
  instructionsText: {
    color: textColors.black,
    lineHeight: 20,
  },
  continueButton: {
    marginVertical: 24,
  },
  infoRow: {
    marginTop: 16,
  },
});

export default PackageInfoModal;
