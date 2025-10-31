import Header from "@/components/Header";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { useChat } from "@/context/ChatContext";
import { openPhoneDialer } from "@/utils/helpers";
import { useToast } from "@/components/Toast";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MessageBubble from "@/components/ChatModal/MessageBubble";

export default function ChatScreen() {
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
  const { showToast } = useToast();

  useEffect(() => {
    if (messages && messages.length > 0 && scrollViewRef.current) {
      try {
        setTimeout(() => {
          try {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          } catch (scrollError: any) {
            console.error("Error scrolling to end:", scrollError);
          }
        }, 100);
      } catch (error: any) {
        console.error("Error in auto-scroll effect:", error);
      }
    }
  }, [messages?.length]);

  useEffect(() => {
    if (!isOpen) {
      setInputText("");
      setKeyboardHeight(0);
    }
  }, [isOpen]);

  useEffect(() => {
    let keyboardWillShowListener: any = null;
    let keyboardWillHideListener: any = null;

    try {
      const keyboardEventName =
        Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
      const keyboardHideEventName =
        Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

      keyboardWillShowListener = Keyboard.addListener(
        keyboardEventName,
        (e) => {
          try {
            if (e?.endCoordinates?.height) {
              setKeyboardHeight(e.endCoordinates.height);
            }
          } catch (error: any) {
            console.error("Error handling keyboard show:", error);
          }
        }
      );

      keyboardWillHideListener = Keyboard.addListener(
        keyboardHideEventName,
        () => {
          try {
            setKeyboardHeight(0);
          } catch (error: any) {
            console.error("Error handling keyboard hide:", error);
          }
        }
      );
    } catch (error: any) {
      console.error("Error setting up keyboard listeners:", error);
    }

    return () => {
      try {
        keyboardWillShowListener?.remove();
        keyboardWillHideListener?.remove();
      } catch (error: any) {
        console.error("Error removing keyboard listeners:", error);
      }
    };
  }, []);

  const handleSend = () => {
    try {
      if (!inputText.trim() || isSending) {
        return;
      }

      if (!sendMessage) {
        console.error("sendMessage function is not available");
        showToast("Unable to send message. Please try again.", "error", "top");
        return;
      }

      const messageText = inputText.trim();
      if (messageText.length === 0) {
        return;
      }

      sendMessage(messageText);
      setInputText("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      showToast(
        error?.message || "Failed to send message. Please try again.",
        "error",
        "top"
      );
    }
  };

  const handlePhoneCall = async () => {
    try {
      if (!customerInfo?.phone) {
        showToast("Phone number is not available.", "error", "top");
        return;
      }

      await openPhoneDialer(customerInfo.phone);
    } catch (error: any) {
      console.error("Failed to open phone dialer:", error);
      showToast(
        error?.message || "Unable to make phone call. Please try again.",
        "error",
        "top"
      );
    }
  };

  const renderHeader = () => {
    try {
      const customerName = customerInfo?.name || "Customer";
      return (
        <Header
          title={customerName}
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
    } catch (error: any) {
      console.error("Error rendering header:", error);
      return (
        <Header
          title="Chat"
          onBackPress={closeChat}
        />
      );
    }
  };

  const renderMessages = () => {
    try {
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
              {error || "An error occurred"}
            </Typography>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                try {
                  clearError?.();
                } catch (error: any) {
                  console.error("Error clearing error:", error);
                }
              }}
            >
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

      const safeMessages = Array.isArray(messages) ? messages : [];
      const customerName = customerInfo?.name || "Customer";

      if (safeMessages.length === 0) {
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
              Start a conversation with {customerName}
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
          {safeMessages.map((message, index) => {
            try {
              if (!message || !message.id) {
                console.warn("Invalid message at index:", index);
                return null;
              }
              return <MessageBubble key={message.id} message={message} />;
            } catch (error: any) {
              console.error(`Error rendering message at index ${index}:`, error);
              return null;
            }
          })}
        </ScrollView>
      );
    } catch (error: any) {
      console.error("Error rendering messages:", error);
      return (
        <View style={styles.errorContainer}>
          <Typography type="bodyLarge" weight="medium" style={styles.errorText}>
            Unable to load messages. Please try again.
          </Typography>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              try {
                if (closeChat) {
                  closeChat();
                }
              } catch (error: any) {
                console.error("Error closing chat:", error);
              }
            }}
          >
            <Typography
              type="bodyMedium"
              weight="semibold"
              style={styles.retryButtonText}
            >
              Close
            </Typography>
          </TouchableOpacity>
        </View>
      );
    }
  };

  const renderInput = () => {
    try {
      return (
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: keyboardHeight > 0 ? 12 : (insets?.bottom || 0) + 12,
            },
          ]}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type here"
              placeholderTextColor={textColors.grey500}
              value={inputText || ""}
              onChangeText={(text) => {
                try {
                  setInputText(text);
                } catch (error: any) {
                  console.error("Error updating input text:", error);
                }
              }}
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
                (!inputText?.trim() || isSending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText?.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={textColors.white} />
              ) : (
                <Image
                  source={require("@/assets/images/black-arrow-right.png")}
                  style={[
                    styles.sendIcon,
                    (!inputText?.trim() || isSending) && styles.sendIconDisabled,
                  ]}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    } catch (error: any) {
      console.error("Error rendering input:", error);
      return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
  );
}

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


