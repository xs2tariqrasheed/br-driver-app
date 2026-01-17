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
import { ACTIVE_TRIP_ROUTES } from "@/constants/endpoints";
import { API_CLIENT_TYPES } from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { usePost } from "@/hooks/usePost";
import { router, Stack, useLocalSearchParams } from "expo-router";
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
  const [auth] = useAuth();
  const params = useLocalSearchParams();
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Get tripId and customerId from route params
  const tripId = (params.tripId as string) || "";
  const customerId = (params.customerId as string) || "";
  const driverId = auth?.user?.id;

  // API hook for submitting feedback
  const { execute: submitFeedback } = usePost(
    ACTIVE_TRIP_ROUTES.SUBMIT_FEEDBACK,
    API_CLIENT_TYPES.ACTIVE_TRIP
  );

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
    // Validate rating is provided
    if (rating === 0) {
      showToast("Please provide a rating before submitting", "error", "top");
      return;
    }

    // Validate tripId and driverId are available
    if (!tripId || !driverId) {
      console.error("[FeedbackScreen] Missing tripId or driverId:", { tripId, driverId });
      showToast("Unable to submit feedback. Missing trip information.", "error", "top");
      // Still allow navigation even if feedback can't be submitted
      router.replace("/(tabs)");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("[FeedbackScreen] Submitting feedback:", {
        tripId,
        driverId,
        rating,
        feedback: comments,
      });

      const response = await submitFeedback({
        tripId,
        driverId,
        rating,
        feedback: comments || undefined, // Only include if provided
      });

      console.log("[FeedbackScreen] Full response received:", JSON.stringify(response, null, 2));

      // Handle response structure: usePost may extract response.data.data, so we need to check both structures
      // Backend returns: { success: true, message: "...", data: dbResponse }
      // usePost might extract: dbResponse (which has jHeader with responseCode)
      const isSuccess = 
        response?.success === true || 
        (response?.jHeader && (response.jHeader.responseCode === 0 || response.jHeader.responseCode === '0'));

      if (isSuccess) {
        const successMessage = 
          response?.message || 
          response?.jHeader?.message || 
          "Feedback submitted successfully!";
        
        console.log("[FeedbackScreen] Feedback submitted successfully:", response);
        showToast(successMessage, "success", "top");
        router.replace("/(tabs)");
      } else {
        const errorMessage = 
          response?.error || 
          response?.jHeader?.message || 
          "Failed to submit feedback. Please try again.";
        
        console.error("[FeedbackScreen] Failed to submit feedback:", response);
        showToast(errorMessage, "error", "top");
        // Still allow navigation even if feedback submission failed
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("[FeedbackScreen] Error submitting feedback:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while submitting feedback. Please try again.";
      showToast(errorMessage, "error", "top");
      // Still allow navigation even if feedback submission failed
      router.replace("/(tabs)");
    } finally {
      setIsSubmitting(false);
    }
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
                disabled={isSubmitting || rating === 0}
                loading={isSubmitting}
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
