import Header from "@/components/Header";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { useChat } from "@/context/ChatContext";
import { openPhoneDialer } from "@/utils/helpers";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MessageBubble from "./MessageBubble";

const ChatModal: React.FC = () => {
  const {
    isOpen,
    messages,
    isLoading,
    isSending,
    error,
    customerInfo,
    closeChat,
    sendMessage,
    clearError,
  } = useChat();

  const [inputText, setInputText] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Clear input when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInputText("");
      setKeyboardHeight(0);
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  const handleSend = () => {
    if (inputText.trim() && !isSending) {
      sendMessage(inputText);
      setInputText("");
    }
  };

  const handlePhoneCall = async () => {
    try {
      await openPhoneDialer(customerInfo.phone);
    } catch (error) {
      console.error("Failed to open phone dialer:", error);
    }
  };

  const renderHeader = () => (
    <Header
      title={customerInfo.name}
      onBackPress={closeChat}
      rightAccessory={
        <TouchableOpacity
          style={styles.phoneButton}
          onPress={handlePhoneCall}
          hitSlop={8}
        >
          <Image
            source={require("@/assets/images/phone-call.png")}
            style={styles.phoneIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      }
    />
  );

  const renderMessages = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={textColors.teal700} />
          <Typography
            type="bodyMedium"
            weight="regular"
            style={styles.loadingText}
          >
            Loading messages...
          </Typography>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Typography type="bodyLarge" weight="medium" style={styles.errorText}>
            {error}
          </Typography>
          <TouchableOpacity style={styles.retryButton} onPress={clearError}>
            <Typography
              type="bodyMedium"
              weight="semibold"
              style={styles.retryButtonText}
            >
              Retry
            </Typography>
          </TouchableOpacity>
        </View>
      );
    }

    if (messages.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Typography
            type="bodyLarge"
            weight="regular"
            style={styles.emptyText}
          >
            No messages yet
          </Typography>
          <Typography
            type="bodyMedium"
            weight="regular"
            style={styles.emptySubtext}
          >
            Start a conversation with {customerInfo.name}
          </Typography>
        </View>
      );
    }

    return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ScrollView>
    );
  };

  const renderInput = () => (
    <View
      style={[
        styles.inputContainer,
        {
          paddingBottom: keyboardHeight > 0 ? 12 : insets.bottom + 12,
        },
      ]}
    >
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          placeholder="Type here"
          placeholderTextColor={textColors.grey500}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!isSending}
          returnKeyType="done"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isSending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={textColors.white} />
          ) : (
            <Image
              source={require("@/assets/images/black-arrow-right.png")}
              style={[
                styles.sendIcon,
                (!inputText.trim() || isSending) && styles.sendIconDisabled,
              ]}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closeChat}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        {renderHeader()}

        <View
          style={[
            styles.content,
            {
              marginBottom: keyboardHeight > 0 ? keyboardHeight : 0,
            },
          ]}
        >
          {renderMessages()}
          {renderInput()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
  },
  phoneButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  phoneIcon: {
    width: 24,
    height: 24,
    tintColor: textColors.teal700,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    color: textColors.grey600,
    marginTop: 16,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    color: textColors.red600,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: textColors.teal700,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: textColors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    color: textColors.grey600,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    color: textColors.grey500,
    textAlign: "center",
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: textColors.white,
    borderTopWidth: 1,
    borderTopColor: textColors.grey100,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: textColors.grey100,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "SF-Pro-Display-Regular",
    color: textColors.black,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: textColors.teal700,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: textColors.grey300,
  },
  sendIcon: {
    width: 20,
    height: 20,
    tintColor: textColors.white,
  },
  sendIconDisabled: {
    tintColor: textColors.grey500,
  },
});

export default ChatModal;
