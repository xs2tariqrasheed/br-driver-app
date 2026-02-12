import { textColors } from "@/constants/colors";
import { BID_WAITING_TIMER_CONTENT_KEYS } from "@/content/components/bid-waiting-timer-keys";
import { useOverlayInsets } from "@/context/OverlayInsetsContext";
import { useGetContent } from "@/hooks/useGetContent";
import React, { useCallback, useMemo } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "../Button";
import ProgressTimer from "../ProgressTimer";
import Typography from "../Typography";

export interface BidWaitingTimerModalProps {
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
   * Whether the modal is open/visible
   * @default false
   */
  open?: boolean;

  /** Inline confirmation mode without closing the modal */
  isConfirming?: boolean;
  /** Whether the cancel bid API call is in progress */
  isCanceling?: boolean;
  onKeepWaiting?: () => void;
  onConfirmCancel?: () => void;
}

/**
 * BidWaitingTimerModal Component
 *
 * A modal component that displays a progress timer while waiting for
 * customer response to a bid. Matches the UI style of SpecialRequirementsModal
 * and PackageInfoModal.
 */
const BidWaitingTimerModal: React.FC<BidWaitingTimerModalProps> = ({
  progressDuration,
  onCancel,
  onCompleteProgress,
  open = false,
  isConfirming = false,
  isCanceling = false,
  onKeepWaiting,
  onConfirmCancel,
}) => {
  const { overlayBottomInset } = useOverlayInsets();
  const handleCompleteProgress = useCallback(() => {
    // onCompleteProgress from context already handles showing expired sheet and hiding timer
    onCompleteProgress();
  }, [onCompleteProgress]);

  // Get content
  const { getContent } = useGetContent();
  const {
    headerWaiting,
    headerCancelBid,
    descriptionWaiting,
    descriptionConfirm,
    buttonKeepWaiting,
    buttonCancelBid,
    buttonCanceling,
    buttonCancel,
  } = useMemo(() => {
    const get = getContent;
    return {
      headerWaiting: get(BID_WAITING_TIMER_CONTENT_KEYS.HEADER_WAITING),
      headerCancelBid: get(BID_WAITING_TIMER_CONTENT_KEYS.HEADER_CANCEL_BID),
      descriptionWaiting: get(
        BID_WAITING_TIMER_CONTENT_KEYS.DESCRIPTION_WAITING,
      ),
      descriptionConfirm: get(
        BID_WAITING_TIMER_CONTENT_KEYS.DESCRIPTION_CONFIRM,
      ),
      buttonKeepWaiting: get(
        BID_WAITING_TIMER_CONTENT_KEYS.BUTTON_KEEP_WAITING,
      ),
      buttonCancelBid: get(BID_WAITING_TIMER_CONTENT_KEYS.BUTTON_CANCEL_BID),
      buttonCanceling: get(BID_WAITING_TIMER_CONTENT_KEYS.BUTTON_CANCELING),
      buttonCancel: get(BID_WAITING_TIMER_CONTENT_KEYS.BUTTON_CANCEL),
    };
  }, [getContent]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={
        isCanceling
          ? undefined
          : isConfirming
            ? onKeepWaiting || onCancel
            : onCancel
      }
      presentationStyle={Platform.OS === "ios" ? "overFullScreen" : undefined}
      statusBarTranslucent={Platform.OS === "android"}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={isCanceling || isConfirming ? undefined : onCancel}
        disabled={isCanceling || isConfirming}
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
              {isConfirming ? headerCancelBid : headerWaiting}
            </Typography>
            <View style={styles.placeholder} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={
                isCanceling
                  ? undefined
                  : isConfirming
                    ? onKeepWaiting || onCancel
                    : onCancel
              }
              disabled={isCanceling}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View
            style={[styles.content, { paddingBottom: 20 + overlayBottomInset }]}
          >
            {/* Description */}
            <Typography
              type="bodyLarge"
              weight="regular"
              style={styles.description}
            >
              {isConfirming ? descriptionConfirm : descriptionWaiting}
            </Typography>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <ProgressTimer
                duration={progressDuration}
                onComplete={handleCompleteProgress}
                isActive={open && !isCanceling}
              />
            </View>

            {/* Action Buttons */}
            {isConfirming ? (
              <View style={styles.actionRow}>
                <View style={styles.actionCol}>
                  <Button
                    variant="outlined"
                    rounded="half"
                    onPress={onKeepWaiting}
                    style={styles.cancelButton}
                    disabled={isCanceling}
                  >
                    {buttonKeepWaiting}
                  </Button>
                </View>
                <View style={[styles.actionCol, styles.actionColSpacing]}>
                  <Button
                    variant="danger"
                    rounded="half"
                    onPress={onConfirmCancel}
                    disabled={isCanceling}
                    loading={isCanceling}
                  >
                    {isCanceling ? buttonCanceling : buttonCancelBid}
                  </Button>
                </View>
              </View>
            ) : (
              <View style={styles.buttonContainer}>
                <Button
                  variant="outlined"
                  onPress={onCancel}
                  style={styles.cancelButton}
                  disabled={isCanceling}
                >
                  {isCanceling ? buttonCanceling : buttonCancel}
                </Button>
              </View>
            )}
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
    ...(Platform.OS === "ios" ? {} : { zIndex: 10001, elevation: 10001 }),
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
    borderBottomColor: textColors.grey100,
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
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 20,
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
  actionRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  actionCol: {
    flex: 1,
  },
  actionColSpacing: {
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: textColors.white,
    borderColor: textColors.red500,
    borderWidth: 1,
    borderRadius: 8,
  },
});

export default BidWaitingTimerModal;
