import { NOTIFICATION_TYPES, SPEECH_MESSAGES } from "@/constants/global";
import { useModalManager } from "@/context/ModalManagerContext";
import { useNotification } from "@/context/NotificationContext";
import { useSettings } from "@/context/SettingsContext";
import { speechManager } from "@/utils/speechManager";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity } from "react-native";
import { Portal } from "react-native-portalize";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Notification from "../Notification";

const NotificationModal: React.FC = () => {
  const { isOpen, data, hideNotification } = useNotification();
  const [settings] = useSettings();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const hasSpokenRef = useRef(false);
  const { registerModal, unregisterModal } = useModalManager();

  // Register with Modal Manager so it can be closed centrally
  useEffect(() => {
    registerModal("notification", () => hideNotification());
    return () => unregisterModal("notification");
  }, [registerModal, unregisterModal, hideNotification]);

  useEffect(() => {
    if (isOpen && data) {
      // Slide down when opening
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Speak the notification message only once
      const speakMessage = async () => {
        // Only speak if we haven't spoken for this notification yet
        if (!hasSpokenRef.current) {
          hasSpokenRef.current = true;

          // Check mute settings
          const isJobOfferType =
            !data.type ||
            data.type === NOTIFICATION_TYPES.SPECIAL_RIDE_OFFER ||
            data.type === NOTIFICATION_TYPES.INFO;

          const shouldMuteJobOffer =
            isJobOfferType &&
            (settings.notifications.muteJobOffers ||
              settings.notifications.muteAll);
          const shouldMuteAll = settings.notifications.muteAll;

          // Determine if we should skip speaking
          if (shouldMuteAll || shouldMuteJobOffer) {
            return; // Skip speaking
          }

          let message: string = SPEECH_MESSAGES.NEW_RIDE_OFFER; // Default message

          // Determine speech message based on notification type
          if (data.type) {
            switch (data.type) {
              case NOTIFICATION_TYPES.SPECIAL_RIDE_OFFER:
                message = SPEECH_MESSAGES.NEW_BROADCAST_JOB;
                break;
              case NOTIFICATION_TYPES.AUTHORIZATION:
                message = SPEECH_MESSAGES.MAKE_STOP;
                break;
              case NOTIFICATION_TYPES.MESSAGE:
                message = SPEECH_MESSAGES.NEW_MESSAGE;
                break;
              default:
                message = SPEECH_MESSAGES.NEW_RIDE_OFFER;
            }
          }

          await speechManager.speak(message);
        }
      };

      speakMessage();

      // Auto-hide after 5 seconds (only if autoHide is not explicitly set to false)
      const timer = setTimeout(() => {
        if (data.autoHide === false) return;

        // Reset speech flag for next notification
        hasSpokenRef.current = false;

        hideNotification();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      // Stop any current speech when closing
      speechManager.stop();

      // Reset speech flag for next notification
      hasSpokenRef.current = false;

      // Slide up when closing
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, data, slideAnim, hideNotification, settings]);

  // Handle manual close (when user clicks close button or backdrop)
  const handleClose = () => {
    console.log(
      "🔔 NotificationModal: User closed notification (modal:",
      data?.modal || false,
      ")"
    );
    // Stop any current speech
    speechManager.stop();

    // Reset speech flag for next notification
    hasSpokenRef.current = false;

    // Close immediately
    hideNotification();
  };

  if (!data) return null;

  // If the notification should be displayed as a modal, let the Notification component handle it
  if (data.modal) {
    return (
      <Portal>
        <Notification
          type={data.type}
          title={data.title}
          subtitle={data.subtitle}
          message={data.message}
          visible={isOpen}
          onDismiss={handleClose}
          onBackdropPress={handleClose}
          showDismissButton={true}
          modal={true}
        />
      </Portal>
    );
  }

  // Regular notification (slide down from top)
  return (
    isOpen ? (
      <Portal>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.container,
              {
                top: insets.top + 10,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Notification
              type={data.type}
              title={data.title}
              subtitle={data.subtitle}
              message={data.message}
              visible={true}
              onDismiss={handleClose}
              showDismissButton={true}
              modal={false}
            />
          </Animated.View>
        </TouchableOpacity>
      </Portal>
    ) : null
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 1000,
  },
});

export default NotificationModal;
