import { colors, textColors } from "@/constants/colors";
import { ACTIVE_OFFER_LOADER_CONTENT_KEYS } from "@/content/components/active-offer-loader-keys";
import { useRideOffer } from "@/context/RideOfferContext";
import { useGetContent } from "@/hooks/useGetContent";
import { router } from "expo-router";
import { useMemo } from "react";
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
  const { getContent } = useGetContent();
  const { title, description, subDescription, actionButton } = useMemo(() => {
    const get = getContent;
    return {
      title: get(ACTIVE_OFFER_LOADER_CONTENT_KEYS.TITLE),
      description: get(ACTIVE_OFFER_LOADER_CONTENT_KEYS.DESCRIPTION),
      subDescription: get(ACTIVE_OFFER_LOADER_CONTENT_KEYS.SUB_DESCRIPTION),
      actionButton: get(ACTIVE_OFFER_LOADER_CONTENT_KEYS.ACTION_BUTTON),
    };
  }, [getContent]);

  const {
    hasAnyActiveOffer,
    currentOffer,
    temporaryRides,
    setHasAnyActiveOffer,
  } = useRideOffer();

  // Don't render if no active offer
  if (!hasAnyActiveOffer) {
    return null;
  }

  const handleGoToJobOffers = () => {
    // User expectation: this button should ALWAYS go to Notifications.
    // Safety: if we have no offer data at all but the flag is still true, clear it
    // so the driver doesn't get stuck on this screen.
    const hasOfferData =
      !!currentOffer ||
      (temporaryRides && Object.keys(temporaryRides).length > 0);
    if (!hasOfferData) {
      setHasAnyActiveOffer(false);
    }
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
            {title}
          </Typography>

          <Typography
            type="bodyLarge"
            weight="regular"
            style={styles.description}
          >
            {description}
          </Typography>

          <Typography
            type="bodyMedium"
            weight="regular"
            style={styles.subDescription}
          >
            {subDescription}
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
            {actionButton}
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
