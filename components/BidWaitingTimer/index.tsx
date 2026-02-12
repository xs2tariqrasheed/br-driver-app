import { textColors } from "@/constants/colors";
import { BID_WAITING_TIMER_CONTENT_KEYS } from "@/content/components/bid-waiting-timer-keys";
import { useGetContent } from "@/hooks/useGetContent";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import CustomBottomSheet from "../BottomSheet";
import Button from "../Button";
import Progress from "../Progress";
import Typography from "../Typography";

export interface BidWaitingTimerProps {
  /**
   * Duration of the progress timer in milliseconds
   */
  progressDuration: number;

  /**
   * Callback function triggered when the progress timer completes
   */
  onCompleteProgress: () => void;

  /**
   * Callback function triggered when the cancel button is pressed
   */
  onCancel: () => void;

  /**
   * Whether the bottom sheet is open/visible
   * @default false
   */
  open?: boolean;

  /**
   * Snap points for the bottom sheet
   * @default ["40%"]
   */
  snapPoints?: (string | number)[];

  /**
   * Initial snap index
   * @default 0
   */
  initialSnapIndex?: number;

  /**
   * Whether to show the header
   * @default false
   */
  showHeader?: boolean;

  /**
   * Whether to show backdrop
   * @default true
   */
  backdrop?: boolean | ((props: any) => React.ReactElement);

  /**
   * Whether to allow swipe to close
   * @default false
   */
  swipeToClose?: boolean;
}

const BidWaitingTimer: React.FC<BidWaitingTimerProps> = ({
  progressDuration,
  onCompleteProgress,
  onCancel,
  open = false,
  snapPoints = ["40%"],
  initialSnapIndex = 0,
}) => {
  // Get content
  const { getContent } = useGetContent();
  const { headerWaiting, descriptionWaiting, buttonCancel } = useMemo(() => {
    const get = getContent;
    return {
      headerWaiting: get(BID_WAITING_TIMER_CONTENT_KEYS.HEADER_WAITING),
      descriptionWaiting: get(
        BID_WAITING_TIMER_CONTENT_KEYS.DESCRIPTION_WAITING,
      ),
      buttonCancel: get(BID_WAITING_TIMER_CONTENT_KEYS.BUTTON_CANCEL),
    };
  }, [getContent]);

  return (
    <CustomBottomSheet
      open={open}
      snapPoints={snapPoints}
      initialSnapIndex={initialSnapIndex}
      headerTitle={headerWaiting}
      disabledClose={true}
    >
      <View style={styles.container}>
        {/* Description */}
        <Typography
          type="bodyLarge"
          weight="regular"
          style={styles.description}
        >
          {descriptionWaiting}
        </Typography>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Progress
            progress={1}
            duration={progressDuration}
            direction="left-to-right"
            onComplete={onCompleteProgress}
            color={[textColors.teal850]}
            unfilledColor={textColors.black}
          />
        </View>

        {/* Cancel Button */}
        <View style={styles.buttonContainer}>
          <Button
            variant="outlined"
            onPress={onCancel}
            style={styles.cancelButton}
          >
            {buttonCancel}
          </Button>
        </View>
      </View>
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  description: {
    color: textColors.black,
    marginBottom: 32,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 32,
  },
  buttonContainer: {
    width: "100%",
  },
  cancelButton: {
    backgroundColor: textColors.white,
    borderColor: textColors.red500,
    borderWidth: 1,
    borderRadius: 8,
  },
});

export default BidWaitingTimer;
