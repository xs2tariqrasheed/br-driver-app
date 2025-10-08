import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import Input from "@/components/Form/Input";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { NOTIFICATION_TYPES } from "@/constants/global";
import { NotificationItem } from "@/context/DriverContext";
import { useRideOffer } from "@/context/RideOfferContext";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export interface NotificationBottomSheetProps {
  /** Controls whether the bottom sheet is visible */
  open: boolean;
  /** Callback when the bottom sheet is closed */
  onClose: () => void;
  /** The notification data to display */
  notification: NotificationItem | null;
  /** Callback when reply is sent (only for special notifications) */
  onSendReply?: (reply: string) => void;
}

const NotificationBottomSheet: React.FC<NotificationBottomSheetProps> = ({
  open,
  onClose,
  notification,
  onSendReply,
}) => {
  const [replyText, setReplyText] = useState("");
  const { showRideOfferModal, hasAnyActiveOffer, getTemporaryRide } =
    useRideOffer();

  // Get ride offer data from temporary ride state using notification ID
  const rideOffer = notification?.id ? getTemporaryRide(notification.id) : null;

  if (!notification) return null;

  const handleSendReply = () => {
    if (!replyText.trim()) {
      Alert.alert("Error", "Please enter a reply message");
      return;
    }

    onSendReply?.(replyText.trim());
    setReplyText("");
    onClose();
  };

  const handleCancel = () => {
    setReplyText("");
    onClose();
  };

  const handleDone = () => {
    onClose();
  };

  // Check if we should show the "View Details" button
  const shouldShowViewDetails = () => {
    return (
      notification?.notificationType ===
        NOTIFICATION_TYPES.SPECIAL_RIDE_OFFER &&
      rideOffer &&
      hasAnyActiveOffer
    );
  };

  const handleViewDetails = () => {
    if (rideOffer) {
      showRideOfferModal(rideOffer);
      onClose(); // Close the bottom sheet when opening the ride offer modal
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      snapPointsWhenKeyboardVisible={["60%", "90%"]}
      headerTitle={notification.messageTitle}
    >
      <View style={styles.container}>
        {/* Date and Time */}
        <Typography type="bodySmall" weight="regular" style={styles.dateTime}>
          {notification.dateTime}
        </Typography>

        {/* Message Body */}
        <Typography
          type="bodyMedium"
          weight="regular"
          style={styles.messageBody}
        >
          {notification.messageBody}
        </Typography>

        {/* Expired Offer Message */}
        {notification?.notificationType ===
          NOTIFICATION_TYPES.SPECIAL_RIDE_OFFER &&
          !rideOffer && (
            <View style={styles.expiredSection}>
              <Typography
                type="bodyMedium"
                weight="medium"
                style={styles.expiredText}
              >
                This offer has expired and is no longer available.
              </Typography>
            </View>
          )}

        {/* Special ride offer notification section */}
        {shouldShowViewDetails() ? (
          <View style={styles.specialRideOfferSection}>
            <Button
              rounded="half"
              variant="primary"
              onPress={handleViewDetails}
            >
              View Details
            </Button>
          </View>
        ) : notification.isSpecial ? (
          /* Special notification reply section */
          <View style={styles.replySection}>
            <Input
              placeholder="Reply"
              placeholderTextColor={textColors.grey500}
              value={replyText}
              onChangeText={setReplyText}
            />

            <View style={styles.buttonContainer}>
              <Button
                variant="danger"
                rounded="half"
                block="half"
                onPress={handleCancel}
              >
                Cancel
              </Button>
              <Button
                rounded="half"
                block="half"
                variant="primary"
                onPress={handleSendReply}
              >
                Send
              </Button>
            </View>
          </View>
        ) : (
          /* Regular notification done button */
          <View style={styles.doneSection}>
            <Button rounded="half" variant="primary" onPress={handleDone}>
              Done
            </Button>
          </View>
        )}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  dateTime: {
    color: textColors.grey600,
  },
  messageBody: {
    color: textColors.grey800,
    lineHeight: 20,
  },
  replySection: {
    flex: 1,
    gap: 16,
    marginTop: 8,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: textColors.grey200,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: "SF-Pro-Display-Regular",
    color: textColors.grey900,
    minHeight: 80,
    maxHeight: 120,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: "auto",
    paddingBottom: 20,
  },
  button: {
    flex: 1,
    borderRadius: 25,
    paddingVertical: 12,
  },
  cancelButton: {
    backgroundColor: textColors.red500,
  },
  cancelButtonText: {
    color: textColors.white,
    fontWeight: "600",
  },
  sendButton: {
    backgroundColor: textColors.teal700,
  },
  sendButtonText: {
    color: textColors.white,
    fontWeight: "600",
  },
  doneSection: {
    marginTop: "auto",
    paddingBottom: 20,
  },
  doneButton: {
    backgroundColor: textColors.teal700,
    borderRadius: 25,
    paddingVertical: 12,
  },
  doneButtonText: {
    color: textColors.white,
    fontWeight: "600",
  },
  specialRideOfferSection: {
    marginTop: "auto",
    paddingBottom: 20,
  },
  viewDetailsButton: {
    backgroundColor: textColors.teal700,
    borderRadius: 25,
    paddingVertical: 12,
  },
  expiredSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: textColors.red0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: textColors.red200,
  },
  expiredText: {
    color: textColors.red600,
    textAlign: "center",
  },
});

export default NotificationBottomSheet;
