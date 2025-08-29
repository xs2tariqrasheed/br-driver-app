import Logo from "@/components/Logo";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
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
  style,
}) => {
  const isRead = messageType === "read";
  
  const handlePress = () => {
    onPress?.(id);
  };
  
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
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Logo size="Small" />
      </View>
      
      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Title Row with optional double tick */}
        <View style={styles.titleRow}>
          <Typography
            type="bodyLarge"
            weight="medium"
            style={styles.title}
          >
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
        <Typography
          type="bodySmall"
          weight="regular"
          style={styles.dateTime}
        >
          {dateTime}
        </Typography>
      </View>
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
});

export default NotificationItem;
