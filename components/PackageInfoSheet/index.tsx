import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { usePackageInfo } from "@/context/PackageInfoContext";
import React from "react";
import { StyleSheet, View } from "react-native";
import Divider from "../Divider";
import ValueBox from "../SpecialRequirementsSheet/ValueBox";
import InfoRow from "./InfoRow";

const PackageInfoSheet: React.FC = () => {
  const { isOpen, data, closePackageInfo } = usePackageInfo();

  if (!data) return null;

  const {
    numberOfPackages = 0,
    weight = "",
    phoneNumber = "",
    recipientName = "",
    instructions = "",
  } = data;

  return (
    <BottomSheet
      open={isOpen}
      onClose={closePackageInfo}
      snapPoints={["85%"]}
      initialSnapIndex={0}
      headerTitle="Package Information"
      showHeader={true}
      scrollable={true}
    >
      <View style={styles.container}>
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
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
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

export default PackageInfoSheet;
