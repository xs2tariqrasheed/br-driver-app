import { textColors } from "@/constants/colors";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import CustomBottomSheet from "../BottomSheet";
import Button from "../Button";
import Counter from "../Counter";
import Divider from "../Divider";
import Typography from "../Typography";

export interface ETABottomSheetProps {
  open?: boolean;
  onClose: () => void;
  onSubmit: (eta: number) => void;
  snapPoints?: (string | number)[];
  initialSnapIndex?: number;
  showHeader?: boolean;
  backdrop?: boolean | ((props: any) => React.ReactElement);
  swipeToClose?: boolean;
  snapPointsWhenKeyboardVisible?: (string | number)[];
  isLoading?: boolean;
}

/**
 * ETA Bottom Sheet Component
 *
 * A simplified bottom sheet that shows ETA counter and submit button
 * Used when driver accepts a ride offer
 */
const ETABottomSheet: React.FC<ETABottomSheetProps> = ({
  open = false,
  onClose,
  onSubmit,
  snapPoints = ["40%"],
  initialSnapIndex = 0,
  showHeader = true,
  backdrop = true,
  swipeToClose = false,
  isLoading = false,
}) => {
  const [eta, setEta] = useState(15); // Default 15 minutes

  const handleSubmit = () => {
    onSubmit(eta);
  };

  return (
    <CustomBottomSheet
      scrollable
      open={open}
      onClose={onClose}
      snapPoints={snapPoints}
      initialSnapIndex={initialSnapIndex}
      showHeader={showHeader}
      backdrop={backdrop}
      swipeToClose={swipeToClose}
      headerTitle="Provide ETA"
      disabledClose={isLoading}
    >
      <Divider />
      <View style={styles.container}>
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
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  etaSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  etaSectionTitle: {
    flex: 1,
    color: textColors.black,
  },
  etaCounterContainer: {
    flex: 1,
  },
  submitSection: {
    marginTop: "auto",
    paddingBottom: 20,
  },
});

export default ETABottomSheet;
