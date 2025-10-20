import { textColors } from "@/constants/colors";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import CustomBottomSheet from "../BottomSheet";
import Button from "../Button";
import Counter from "../Counter";
import Typography from "../Typography";

export interface AddTollBottomSheetProps {
  open?: boolean;
  onClose: () => void;
  onSubmit: (tollAmount: number) => void;
  snapPoints?: (string | number)[];
  initialSnapIndex?: number;
  showHeader?: boolean;
  backdrop?: boolean | ((props: any) => React.ReactElement);
  swipeToClose?: boolean;
  isLoading?: boolean;
}

/**
 * ETA Bottom Sheet Component
 *
 * A simplified bottom sheet that shows ETA counter and submit button
 * Used when driver accepts a ride offer
 */
const AddTollBottomSheet: React.FC<AddTollBottomSheetProps> = ({
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
  const [tollAmount, setTollAmount] = useState<number>(10);

  const handleSubmit = () => {
    if (tollAmount > 0) {
      onSubmit(tollAmount);
    }
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
      headerTitle="Add Toll Charges"
      disabledClose={isLoading}
    >
      {/* <Divider /> */}
      <View style={styles.container}>
        {/* Description for Update variant */}
        <Typography
          type="bodyLarge"
          weight="regular"
          style={styles.description}
        >
          Include any tolls paid during the trip to adjust the total fare.
        </Typography>

        {/* Toll Amount Section */}
        <View style={styles.tollAmountSection}>
          <Counter
            value={tollAmount}
            onChange={setTollAmount}
            min={1}
            max={100}
            step={1}
            formatLabel={(value) => `$${value}`}
            disabled={isLoading}
          />
        </View>
        {/* Submit Button */}
        <View style={styles.submitSection}>
          <Button
            variant="primary"
            rounded="half"
            onPress={handleSubmit}
            disabled={isLoading || tollAmount <= 0}
            loading={isLoading}
          >
            Add Toll
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
  description: {
    fontSize: 16,
    color: textColors.black,
    lineHeight: 22,
  },
  tollAmountSection: {
    marginBottom: 24,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: textColors.grey100,
    alignItems: "center",
    justifyContent: "center",
  },
  counterButtonText: {
    fontSize: 20,
    color: textColors.black,
  },
  counterButtonDisabled: {
    color: textColors.grey400,
  },
  counterValue: {
    minWidth: 80,
    height: 48,
    borderWidth: 1,
    borderColor: textColors.teal600,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: textColors.white,
  },
  counterValueText: {
    fontSize: 16,
    color: textColors.black,
  },
  noteSection: {
    gap: 12,
    marginBottom: 24,
  },
  noteLabel: {
    fontSize: 16,
    color: textColors.black,
  },
  noteTextArea: {
    marginTop: 0,
  },
  submitSection: {
    marginTop: "auto",
    paddingBottom: 20,
  },
  updateButton: {
    height: 48,
    backgroundColor: textColors.teal600,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  updateButtonText: {
    color: textColors.white,
    fontSize: 16,
    textTransform: "uppercase",
  },
});

export default AddTollBottomSheet;
