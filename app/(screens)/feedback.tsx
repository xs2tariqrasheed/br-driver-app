import Button from "@/components/Button";
import TextArea from "@/components/Form/TextArea";
import Header from "@/components/Header";
import InfoTable, { InfoTableDataItem } from "@/components/InfoTable";
import Logo from "@/components/Logo";
import Rating from "@/components/Rating";
import { ThemedView } from "@/components/ThemedView";
import { useToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { router, Stack } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FeedbackScreen: React.FC = () => {
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Dummy fare data as per the screenshot
  const fareItems: InfoTableDataItem[] = [
    { label: "Ride Price", value: "$20.25" },
    { label: "Tolls", value: "$0.75" },
    { label: "Discount", value: "$0.00" },
    { label: "UnBilled Tolls", value: "$4.00" },
    { label: "Extra Wait Time", value: "$05.00" },
    { label: "Additional Stops", value: "$10.00" },
  ];

  // Handle keyboard events
  useEffect(() => {
    const keyboardEventName =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const keyboardHideEventName =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardWillShowListener = Keyboard.addListener(
      keyboardEventName,
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to comments section when keyboard appears
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      keyboardHideEventName,
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  const handleSkip = () => {
    // Navigate to home screen
    router.replace("/(tabs)");
  };

  const handleSubmit = async () => {
    showToast("Feedback submitted successfully!", "success", "top");
    router.replace("/(tabs)");
    return;
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.innerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        {/* Header */}
        <Header title="Ride Completed" hideBackIcon={true} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom:
                  keyboardHeight > 0 ? keyboardHeight + 20 : insets.bottom + 100,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Logo />
            </View>

            {/* Fare Summary */}
            <InfoTable
              title="Fare Summary"
              data={fareItems}
              showFooter={true}
            />

            {/* Rate Your Rider Section */}
            <View style={styles.ratingSection}>
              <Typography
                type="headingSmall"
                weight="bold"
                style={styles.ratingTitle}
              >
                Rate Your Rider
              </Typography>
              <Typography
                type="bodyMedium"
                weight="regular"
                style={styles.ratingQuestion}
              >
                How was your experience with this passenger?
              </Typography>
              <View style={styles.ratingContainer}>
                <Rating rating={rating} onRatingChange={setRating} size={48} />
              </View>
            </View>

            {/* Add Comments Section */}
            <View style={styles.commentsSection}>
              <TextArea
                label="Add Comments"
                placeholder="Type Here"
                value={comments}
                onChangeText={setComments}
                numberOfLines={4}
                style={styles.textArea}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                variant="outlined"
                block="half"
                rounded="half"
                onPress={handleSkip}
                style={styles.skipButton}
              >
                Skip
              </Button>
              <Button
                variant="primary"
                block="half"
                rounded="half"
                onPress={handleSubmit}
                style={styles.submitButton}
              >
                Submit
              </Button>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      </ThemedView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
  },
  innerContainer: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: textColors.black,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  ratingSection: {
    marginVertical: 20,
  },
  ratingTitle: {
    color: textColors.black,
    marginBottom: 8,
  },
  ratingQuestion: {
    color: textColors.grey700,
    marginBottom: 16,
  },
  ratingContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  commentsSection: {
    marginVertical: 20,
  },
  textArea: {
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  skipButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});

export default FeedbackScreen;
