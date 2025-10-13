import { textColors } from "@/constants/colors";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import CustomBottomSheet from "../BottomSheet";
import Button from "../Button";
import Counter from "../Counter";
import TextArea from "../Form/TextArea";
import Typography from "../Typography";

export interface ETABottomSheetProps {
  open?: boolean;
  onClose: () => void;
  onSubmit: (eta: number, note?: string) => void;
  snapPoints?: (string | number)[];
  initialSnapIndex?: number;
  showHeader?: boolean;
  backdrop?: boolean | ((props: any) => React.ReactElement);
  swipeToClose?: boolean;
  snapPointsWhenKeyboardVisible?: (string | number)[];
  isLoading?: boolean;
  // Update ETA specific props
  variant?: "default" | "update";
  description?: string;
  showNoteSection?: boolean;
  buttonText?: string;
  headerTitle?: string;
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
  variant = "default",
  description,
  showNoteSection = false,
  buttonText = "Submit",
  headerTitle = "Provide ETA",
  snapPointsWhenKeyboardVisible,
}) => {
  const [eta, setEta] = useState(15); // Default 15 minutes
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (showNoteSection) {
      onSubmit(eta, note);
    } else {
      onSubmit(eta);
    }
  };

  return (
    <CustomBottomSheet
      scrollable
      open={open}
      onClose={onClose}
      snapPoints={snapPoints}
      initialSnapIndex={snapPointsWhenKeyboardVisible ? 1 : initialSnapIndex}
      showHeader={showHeader}
      backdrop={backdrop}
      swipeToClose={swipeToClose}
      headerTitle={headerTitle}
      snapPointsWhenKeyboardVisible={snapPointsWhenKeyboardVisible}
      disabledClose={isLoading}
    >
      {/* <Divider /> */}
      <View style={styles.container}>
        {/* Description for Update variant */}
        {variant === "update" && description && (
          <Typography
            type="bodyLarge"
            weight="regular"
            style={styles.description}
          >
            {description}
          </Typography>
        )}

        {/* ETA Section */}
        <View
          style={[
            styles.etaSection,
            variant === "update"
              ? styles.etaSectionUpdate
              : styles.etaSectionDefault,
          ]}
        >
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

        {/* Note Section for Update variant */}
        {variant === "update" && showNoteSection && (
          <View style={styles.noteSection}>
            <Typography
              type="bodyLarge"
              weight="medium"
              style={styles.noteLabel}
            >
              Add a Note
            </Typography>
            <TextArea
              placeholder="eg. Heavy traffic on main road."
              value={note}
              onChangeText={setNote}
              numberOfLines={3}
              style={styles.noteTextArea}
              returnKeyType="done"
              blurOnSubmit={true}
            />
          </View>
        )}

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <Button
            variant="primary"
            rounded="half"
            onPress={handleSubmit}
            disabled={isLoading}
            loading={isLoading}
          >
            {buttonText || "Submit"}
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
    marginBottom: 24,
  },
  etaSection: {
    marginBottom: 24,
  },
  etaSectionDefault: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  etaSectionUpdate: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  etaSectionTitle: {
    marginTop: 16,
    color: textColors.black,
  },
  etaCounterContainer: {
    width: "50%",
  },
  updateCounter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
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

export default ETABottomSheet;
