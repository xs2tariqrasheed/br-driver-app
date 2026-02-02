import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import Counter from "@/components/Counter";
import DesiredLocationItem from "@/components/DesiredLocationItem";
import Input from "@/components/Form/Input";
import Header from "@/components/Header";
import Loader from "@/components/Loader";
import Logo from "@/components/Logo";
import { showToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { MAX_DESIRED_LOCATIONS } from "@/constants/global";
import { useDriver } from "@/context/DriverContext";
import {
  createDesiredDestination,
  DesiredDestination,
  extractZipCodeFromAddress,
  getValidDestinations,
  logger,
} from "@/utils/helpers";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function DesiredDestinationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const driverContext = useDriver();
  const [driver, setDriver] = driverContext;
  const {
    fetchDesiredDestinations,
    createDesiredDestination: createDestinationAPI,
    updateDesiredDestination: updateDestinationAPI,
    deleteDesiredDestination: deleteDestinationAPI,
    isLoadingDestinations,
    destinationsError,
  } = driverContext;

  // Local state for desired destinations list
  const [destinations, setDestinations] = useState<DesiredDestination[]>([]);

  // Commission percent state (0-100)
  const [commission, setCommission] = useState<number>(0);

  // Add/Edit Destination bottom sheet state
  const [inputAddress, setInputAddress] = useState<string>("");
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>("");
  const [selectedZipCode, setSelectedZipCode] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);

  // Loading state for fetching destinations (initial load)
  const [isFetchingDestinations, setIsFetchingDestinations] = useState<boolean>(true);
  
  // Loading state for save operation
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Logger function
  const log = logger();

  // Fetch destinations from backend whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadDestinations = async () => {
        if (!isActive) return;
        
        setIsFetchingDestinations(true);
        try {
          await fetchDesiredDestinations();
        } catch (error) {
          if (!isActive) return;
          log("Error loading destinations:", error);
          // If fetch fails, fall back to local storage
          if (driver?.desiredDestinations) {
            const validDestinations = getValidDestinations(
              driver.desiredDestinations
            );
            setDestinations(validDestinations);
          }
        } finally {
          if (isActive) {
            setIsFetchingDestinations(false);
          }
        }
      };
      
      loadDestinations();

      // Cleanup function to prevent state updates if component unmounts
      return () => {
        isActive = false;
      };
    }, []) // Empty dependency array - only run on focus
  );

  // Load destinations from driver context when they change
  useEffect(() => {
    if (driver?.desiredDestinations) {
      const validDestinations = getValidDestinations(
        driver.desiredDestinations
      );
      setDestinations(validDestinations);
    }
  }, [driver?.desiredDestinations]);

  // Show error toast when destinationsError changes
  useEffect(() => {
    if (destinationsError) {
      showToast(destinationsError, {
        variant: "error",
        position: "top",
      });
    }
  }, [destinationsError]);

  // Handle incoming params from map screen
  useEffect(() => {
    log("Params received:", params);
    if (params.selectedAddress) {
      log("Setting input address:", params.selectedAddress);
      setInputAddress(params.selectedAddress as string);
      
      // Parse coordinates if provided
      if (params.selectedCoordinates) {
        try {
          const coords = JSON.parse(params.selectedCoordinates as string);
          setSelectedCoordinates(coords);
        } catch (error) {
          log("Error parsing coordinates:", error);
        }
      }
      
      // Set placeId and zipCode if provided
      if (params.selectedPlaceId) {
        setSelectedPlaceId(params.selectedPlaceId as string);
      }
      if (params.selectedZipCode) {
        setSelectedZipCode(params.selectedZipCode as string);
      }
      
      setIsSheetOpen(true);
      // Clear the params to avoid reopening on subsequent renders
      router.setParams({
        selectedAddress: undefined,
        selectedCoordinates: undefined,
        selectedPlaceId: undefined,
        selectedZipCode: undefined,
      });
    }
  }, [params.selectedAddress, params.selectedCoordinates, params.selectedPlaceId, params.selectedZipCode, router]);

  const handleAddDestination = () => {
    log("handleAddDestination called");
    setEditingIndex(null);
    setInputAddress("");
    setSelectedCoordinates(null);
    setSelectedPlaceId("");
    setSelectedZipCode("");
    setCommission(0); // Reset commission when opening sheet
    log("Opening sheet");
    setIsSheetOpen(true);
  };


  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Desired Destinations"
        onBackPress={() => router.replace("/(tabs)")}
      />
      {isFetchingDestinations && (
        <View style={styles.loadingOverlay}>
          <Loader size="medium" />
          <Typography type="bodyMedium" style={styles.loadingText}>
            Loading destinations...
          </Typography>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centeredRow}>
          <Logo size="Large" />
        </View>

        <Typography
          type="bodyMedium"
          weight="regular"
          style={[styles.textBlack, styles.mt20]}
        >
          Let us know where you’d prefer to go. We’ll match you with rides
          headed in that direction.
        </Typography>

        <View style={styles.mt20}>
          <Button
            variant="outlined"
            rounded="half"
            onPress={handleAddDestination}
            disabled={destinations.length >= MAX_DESIRED_LOCATIONS || isLoadingDestinations || isFetchingDestinations}
          >
            + Add Destination
          </Button>
        </View>

        <View style={styles.sectionHeader}>
          <Typography
            type="titleExtraLarge"
            weight="semibold"
            style={styles.textBlack}
          >
            Your Desired Locations
          </Typography>
        </View>

        {destinations.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Image
              source={require("@/assets/images/empty-icon.png")}
              style={styles.icon42}
            />
            <Typography
              type="bodyMedium"
              weight="medium"
              style={styles.textBlack}
            >
              No destinations added yet.
            </Typography>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {destinations.map((dest, idx) => (
              <View
                key={`${dest.id}-${idx}`}
                style={{ marginTop: idx === 0 ? 0 : 8 }}
              >
                <DesiredLocationItem
                  priority={`P${idx + 1}`}
                  address={dest.address}
                  onEdit={() => {
                    setInputAddress(dest.address);
                    // Populate fields from destination if available
                    const destWithExtras = dest as any;
                    setSelectedCoordinates(
                      destWithExtras.latitude && destWithExtras.longitude
                        ? { latitude: destWithExtras.latitude, longitude: destWithExtras.longitude }
                        : null
                    );
                    setSelectedPlaceId(destWithExtras.googleReferenceNumber || "");
                    setSelectedZipCode(destWithExtras.targetZipCode || "");
                    setCommission(destWithExtras.commissionPercentage || 0);
                    setEditingIndex(idx);
                    setIsSheetOpen(true);
                  }}
                  onDelete={async () => {
                    try {
                      await deleteDestinationAPI(dest.id);
                      showToast("Destination deleted successfully", {
                        variant: "success",
                        position: "top",
                      });
                    } catch (error: any) {
                      const errorMessage =
                        error?.message || "Failed to delete destination";
                      showToast(errorMessage, {
                        variant: "error",
                        position: "top",
                      });
                    }
                  }}
                />
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Add Destination Bottom Sheet */}
      <BottomSheet
        scrollable
        snapPoints={["50%", "70%"]}
        snapPointsWhenKeyboardVisible={["75%", "95%"]}
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        headerTitle={
          editingIndex !== null ? "Edit Destination" : "Add Destination"
        }
      >
        <View>
          <TouchableOpacity
            style={styles.selectMapRow}
            onPress={() => {
              setIsSheetOpen(false);
              router.push("/(tabs)/desired-destinations-map" as any);
            }}
          >
            <Typography
              type="bodyMedium"
              weight="semibold"
              style={styles.textBlack}
            >
              Select from Map
            </Typography>
          </TouchableOpacity>
          <Input
            placeholder="Select from map to add destination"
            value={inputAddress}
            onChangeText={() => {}} // Disable manual input
            disabled={true}
            style={{ marginTop: 12, opacity: 0.6 }}
          />

          {/* Commission Section */}
          <View style={[styles.section, { marginTop: 24 }]}>
            <Typography
              type="titleExtraLarge"
              weight="semibold"
              style={styles.textBlack}
            >
              Offer Extra Commission
            </Typography>
            <Typography
              type="bodyMedium"
              weight="regular"
              style={[styles.textBlack, styles.mt10]}
            >
              Boost your chances of getting rides to your desired destinations by
              offering a extra commission on the fare.
            </Typography>

            <Counter
              value={commission}
              onChange={setCommission}
              min={0}
              max={100}
              step={1}
              formatLabel={(v) => `+${v}%`}
            />
          </View>

          <View style={styles.sheetFooter}>
            <Button
              rounded="half"
              variant="primary"
              loading={isSaving}
              disabled={
                !inputAddress.trim() ||
                (editingIndex === null && (!selectedCoordinates || !selectedPlaceId)) ||
                (editingIndex === null && commission === 0) ||
                (editingIndex === null &&
                  destinations.length >= MAX_DESIRED_LOCATIONS) ||
                isLoadingDestinations ||
                isFetchingDestinations ||
                isSaving
              }
              onPress={async () => {
                const trimmed = inputAddress.trim();
                
                // Validate for new destinations
                if (editingIndex === null) {
                  if (!trimmed || !selectedCoordinates || !selectedPlaceId) {
                    showToast("Please select a location from the map", {
                      variant: "error",
                      position: "top",
                    });
                    return;
                  }
                  if (commission === 0) {
                    showToast("Please select a commission for your destination first as it is required", {
                      variant: "error",
                      position: "top",
                    });
                    return;
                  }
                }

                setIsSaving(true);
                try {
                  if (editingIndex !== null) {
                    // Edit existing destination
                    const existingDest = destinations[editingIndex];
                    const destWithExtras = existingDest as any;
                    
                    // Use existing coordinates/placeId if not changed, or new ones if user selected from map
                    const finalCoordinates = selectedCoordinates || 
                      (destWithExtras.latitude && destWithExtras.longitude
                        ? { latitude: destWithExtras.latitude, longitude: destWithExtras.longitude }
                        : null);
                    const finalPlaceId = selectedPlaceId || destWithExtras.googleReferenceNumber || "";
                    const finalZipCode = selectedZipCode || destWithExtras.targetZipCode || extractZipCodeFromAddress(trimmed) || "00000";
                    const finalCommission = commission || destWithExtras.commissionPercentage || 0;
                    
                    if (!finalCoordinates) {
                      showToast("Please select a location from the map to update", {
                        variant: "error",
                        position: "top",
                      });
                      setIsSaving(false);
                      return;
                    }
                    
                    const updatedDest = {
                      ...existingDest,
                      address: trimmed,
                      googleReferenceNumber: finalPlaceId,
                      latitude: finalCoordinates.latitude,
                      longitude: finalCoordinates.longitude,
                      targetZipCode: finalZipCode,
                      commissionPercentage: finalCommission,
                    } as any;
                    
                    await updateDestinationAPI(updatedDest);
                    showToast("Destination updated successfully", {
                      variant: "success",
                      position: "top",
                    });
                  } else {
                    // Add new destination
                    if (destinations.length >= MAX_DESIRED_LOCATIONS) {
                      showToast("Maximum destinations limit reached", {
                        variant: "error",
                        position: "top",
                      });
                      setIsSaving(false);
                      return;
                    }
                    const newDest = createDesiredDestination(trimmed);
                    // Use zipCode from map selection, or extract from address, or use default
                    const finalZipCode = selectedZipCode || extractZipCodeFromAddress(trimmed) || "00000";
                    
                    await createDestinationAPI({
                      address: newDest.address,
                      expired_at: newDest.expired_at,
                      googleReferenceNumber: selectedPlaceId,
                      latitude: selectedCoordinates?.latitude || 0,
                      longitude: selectedCoordinates?.longitude || 0,
                      targetZipCode: finalZipCode,
                      commissionPercentage: commission,
                    } as any);
                    showToast("Destination added successfully", {
                      variant: "success",
                      position: "top",
                    });
                  }

                  setInputAddress("");
                  setSelectedCoordinates(null);
                  setSelectedPlaceId("");
                  setSelectedZipCode("");
                  setCommission(0); // Reset commission after saving
                  setEditingIndex(null);
                  setIsSheetOpen(false);
                } catch (error: any) {
                  const errorMessage =
                    error?.message || "Failed to save destination";
                  showToast(errorMessage, {
                    variant: "error",
                    position: "top",
                  });
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {isSaving 
                ? (editingIndex !== null ? "Updating..." : "Saving...")
                : (editingIndex !== null ? "Update" : "Save")
              }
            </Button>
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: textColors.white },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 12, paddingVertical: 24 },
  centeredRow: { alignItems: "center" },
  textBlack: { color: textColors.black },
  mt20: { marginTop: 20 },
  mt10: { marginTop: 10 },
  sectionHeader: { marginVertical: 20 },
  emptyWrap: { alignItems: "center", gap: 8 },
  icon42: { width: 42, height: 42, resizeMode: "contain" },
  icon24: { width: 24, height: 24, resizeMode: "contain" },
  listWrap: { gap: 8 },
  divider: { marginTop: 18, marginBottom: 8 },
  section: { marginTop: 10 },
  // Bottom sheet styles
  sheetFooter: { paddingTop: 12 },
  selectMapRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingVertical: 16,
    width: "100%",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: textColors.black,
  },
});
