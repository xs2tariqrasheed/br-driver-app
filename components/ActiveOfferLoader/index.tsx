import { colors, textColors } from "@/constants/colors";
import { useRideOffer } from "@/context/RideOfferContext";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Button from "../Button";
import Typography from "../Typography";

interface ActiveOfferLoaderProps {
  style?: any;
}

/**
 * ActiveOfferLoader Component
 *
 * Displays when driver has an active offer that needs response.
 * Shows a loader with message and button to navigate to job offers.
 */
export default function ActiveOfferLoader({ style }: ActiveOfferLoaderProps) {
  const { hasAnyActiveOffer } = useRideOffer();

  // Don't render if no active offer
  if (!hasAnyActiveOffer) {
    return null;
  }

  const handleGoToJobOffers = () => {
    router.push("/(screens)/notifications");
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {/* Loading Indicator */}
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={textColors.teal900} />
        </View>

        {/* Message */}
        <View style={styles.messageContainer}>
          <Typography
            type="headingLarge"
            weight="semibold"
            style={styles.title}
          >
            Ride Offer Available
          </Typography>

          <Typography
            type="bodyLarge"
            weight="regular"
            style={styles.description}
          >
            You have a sequential ride offer that needs your response. The
            system is waiting for you to respond to it.
          </Typography>

          <Typography
            type="bodyMedium"
            weight="regular"
            style={styles.subDescription}
          >
            Please go to notifications screen to view and respond to the offer.
          </Typography>
        </View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            rounded="half"
            onPress={handleGoToJobOffers}
            style={styles.actionButton}
          >
            Go to Notifications
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  content: {
    alignItems: "center",
  },
  loaderContainer: {
    marginBottom: 32,
  },
  messageContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    color: textColors.black,
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    color: textColors.grey700,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 12,
  },
  subDescription: {
    color: textColors.grey600,
    textAlign: "center",
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
  },
  actionButton: {
    minHeight: 48,
  },
});
