import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import Input from "@/components/Form/Input";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { NOTIFICATION_TYPES } from "@/constants/global";
import { NotificationItem } from "@/context/DriverContext";
import { useRideOffer } from "@/context/RideOfferContext";
import { formatDateTimestamp } from "@/utils/helpers";
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
  /** Whether a reply is currently being sent */
  isReplying?: boolean;
}

const NotificationBottomSheet: React.FC<NotificationBottomSheetProps> = ({
  open,
  onClose,
  notification,
  onSendReply,
  isReplying = false,
}) => {
  const [replyText, setReplyText] = useState("");
  const { showRideOfferModal, getTemporaryRide, getTemporaryRideByTripId } =
    useRideOffer();

  // Get ride offer data from temporary ride state using notification ID
  const rideOfferById = notification?.id
    ? getTemporaryRide(notification.id)
    : null;
  const rideOfferTripId = (notification as any)?.rideOfferData?.tripId as
    | string
    | undefined;
  const rideOffer =
    rideOfferById ||
    (rideOfferTripId ? getTemporaryRideByTripId(rideOfferTripId) : null);

  if (!notification) return null;

  // Format the dateTime for display
  const formattedDateTime = formatDateTimestamp(notification.dateTime);

  const handleSendReply = () => {
    if (isReplying) return; // Prevent action during processing

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
  // Allow reopening sequential offers from notifications even if hasAnyActiveOffer is false
  // (driver may have closed the modal but still wants to view/accept the offer)
  const shouldShowViewDetails = () => {
    return (
      notification?.notificationType ===
        NOTIFICATION_TYPES.SPECIAL_RIDE_OFFER && rideOffer
      // Removed hasAnyActiveOffer check to allow reopening offers from notifications
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
      snapPointsWhenKeyboardVisible={["75%", "95%"]}
      headerTitle={notification.messageTitle}
    >
      <View style={styles.container}>
        {/* Date and Time */}
        <Typography type="bodySmall" weight="regular" style={styles.dateTime}>
          {formattedDateTime}
        </Typography>

        {/* Message Body */}
        <Typography
          type="bodyMedium"
          weight="regular"
          style={styles.messageBody}
        >
          {notification.messageBody}
        </Typography>

        {/* Trip/Job details for clearer identification */}
        {(notification.pickupAddress ||
          notification.dropoffAddress ||
          notification.rideTime != null ||
          notification.rideDistance != null) && (
          <View style={{ gap: 10 }}>
            {notification.pickupAddress ? (
              <View style={styles.detailRow}>
                <Typography
                  type="bodyMedium"
                  weight="medium"
                  style={styles.detailLabel}
                >
                  PU:
                </Typography>
                <Typography
                  type="bodySmall"
                  weight="regular"
                  style={styles.detailValue}
                  numberOfLines={3}
                >
                  {notification.pickupAddress}
                </Typography>
              </View>
            ) : null}
            {notification.dropoffAddress ? (
              <View style={styles.detailRow}>
                <Typography
                  type="bodyMedium"
                  weight="medium"
                  style={styles.detailLabel}
                >
                  Drop-off
                </Typography>
                <Typography
                  type="bodySmall"
                  weight="regular"
                  style={styles.detailValue}
                  numberOfLines={3}
                >
                  {notification.dropoffAddress}
                </Typography>
              </View>
            ) : null}
            {(notification.rideTime != null ||
              notification.rideDistance != null) && (
              <View style={styles.detailRow}>
                <Typography
                  type="bodyMedium"
                  weight="medium"
                  style={styles.detailLabel}
                >
                  Time/Distance
                </Typography>
                <Typography
                  type="bodySmall"
                  weight="regular"
                  style={styles.detailValue}
                >
                  {[
                    notification.rideTime != null
                      ? `${notification.rideTime} min`
                      : null,
                    notification.rideDistance != null
                      ? `${Number(notification.rideDistance).toFixed(1)} mi`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" / ")}
                </Typography>
              </View>
            )}
          </View>
        )}

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
              disabled={isReplying}
            >
              View Details
            </Button>
          </View>
        ) : notification.isSpecial && rideOffer ? (
          /* Special notification reply section */
          <View style={styles.replySection}>
            <Input
              placeholder="Reply"
              placeholderTextColor={textColors.grey500}
              value={replyText}
              onChangeText={setReplyText}
              disabled={isReplying}
            />

            <View style={styles.buttonContainer}>
              <Button
                variant="danger"
                rounded="half"
                block="half"
                onPress={handleCancel}
                disabled={isReplying}
              >
                Cancel
              </Button>
              <Button
                rounded="half"
                block="half"
                variant="primary"
                onPress={handleSendReply}
                disabled={isReplying || !replyText.trim()}
              >
                {isReplying ? "Sending..." : "Send"}
              </Button>
            </View>
          </View>
        ) : (
          /* Regular notification done button */
          <View style={styles.doneSection}>
            <Button
              rounded="half"
              variant="primary"
              onPress={handleDone}
              disabled={isReplying}
            >
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
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 4,
  },
  detailLabel: {
    color: textColors.grey900,
  },
  detailValue: {
    color: textColors.grey900,
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
