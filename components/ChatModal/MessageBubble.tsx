import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { Message } from "@/context/ChatContext";
import React from "react";
import { StyleSheet, View } from "react-native";

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isDriver = message.sender === "driver";
  const isSending = message.status === "sending";
  const isFailed = message.status === "failed";

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusIcon = () => {
    if (isSending) return "⏳";
    if (isFailed) return "❌";
    if (isDriver && message.status === "delivered") return "✓";
    if (isDriver) return "✓";
    return null;
  };

  return (
    <View
      style={[
        styles.container,
        isDriver ? styles.driverContainer : styles.customerContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isDriver ? styles.driverBubble : styles.customerBubble,
          isFailed && styles.failedBubble,
        ]}
      >
        <Typography
          type="bodyMedium"
          weight="regular"
          style={[
            styles.messageText,
            isDriver ? styles.driverText : styles.customerText,
            isFailed && styles.failedText,
          ]}
        >
          {message.text}
        </Typography>

        <View style={styles.timestampContainer}>
          <Typography
            type="bodySmall"
            weight="regular"
            style={[
              styles.timestamp,
              isDriver ? styles.driverTimestamp : styles.customerTimestamp,
            ]}
          >
            {formatTime(message.timestamp)}
          </Typography>

          {getStatusIcon() && (
            <Typography
              type="bodySmall"
              weight="regular"
              style={[
                styles.statusIcon,
                isDriver ? styles.driverTimestamp : styles.customerTimestamp,
              ]}
            >
              {getStatusIcon()}
            </Typography>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  driverContainer: {
    alignItems: "flex-end",
  },
  customerContainer: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: textColors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  driverBubble: {
    backgroundColor: textColors.teal800,
    borderBottomRightRadius: 4,
  },
  customerBubble: {
    backgroundColor: textColors.grey100,
    borderBottomLeftRadius: 4,
  },
  failedBubble: {
    backgroundColor: textColors.red100,
    borderColor: textColors.red300,
    borderWidth: 1,
  },
  messageText: {
    lineHeight: 20,
  },
  driverText: {
    color: textColors.white,
  },
  customerText: {
    color: textColors.black,
  },
  failedText: {
    color: textColors.red700,
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  driverTimestamp: {
    color: textColors.white,
    opacity: 0.8,
  },
  customerTimestamp: {
    color: textColors.grey600,
  },
  statusIcon: {
    fontSize: 10,
  },
});

export default MessageBubble;
