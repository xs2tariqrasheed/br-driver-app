import React, { useEffect } from "react";
import { SafeAreaView } from "react-native";
import { Stack, router } from "expo-router";
import RideOffer from "@/components/RideOffer";
import { useRideOffer } from "@/context/RideOfferContext";

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
        router.back();
      } catch {}
    }
  }, [currentOffer]);

  if (!currentOffer) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false, presentation: "fullScreenModal" }} />
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


