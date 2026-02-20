import { textColors } from "@/constants/colors";
import React from "react";
import { StyleSheet, View } from "react-native";
import CustomBottomSheet from "../BottomSheet";
import Button from "../Button";
import Typography from "../Typography";

export interface ConfirmationSheetProps {
  /**
   * Whether the bottom sheet is open/visible
   * @default false
   */
  open: boolean;
  /**
   * Title of the confirmation sheet
   */
  title: string;

  /**
   * Description of the confirmation sheet
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
  /**
   * Loading state for confirm action. Disables both actions while true.
   */
  loading?: boolean;
}

const ConfirmationSheet: React.FC<ConfirmationSheetProps> = ({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  cancelButtonText,
  confirmButtonText,
  loading = false,
}) => {
  return (
    <CustomBottomSheet
      open={open}
      snapPoints={["40%"]}
      initialSnapIndex={0}
      showHeader={false}
      backdrop={true}
      swipeToClose={false}
      onClose={loading ? undefined : onCancel}
    >
      <View style={styles.sheetContainer}>
        <Typography
          type="titleMedium"
          weight="semibold"
          style={styles.sheetTitleText}
        >
          {title}
        </Typography>
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
            onPress={loading ? undefined : onCancel}
            disabled={loading}
          >
            {cancelButtonText}
          </Button>
          <Button
            variant="danger"
            rounded="half"
            block="half"
            onPress={loading ? undefined : onConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmButtonText}
          </Button>
        </View>
      </View>
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    paddingTop: 12,
    backgroundColor: textColors.white,
    gap: 12,
  },
  sheetTitleText: {
    color: textColors.black,
  },
  sheetDescriptionText: {
    color: textColors.black,
  },
  sheetButtonsRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
  },
});

export default ConfirmationSheet;
