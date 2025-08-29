import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import Input from "@/components/Form/Input";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { NotificationItem } from "@/context/DriverContext";
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

        {/* Special notification reply section */}
        {notification.isSpecial ? (
          <View style={styles.replySection}>
            <Input
              placeholder="Reply"
              placeholderTextColor={textColors.grey500}
              value={replyText}
              onChangeText={setReplyText}
            />

            <View style={styles.buttonContainer}>
              <Button
                rounded="half"
                block="half"
                variant="danger"
                onPress={handleCancel}
                style={[styles.button, styles.cancelButton]}
              >
                Cancel
              </Button>
              <Button
                rounded="half"
                block="half"
                variant="primary"
                onPress={handleSendReply}
                style={[styles.button, styles.sendButton]}
              >
                Send
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
              style={[styles.button, styles.doneButton]}
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
});

export default NotificationBottomSheet;
