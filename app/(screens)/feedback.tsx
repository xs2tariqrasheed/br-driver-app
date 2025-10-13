import Button from "@/components/Button";
import TextArea from "@/components/Form/TextArea";
import Header from "@/components/Header";
import InfoTable, { InfoTableDataItem } from "@/components/InfoTable";
import Logo from "@/components/Logo";
import Rating from "@/components/Rating";
import { ThemedView } from "@/components/ThemedView";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { router, Stack } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const FeedbackScreen: React.FC = () => {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");

  // Dummy fare data as per the screenshot
  const fareItems: InfoTableDataItem[] = [
    { label: "Ride Price", value: "$20.25" },
    { label: "Tolls", value: "$0.75" },
    { label: "Discount", value: "$0.00" },
    { label: "UnBilled Tolls", value: "$4.00" },
    { label: "Extra Wait Time", value: "$05.00" },
    { label: "Additional Stops", value: "$10.00" },
  ];

  const handleSkip = () => {
    // Navigate to home screen
    router.replace("/(tabs)");
  };

  const handleSubmit = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comments,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Feedback submitted successfully!", [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)"),
          },
        ]);
      } else {
        throw new Error("Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert("Error", "Failed to submit feedback. Please try again.", [
        {
          text: "OK",
        },
      ]);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <Header title="Ride Completed" hideBackIcon={true} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical: 20,
    paddingBottom: 100, // Extra padding for keyboard
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
