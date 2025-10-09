import { useNotification } from "@/context/NotificationContext";
import React, { useEffect, useRef } from "react";
import { Animated, Modal, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Notification from "../Notification";

const NotificationModal: React.FC = () => {
  const { isOpen, data, hideNotification } = useNotification();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    if (isOpen) {
      // Slide down when opening
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        hideNotification();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      // Slide up when closing
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, slideAnim, hideNotification]);

  if (!data) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={hideNotification}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={hideNotification}
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
            onDismiss={hideNotification}
            showDismissButton={true}
          />
        </Animated.View>
      </TouchableOpacity>
    </Modal>
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
