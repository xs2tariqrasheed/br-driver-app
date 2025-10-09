/**
 * Custom Notification Component
 *
 * A reusable notification component that displays important messages to users.
 * Based on the Blink Ride app design with proper Typography and styling.
 *
 * Usage:
 * <Notification
 *   type="authorization"
 *   title="Blink Ride"
 *   subtitle="Authorization"
 *   message="Please make a stop as requested by the customer and wait 8 mins you will be paid extra for this stop"
 *   onDismiss={() => console.log('Notification dismissed')}
 * />
 */

import { textColors } from "@/constants/colors";
import { NotificationType } from "@/constants/global";
import React from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Logo from "../Logo";
import Typography from "../Typography";

export interface NotificationProps {
  /**
   * Type of notification that determines the icon and styling
   */
  type: NotificationType;
  /**
   * Main title of the notification (e.g., "Blink Ride")
   */
  title: string;
  /**
   * Subtitle or category (e.g., "Authorization")
   */
  subtitle?: string;
  /**
   * Main message content
   */
  message: string;
  /**
   * Whether the notification is visible
   */
  visible?: boolean;
  /**
   * Callback when notification is dismissed
   */
  onDismiss?: () => void;
  /**
   * Custom style for the container
   */
  style?: ViewStyle;
  /**
   * Whether to show the dismiss button
   */
  showDismissButton?: boolean;
  /**
   * Whether to display as a modal with backdrop
   */
  modal?: boolean;
  /**
   * Callback when backdrop is pressed (only works when modal is true)
   */
  onBackdropPress?: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  subtitle,
  message,
  visible = true,
  onDismiss,
  style,
  showDismissButton = false,
  modal = false,
  onBackdropPress,
}) => {
  if (!visible) return null;

  const renderNotificationContent = () => (
    <View style={styles.notificationContainer}>
      <View style={styles.content}>
        {/* Icon Section */}
        <View style={styles.iconContainer}>
          <Logo size="Medium" style={styles.logo} />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <View style={styles.headerContainer}>
            <Typography type="bodyLarge" weight="bold" style={styles.title}>
              {title}
            </Typography>
            {subtitle && (
              <Typography
                type="bodySmall"
                weight="medium"
                style={styles.subtitle}
              >
                {subtitle}
              </Typography>
            )}
          </View>
          {/* <Typography type="bodyMedium" weight="regular" style={styles.message}>
          {message}
        </Typography> */}
        </View>
        {/* Dismiss Button */}
        {showDismissButton && onDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Typography
              type="bodyLarge"
              weight="bold"
              style={styles.dismissText}
            >
              ×
            </Typography>
          </TouchableOpacity>
        )}
      </View>
      <Typography type="bodyMedium" weight="regular" style={styles.message}>
        {message}
      </Typography>
    </View>
  );

  if (modal) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={onBackdropPress}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onBackdropPress}
        >
          <TouchableOpacity
            style={[styles.modalContainer, style]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {renderNotificationContent()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }

  return (
    <View style={[styles.container, style]}>{renderNotificationContent()}</View>
  );
};

const styles = StyleSheet.create({
  notificationContainer: {
    backgroundColor: textColors.white,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 16,
    shadowColor: textColors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 34, // Account for status bar
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    marginHorizontal: 16,
  },
  content: {
    backgroundColor: textColors.white,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "transparent",
  },
  logo: {
    // LOGO component handles its own sizing (24x24 for Small)
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  headerContainer: {
    marginBottom: 4,
  },
  title: {
    color: textColors.black,
    marginBottom: 2,
  },
  subtitle: {
    color: textColors.grey600,
  },
  message: {
    color: textColors.grey800,
    lineHeight: 20,
  },
  dismissButton: {
    borderWidth: 1,
    borderColor: textColors.grey300,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    paddingBottom: 4,
  },
  dismissText: {
    color: textColors.black,
    fontSize: 18,
    lineHeight: 20,
  },
});

export default Notification;
