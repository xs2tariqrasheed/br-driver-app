import Logo from "@/components/Logo";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { formatDateTimestamp } from "@/utils/helpers";
import { Image } from "expo-image";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type MessageType = "read" | "unread";

export interface NotificationItemProps {
  /** Unique identifier for the notification */
  id: string;
  /** The title/heading of the notification */
  messageTitle: string;
  /** The body/description of the notification */
  messageBody: string;
  /** Date and time string for the notification */
  dateTime: string;
  /** Type of notification - determines visual appearance */
  messageType: MessageType;
  /** Optional flag to mark notification as special */
  isSpecial?: boolean;
  /** Optional callback when notification is pressed */
  onPress?: (id: string) => void;
  /** Optional callback when delete button is pressed */
  onDelete?: (id: string) => void;
  /** Optional style overrides */
  style?: StyleProp<ViewStyle>;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  messageTitle,
  messageBody,
  dateTime,
  messageType,
  isSpecial = false,
  onPress,
  onDelete,
  style,
}) => {
  const isRead = messageType === "read";

  const handlePress = () => {
    onPress?.(id);
  };

  const handleDelete = () => {
    onDelete?.(id);
  };

  // Format the dateTime for display
  const formattedDateTime = formatDateTimestamp(dateTime);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isRead ? styles.readContainer : styles.unreadContainer,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Icon - Mail icon for actionable/special notifications, Logo for read-only */}
      <View style={styles.logoContainer}>
        {isSpecial ? (
          <Image
            source={require("@/assets/images/mail.svg")}
            style={styles.mailIcon}
            contentFit="contain"
          />
        ) : (
          <Logo size="Small" />
        )}
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Title Row with optional double tick */}
        <View style={styles.titleRow}>
          <Typography type="bodyLarge" weight="medium" style={styles.title}>
            {messageTitle}
          </Typography>
          {isRead && (
            <Image
              source={require("@/assets/images/double-tick-icon.png")}
              style={styles.doubleTickIcon}
              contentFit="contain"
            />
          )}
        </View>

        {/* Message Body */}
        <Typography
          type="bodyMedium"
          weight="regular"
          style={styles.messageBody}
        >
          {messageBody}
        </Typography>

        {/* Date Time */}
        <Typography type="bodySmall" weight="regular" style={styles.dateTime}>
          {formattedDateTime}
        </Typography>
      </View>

      {/* Delete Button */}
      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.6}
        >
          <Image
            source={require("@/assets/images/delete-icon.png")}
            style={styles.deleteIcon}
            contentFit="contain"
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 6,
  },
  readContainer: {
    backgroundColor: textColors.white,
  },
  unreadContainer: {
    backgroundColor: `${textColors.teal100}66`, // 40% opacity
  },
  logoContainer: {
    marginRight: 10,
    marginTop: 2, // Small adjustment to align with text baseline
  },
  mailIcon: {
    width: 24,
    height: 24,
  },
  contentContainer: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    color: textColors.grey900,
  },
  doubleTickIcon: {
    width: 16,
    height: 16,
    marginLeft: 8,
  },
  messageBody: {
    color: textColors.grey800,
    flexWrap: "wrap",
  },
  dateTime: {
    color: textColors.grey600,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIcon: {
    width: 20,
    height: 20,
    tintColor: textColors.red500,
  },
});

export default NotificationItem;
