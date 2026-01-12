import Button from "@/components/Button";
import Input from "@/components/Form/Input";
import { Header } from "@/components/Header";
import CustomMap from "@/components/MapWebView";
import { textColors } from "@/constants/colors";
import { COORDINATE_REGEX, GOOGLE_MAPS_API_KEY } from "@/constants/global";
import { extractZipCodeFromAddress, logger, reverseGeocode } from "@/utils/helpers";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";

export default function DesiredDestinationsMapScreen() {
  const router = useRouter();
  const [address, setAddress] = useState<string>("");
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>("");
  const [selectedZipCode, setSelectedZipCode] = useState<string>("");

  // Google Maps API key is imported from global constants

  // Logger function
  const log = logger();

  const handleLocationSelect = async (
    selectedAddress: string,
    coordinates: { latitude: number; longitude: number },
    placeId?: string,
    zipCode?: string
  ) => {
    log("handleLocationSelect called with:", {
      selectedAddress,
      coordinates,
      placeId,
    });

    // Always use the placeId and zipCode from the WebView message if available
    if (placeId) {
      setSelectedPlaceId(placeId);
    }
    // Use zipCode from geocoding if available, otherwise try to extract from address
    if (zipCode) {
      setSelectedZipCode(zipCode);
    } else {
      // Fallback: try to extract zip code from address string
      const extractedZip = extractZipCodeFromAddress(selectedAddress);
      if (extractedZip) {
        setSelectedZipCode(extractedZip);
        log("Extracted zip code from address:", extractedZip);
      }
    }

    // Check if the selectedAddress is in coordinate format (e.g., "31.355034, 74.396754")
    if (COORDINATE_REGEX.test(selectedAddress.trim())) {
      log("Detected coordinate format, performing reverse geocoding...");

      try {
        // Extract latitude and longitude from the coordinate string
        const [latStr, lngStr] = selectedAddress
          .trim()
          .split(",")
          .map((coord) => coord.trim());
        const latitude = parseFloat(latStr);
        const longitude = parseFloat(lngStr);

        // Reverse geocode to get the actual address
        // Note: We preserve the placeId from the original message
        const resolvedAddress = await reverseGeocode(
          latitude,
          longitude,
          GOOGLE_MAPS_API_KEY
        );
        log("Reverse geocoding successful, resolved address:", resolvedAddress);

        setAddress(resolvedAddress);
        setSelectedCoordinates(coordinates);
      } catch (error) {
        console.error("Error during reverse geocoding:", error);
        // Fallback to original coordinate format if geocoding fails
        setAddress(selectedAddress);
        setSelectedCoordinates(coordinates);
      }
    } else {
      // Address is already in human-readable format
      setAddress(selectedAddress);
      setSelectedCoordinates(coordinates);
    }
  };

  const handleContinue = () => {
    if (selectedCoordinates) {
      // Pass the selected address, coordinates, placeId, and zipCode back via navigation state
      router.push({
        pathname: "/(screens)/desired-destinations",
        params: {
          selectedAddress: address,
          selectedCoordinates: JSON.stringify(selectedCoordinates),
          selectedPlaceId: selectedPlaceId || "",
          selectedZipCode: selectedZipCode || "",
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Add Destination" onBackPress={() => router.back()} />
      <View style={styles.mapContainer}>
        <CustomMap onLocationSelect={handleLocationSelect} />
      </View>

      <View style={styles.bottomBar}>
        <Input
          value={address}
          onChangeText={setAddress}
          placeholder="Enter a location or address"
          showSoftInputOnFocus={false}
        />
        <Button
          rounded="half"
          variant="primary"
          disabled={!address.trim() || !selectedCoordinates || !selectedPlaceId}
          onPress={handleContinue}
        >
          Continue
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: textColors.white },
  mapContainer: { flex: 1 },
  bottomBar: {
    gap: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: textColors.white,
  },
});
