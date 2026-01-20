import RideOffer from "@/components/RideOffer";
import { useRideOffer } from "@/context/RideOfferContext";
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { Platform, SafeAreaView } from "react-native";

export default function RideOfferScreen() {
  const {
    currentOffer,
    hideRideOfferModal,
    acceptRideOffer,
    skipRideOfferPrice,
    hideRideOffer,
    isSkipLoading,
    isHideLoading,
  } = useRideOffer();

  useEffect(() => {
    if (!currentOffer) {
      try {
        if (router.canGoBack()) {
          router.back();
        } else {
          // If no previous screen, navigate to home tabs
          router.replace("/(tabs)");
        }
      } catch (error) {
        // Fallback to home if navigation fails
        try {
          router.replace("/(tabs)");
        } catch {}
      }
    }
  }, [currentOffer]);

  if (!currentOffer) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: false,
          // iOS fix: avoid native full-screen modal presentation so provider-level RN Modals
          // (ETAModal) render above this screen instead of behind it.
          presentation: Platform.OS === "ios" ? "card" : "fullScreenModal",
        }}
      />
      <RideOffer
        asScreen
        visible={true}
        onClose={hideRideOfferModal}
        offer={currentOffer as any}
        bidable={currentOffer?.bidable || false}
        onAccept={acceptRideOffer}
        onSkipPrice={skipRideOfferPrice}
        onHide={hideRideOffer}
        isSkipLoading={isSkipLoading}
        isHideLoading={isHideLoading}
      />
    </SafeAreaView>
  );
}


