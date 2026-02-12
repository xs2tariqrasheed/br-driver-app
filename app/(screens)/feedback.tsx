import Button from "@/components/Button";
import TextArea from "@/components/Form/TextArea";
import Header from "@/components/Header";
import InfoTable, { InfoTableDataItem } from "@/components/InfoTable";
import Logo from "@/components/Logo";
import Rating from "@/components/Rating";
import { ThemedView } from "@/components/ThemedView";
import { useToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { activeTripApiClient } from "@/config/apiConfig";
import { textColors } from "@/constants/colors";
import { ACTIVE_TRIP_ROUTES } from "@/constants/endpoints";
import { API_CLIENT_TYPES } from "@/constants/global";
import { FEEDBACK_CONTENT_KEYS } from "@/content/feedback-keys";
import { useAuth } from "@/context/AuthContext";
import { useGetContent } from "@/hooks/useGetContent";
import { usePost } from "@/hooks/usePost";
import {
  transformTripDetailsFromDb,
  transformTripDetailsToFareSummary,
} from "@/utils/helpers";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const { getContent } = useGetContent();
  const {
    headerTitle,
    fareSummaryTitle,
    fareRidePrice,
    fareTolls,
    fareDiscount,
    fareUnBilledTolls,
    fareExtraWaitTime,
    fareAdditionalStops,
    ratingTitle,
    ratingQuestion,
    commentsLabel,
    commentsPlaceholder,
    actionSkip,
    actionSubmit,
    toastRatingRequired,
    toastMissingTrip,
    toastSuccess,
    toastSubmitFailed,
    toastError,
    errorFetchTrip,
  } = useMemo(() => {
    const get = getContent;
    return {
      headerTitle: get(FEEDBACK_CONTENT_KEYS.HEADER_TITLE),
      fareSummaryTitle: get(FEEDBACK_CONTENT_KEYS.FARE_SUMMARY_TITLE),
      fareRidePrice: get(FEEDBACK_CONTENT_KEYS.FARE_RIDE_PRICE),
      fareTolls: get(FEEDBACK_CONTENT_KEYS.FARE_TOLLS),
      fareDiscount: get(FEEDBACK_CONTENT_KEYS.FARE_DISCOUNT),
      fareUnBilledTolls: get(FEEDBACK_CONTENT_KEYS.FARE_UNBILLED_TOLLS),
      fareExtraWaitTime: get(FEEDBACK_CONTENT_KEYS.FARE_EXTRA_WAIT_TIME),
      fareAdditionalStops: get(FEEDBACK_CONTENT_KEYS.FARE_ADDITIONAL_STOPS),
      ratingTitle: get(FEEDBACK_CONTENT_KEYS.RATING_TITLE),
      ratingQuestion: get(FEEDBACK_CONTENT_KEYS.RATING_QUESTION),
      commentsLabel: get(FEEDBACK_CONTENT_KEYS.COMMENTS_LABEL),
      commentsPlaceholder: get(FEEDBACK_CONTENT_KEYS.COMMENTS_PLACEHOLDER),
      actionSkip: get(FEEDBACK_CONTENT_KEYS.ACTION_SKIP),
      actionSubmit: get(FEEDBACK_CONTENT_KEYS.ACTION_SUBMIT),
      toastRatingRequired: get(FEEDBACK_CONTENT_KEYS.TOAST_RATING_REQUIRED),
      toastMissingTrip: get(FEEDBACK_CONTENT_KEYS.TOAST_MISSING_TRIP),
      toastSuccess: get(FEEDBACK_CONTENT_KEYS.TOAST_SUCCESS),
      toastSubmitFailed: get(FEEDBACK_CONTENT_KEYS.TOAST_SUBMIT_FAILED),
      toastError: get(FEEDBACK_CONTENT_KEYS.TOAST_ERROR),
      errorFetchTrip: get(FEEDBACK_CONTENT_KEYS.ERROR_FETCH_TRIP),
    };
  }, [getContent]);
  // Page Content End
  const { showToast } = useToast();
  const [auth] = useAuth();
  const params = useLocalSearchParams();
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Get tripId, tripNumber, and customerId from route params
  const tripId = (params.tripId as string) || "";
  const tripNumber = (params.tripNumber as string) || "";
  const customerId = (params.customerId as string) || "";
  const driverId = auth?.user?.id;

  // API hook for submitting feedback
  const { execute: submitFeedback } = usePost(
    ACTIVE_TRIP_ROUTES.SUBMIT_FEEDBACK,
    API_CLIENT_TYPES.ACTIVE_TRIP,
  );

  // State for fare items
  const [fareItems, setFareItems] = useState<InfoTableDataItem[]>([
    { label: fareRidePrice, value: "$0.00" },
    { label: fareTolls, value: "$0.00" },
    { label: fareDiscount, value: "$0.00" },
    { label: fareUnBilledTolls, value: "$0.00" },
    { label: fareExtraWaitTime, value: "$0.00" },
    { label: fareAdditionalStops, value: "$0.00" },
  ]);

  // Fetch trip details when screen loads
  useEffect(() => {
    const loadTripDetails = async () => {
      // Use tripNumber if available, otherwise try to extract from tripId
      const tripNumberToFetch =
        tripNumber || (tripId && !tripId.includes("-") ? tripId : null);

      if (tripNumberToFetch) {
        try {
          const endpoint = `${ACTIVE_TRIP_ROUTES.GET_TRIP_BY_NUMBER}/${tripNumberToFetch}`;

          const response = await activeTripApiClient.get(endpoint);
          const responseData = response.data as any;

          const responseCode = responseData?.jHeader?.responseCode;
          const isSuccess =
            responseCode === 0 ||
            responseCode === "0" ||
            responseCode === undefined;

          if (isSuccess && responseData?.data) {
            const transformed = transformTripDetailsFromDb(responseData.data);

            if (transformed) {
              const fareSummary =
                transformTripDetailsToFareSummary(transformed);

              if (fareSummary.length > 0) {
                setFareItems(fareSummary);
                console.log(
                  "✅ [FeedbackScreen] Fare summary loaded successfully!",
                );
              } else {
                console.warn("⚠️ [FeedbackScreen] Fare summary is empty");
              }
            } else {
              console.error(
                "❌ [FeedbackScreen] Failed to transform trip data",
              );
            }
          } else {
            const errorMsg = responseData?.jHeader?.message || errorFetchTrip;
            console.error("❌ [FeedbackScreen] API Error:", errorMsg);
            console.error("❌ [FeedbackScreen] Response Code:", responseCode);
            // Continue with default fare items if fetch fails
          }
        } catch (err: any) {
          console.error("❌ [FeedbackScreen] Error Message:", err?.message);
          console.error(
            "❌ [FeedbackScreen] Error Response Status:",
            err.response.status,
          );
          // Continue with default fare items if fetch fails
        }
      } else {
        console.error(
          "❌ [FeedbackScreen] No trip number available, using default fare items",
        );
      }
    };

    loadTripDetails();
  }, [tripNumber, tripId]);

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
      },
    );
    const keyboardWillHideListener = Keyboard.addListener(
      keyboardHideEventName,
      () => {
        setKeyboardHeight(0);
      },
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
      showToast(toastRatingRequired, "error", "top");
      return;
    }

    // Validate tripId and driverId are available
    if (!tripId || !driverId) {
      console.error("[FeedbackScreen] Missing tripId or driverId:", {
        tripId,
        driverId,
      });
      showToast(toastMissingTrip, "error", "top");
      // Still allow navigation even if feedback can't be submitted
      router.replace("/(tabs)");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await submitFeedback({
        tripId,
        driverId,
        rating,
        feedback: comments || undefined, // Only include if provided
      });

      // Handle response structure: usePost may extract response.data.data, so we need to check both structures
      // Backend returns: { success: true, message: "...", data: dbResponse }
      // usePost might extract: dbResponse (which has jHeader with responseCode)
      const isSuccess =
        response?.success === true ||
        (response?.jHeader &&
          (response.jHeader.responseCode === 0 ||
            response.jHeader.responseCode === "0"));

      if (isSuccess) {
        const successMessage =
          response?.message || response?.jHeader?.message || toastSuccess;

        showToast(successMessage, "success", "top");
        router.replace("/(tabs)");
      } else {
        const errorMessage =
          response?.error || response?.jHeader?.message || toastSubmitFailed;

        showToast(errorMessage, "error", "top");
        // Still allow navigation even if feedback submission failed
        router.replace("/(tabs)");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : toastError;
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
        <Header title={headerTitle} hideBackIcon={true} />

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          // behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={[
                styles.scrollContent,
                {
                  paddingBottom:
                    keyboardHeight > 0
                      ? keyboardHeight + 20
                      : insets.bottom + 100,
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
                title={fareSummaryTitle}
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
                  {ratingTitle}
                </Typography>
                <Typography
                  type="bodyMedium"
                  weight="regular"
                  style={styles.ratingQuestion}
                >
                  {ratingQuestion}
                </Typography>
                <View style={styles.ratingContainer}>
                  <Rating
                    rating={rating}
                    onRatingChange={setRating}
                    size={48}
                  />
                </View>
              </View>

              {/* Add Comments Section */}
              <View style={styles.commentsSection}>
                <TextArea
                  label={commentsLabel}
                  placeholder={commentsPlaceholder}
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
                  {actionSkip}
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
                  {actionSubmit}
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
