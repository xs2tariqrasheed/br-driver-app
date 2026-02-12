import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import ConfirmationSheet from "@/components/ConfirmationSheet";
import Counter from "@/components/Counter";
import DesiredLocationItem from "@/components/DesiredLocationItem";
import Header from "@/components/Header";
import Loader from "@/components/Loader";
import Logo from "@/components/Logo";
import { showToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { MAX_DESIRED_LOCATIONS } from "@/constants/global";
import { DESIRED_DESTINATIONS_CONTENT_KEYS } from "@/content/desired-destinations-keys";
import { useDriver } from "@/context/DriverContext";
import { useGetContent } from "@/hooks/useGetContent";
import {
  createDesiredDestination,
  DesiredDestination,
  extractZipCodeFromAddress,
  getValidDestinations,
  isDestinationExpired,
  logger,
} from "@/utils/helpers";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const { getContent } = useGetContent();
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

  // page content
  const {
    headerTitle,
    loadingMessage,
    introDescription,
    actionAdd,
    sectionTitle,
    emptyState,
    sheetAddTitle,
    sheetEditTitle,
    sheetSelectFromMap,
    sheetAddressPlaceholder,
    sheetCommissionTitle,
    sheetCommissionDescription,
    sheetButtonSave,
    sheetButtonSaving,
    sheetButtonUpdate,
    sheetButtonUpdating,
    deleteConfirmTitle,
    deleteConfirmDescription,
    deleteConfirmCancel,
    deleteConfirmConfirm,
    toastMaxReached,
    toastSelectLocation,
    toastCommissionRequired,
    toastMaxDeleteExpired,
    toastAdded,
    toastSaveFailed,
    toastSelectLocationUpdate,
    toastUpdated,
    toastUpdateFailed,
    toastDeleted,
    toastDeleteFailed,
  } = useMemo(() => {
    const get = getContent;
    return {
      headerTitle: get(DESIRED_DESTINATIONS_CONTENT_KEYS.HEADER_TITLE),
      loadingMessage: get(DESIRED_DESTINATIONS_CONTENT_KEYS.LOADING_MESSAGE),
      introDescription: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.INTRO_DESCRIPTION,
      ),
      actionAdd: get(DESIRED_DESTINATIONS_CONTENT_KEYS.ACTION_ADD),
      sectionTitle: get(DESIRED_DESTINATIONS_CONTENT_KEYS.SECTION_TITLE),
      emptyState: get(DESIRED_DESTINATIONS_CONTENT_KEYS.EMPTY_STATE),
      sheetAddTitle: get(DESIRED_DESTINATIONS_CONTENT_KEYS.SHEET_ADD_TITLE),
      sheetEditTitle: get(DESIRED_DESTINATIONS_CONTENT_KEYS.SHEET_EDIT_TITLE),
      sheetSelectFromMap: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.SHEET_SELECT_FROM_MAP,
      ),
      sheetAddressPlaceholder: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.SHEET_ADDRESS_PLACEHOLDER,
      ),
      sheetCommissionTitle: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.SHEET_COMMISSION_TITLE,
      ),
      sheetCommissionDescription: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.SHEET_COMMISSION_DESCRIPTION,
      ),
      sheetButtonSave: get(DESIRED_DESTINATIONS_CONTENT_KEYS.SHEET_BUTTON_SAVE),
      sheetButtonSaving: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.SHEET_BUTTON_SAVING,
      ),
      sheetButtonUpdate: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.SHEET_BUTTON_UPDATE,
      ),
      sheetButtonUpdating: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.SHEET_BUTTON_UPDATING,
      ),
      deleteConfirmTitle: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.DELETE_CONFIRM_TITLE,
      ),
      deleteConfirmDescription: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.DELETE_CONFIRM_DESCRIPTION,
      ),
      deleteConfirmCancel: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.DELETE_CONFIRM_CANCEL,
      ),
      deleteConfirmConfirm: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.DELETE_CONFIRM_CONFIRM,
      ),
      toastMaxReached: get(DESIRED_DESTINATIONS_CONTENT_KEYS.TOAST_MAX_REACHED),
      toastSelectLocation: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.TOAST_SELECT_LOCATION,
      ),
      toastCommissionRequired: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.TOAST_COMMISSION_REQUIRED,
      ),
      toastMaxDeleteExpired: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.TOAST_MAX_DELETE_EXPIRED,
      ),
      toastAdded: get(DESIRED_DESTINATIONS_CONTENT_KEYS.TOAST_ADDED),
      toastSaveFailed: get(DESIRED_DESTINATIONS_CONTENT_KEYS.TOAST_SAVE_FAILED),
      toastSelectLocationUpdate: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.TOAST_SELECT_LOCATION_UPDATE,
      ),
      toastUpdated: get(DESIRED_DESTINATIONS_CONTENT_KEYS.TOAST_UPDATED),
      toastUpdateFailed: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.TOAST_UPDATE_FAILED,
      ),
      toastDeleted: get(DESIRED_DESTINATIONS_CONTENT_KEYS.TOAST_DELETED),
      toastDeleteFailed: get(
        DESIRED_DESTINATIONS_CONTENT_KEYS.TOAST_DELETE_FAILED,
      ),
    };
  }, [getContent]);

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
  const [isFetchingDestinations, setIsFetchingDestinations] =
    useState<boolean>(true);

  // Loading states for add vs edit (separate sheets)
  const [isSavingAdd, setIsSavingAdd] = useState<boolean>(false);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Delete destination confirmation (same pattern as More screen logout/delete profile)
  const [deleteConfirmSheetOpen, setDeleteConfirmSheetOpen] =
    useState<boolean>(false);
  const [destinationToDelete, setDestinationToDelete] =
    useState<DesiredDestination | null>(null);

  // Logger function
  const log = logger();

  // Count of non-expired destinations (max 3 allowed; user must delete expired to add more)
  const validCount = getValidDestinations(destinations).length;
  const canAddMore = validCount < MAX_DESIRED_LOCATIONS;

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
            setDestinations(driver.desiredDestinations);
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
    }, []), // Empty dependency array - only run on focus
  );

  // Load all destinations from driver context (include expired so user can see and delete them)
  useEffect(() => {
    if (driver?.desiredDestinations) {
      setDestinations(driver.desiredDestinations);
    }
  }, [driver?.desiredDestinations]);

  // Show error toast when destinationsError changes
  useEffect(() => {
    if (destinationsError) {
      showToast(toastSaveFailed, {
        variant: "error",
        position: "top",
      });
    }
  }, [destinationsError]);

  // Handle incoming params from map screen (return with selected location)
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

      if (params.selectedPlaceId) {
        setSelectedPlaceId(params.selectedPlaceId as string);
      }
      if (params.selectedZipCode) {
        setSelectedZipCode(params.selectedZipCode as string);
      }

      // Restore which sheet to open: add vs edit (map passes these back so we reopen the correct sheet)
      const sheetMode = params.sheetMode as string | undefined;
      const editingIndexParam = params.editingIndex as string | undefined;
      if (
        sheetMode === "edit" &&
        editingIndexParam !== undefined &&
        editingIndexParam !== ""
      ) {
        const idx = parseInt(editingIndexParam, 10);
        if (!Number.isNaN(idx)) setEditingIndex(idx);
      } else {
        setEditingIndex(null);
      }

      setIsSheetOpen(true);
      router.setParams({
        selectedAddress: undefined,
        selectedCoordinates: undefined,
        selectedPlaceId: undefined,
        selectedZipCode: undefined,
        sheetMode: undefined,
        editingIndex: undefined,
      });
    }
  }, [
    params.selectedAddress,
    params.selectedCoordinates,
    params.selectedPlaceId,
    params.selectedZipCode,
    params.sheetMode,
    params.editingIndex,
    router,
  ]);

  const closeAddSheet = useCallback(() => {
    setIsSheetOpen(false);
    setEditingIndex(null);
    setInputAddress("");
    setSelectedCoordinates(null);
    setSelectedPlaceId("");
    setSelectedZipCode("");
    setCommission(0);
  }, []);

  const closeEditSheet = useCallback(() => {
    setIsSheetOpen(false);
    setEditingIndex(null);
    setInputAddress("");
    setSelectedCoordinates(null);
    setSelectedPlaceId("");
    setSelectedZipCode("");
    setCommission(0);
  }, []);

  const handleAddDestination = () => {
    log("handleAddDestination called");
    if (destinations.length >= MAX_DESIRED_LOCATIONS) {
      showToast(toastMaxReached, { variant: "warning", position: "top" });
      return;
    }
    setEditingIndex(null);
    setInputAddress("");
    setSelectedCoordinates(null);
    setSelectedPlaceId("");
    setSelectedZipCode("");
    setCommission(0);
    log("Opening add sheet");
    setIsSheetOpen(true);
  };

  const handleSaveDestination = useCallback(async () => {
    const trimmed = inputAddress.trim();
    if (!trimmed || !selectedCoordinates || !selectedPlaceId) {
      showToast(toastSelectLocation, {
        variant: "error",
        position: "top",
      });
      return;
    }
    if (commission === 0) {
      showToast(toastCommissionRequired, { variant: "error", position: "top" });
      return;
    }
    if (!canAddMore) {
      showToast(toastMaxDeleteExpired, { variant: "error", position: "top" });
      return;
    }

    setIsSavingAdd(true);
    try {
      const newDest = createDesiredDestination(trimmed);
      const finalZipCode =
        selectedZipCode || extractZipCodeFromAddress(trimmed) || "00000";

      await createDestinationAPI({
        address: newDest.address,
        expired_at: newDest.expired_at,
        googleReferenceNumber: selectedPlaceId,
        latitude: selectedCoordinates.latitude,
        longitude: selectedCoordinates.longitude,
        targetZipCode: finalZipCode,
        commissionPercentage: commission,
      } as any);

      showToast(toastAdded, {
        variant: "success",
        position: "top",
      });
      closeAddSheet();
    } catch (error: any) {
      showToast(error?.message ?? toastSaveFailed, {
        variant: "error",
        position: "top",
      });
    } finally {
      setIsSavingAdd(false);
    }
  }, [
    inputAddress,
    selectedCoordinates,
    selectedPlaceId,
    selectedZipCode,
    commission,
    canAddMore,
    createDestinationAPI,
    closeAddSheet,
  ]);

  const handleUpdateDestination = useCallback(async () => {
    if (editingIndex === null) return;

    const trimmed = inputAddress.trim();
    const existingDest = destinations[editingIndex];
    const destWithExtras = existingDest as any;

    const finalCoordinates =
      selectedCoordinates ||
      (destWithExtras.latitude && destWithExtras.longitude
        ? {
            latitude: destWithExtras.latitude,
            longitude: destWithExtras.longitude,
          }
        : null);
    const finalPlaceId =
      selectedPlaceId || destWithExtras.googleReferenceNumber || "";
    const finalZipCode =
      selectedZipCode ||
      destWithExtras.targetZipCode ||
      extractZipCodeFromAddress(trimmed) ||
      "00000";
    const finalCommission =
      commission ?? destWithExtras.commissionPercentage ?? 0;

    if (!finalCoordinates) {
      showToast(toastSelectLocationUpdate, {
        variant: "error",
        position: "top",
      });
      return;
    }

    setIsSavingEdit(true);
    try {
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
      showToast(toastUpdated, {
        variant: "success",
        position: "top",
      });
      closeEditSheet();
    } catch (error: any) {
      showToast(error?.message ?? toastUpdateFailed, {
        variant: "error",
        position: "top",
      });
    } finally {
      setIsSavingEdit(false);
    }
  }, [
    editingIndex,
    inputAddress,
    selectedCoordinates,
    selectedPlaceId,
    selectedZipCode,
    commission,
    destinations,
    updateDestinationAPI,
    closeEditSheet,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title={headerTitle}
        onBackPress={() => router.replace("/(tabs)")}
      />
      {isFetchingDestinations && (
        <View style={styles.loadingOverlay}>
          <Loader size="medium" />
          <Typography type="bodyMedium" style={styles.loadingText}>
            {loadingMessage}
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
          {introDescription}
        </Typography>

        <View style={styles.mt20}>
          <Button
            variant="outlined"
            rounded="half"
            onPress={handleAddDestination}
            disabled={isLoadingDestinations || isFetchingDestinations}
          >
            {actionAdd}
          </Button>
        </View>

        <View style={styles.sectionHeader}>
          <Typography
            type="titleExtraLarge"
            weight="semibold"
            style={styles.textBlack}
          >
            {sectionTitle}
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
              {emptyState}
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
                  isExpired={isDestinationExpired(dest.expired_at)}
                  onEdit={() => {
                    setInputAddress(dest.address);
                    // Populate fields from destination if available
                    const destWithExtras = dest as any;
                    console.log(
                      "📥 [DesiredDestinationsScreen] Destination:",
                      JSON.stringify(destWithExtras, null, 2),
                    );
                    setSelectedCoordinates(
                      destWithExtras.latitude && destWithExtras.longitude
                        ? {
                            latitude: destWithExtras.latitude,
                            longitude: destWithExtras.longitude,
                          }
                        : null,
                    );
                    setSelectedPlaceId(
                      destWithExtras.googleReferenceNumber || "",
                    );
                    setSelectedZipCode(destWithExtras.targetZipCode || "");
                    setCommission(destWithExtras.commissionPercentage || 0);
                    setEditingIndex(idx);
                    setIsSheetOpen(true);
                  }}
                  onDelete={() => {
                    setDestinationToDelete(dest);
                    setDeleteConfirmSheetOpen(true);
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
        open={isSheetOpen && editingIndex === null}
        onClose={closeAddSheet}
        headerTitle={sheetAddTitle}
      >
        <View>
          <TouchableOpacity
            style={styles.selectMapRow}
            onPress={() => {
              setIsSheetOpen(false);
              router.push({
                pathname: "/(tabs)/desired-destinations-map" as any,
                params: {
                  sheetMode: "add",
                  editingIndex: "",
                },
              });
            }}
          >
            <Typography
              type="bodyMedium"
              weight="semibold"
              style={styles.textBlue}
            >
              {sheetSelectFromMap}
            </Typography>
          </TouchableOpacity>
          <View
            style={[
              styles.addressDisplayBox,
              !inputAddress.trim() && styles.addressDisplayBoxPlaceholder,
            ]}
          >
            <Typography
              type="bodyMedium"
              weight="regular"
              style={[
                styles.addressDisplayText,
                !inputAddress.trim() && styles.addressDisplayTextPlaceholder,
              ]}
            >
              {inputAddress.trim() || sheetAddressPlaceholder}
            </Typography>
          </View>

          <View style={[styles.section, { marginTop: 24 }]}>
            <Typography
              type="titleExtraLarge"
              weight="semibold"
              style={styles.textBlack}
            >
              {sheetCommissionTitle}
            </Typography>
            <Typography
              type="bodyMedium"
              weight="regular"
              style={[styles.textBlack, styles.mt10]}
            >
              {sheetCommissionDescription}
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
              loading={isSavingAdd}
              disabled={
                !inputAddress.trim() ||
                !selectedCoordinates ||
                !selectedPlaceId ||
                commission === 0 ||
                !canAddMore ||
                isSavingAdd
              }
              onPress={handleSaveDestination}
            >
              {isSavingAdd ? sheetButtonSaving : sheetButtonSave}
            </Button>
          </View>
        </View>
      </BottomSheet>

      {/* Edit Destination Bottom Sheet */}
      <BottomSheet
        scrollable
        snapPoints={["50%", "70%"]}
        snapPointsWhenKeyboardVisible={["75%", "95%"]}
        open={isSheetOpen && editingIndex !== null}
        onClose={closeEditSheet}
        headerTitle={sheetEditTitle}
      >
        <View>
          <TouchableOpacity
            style={styles.selectMapRow}
            onPress={() => {
              setIsSheetOpen(false);
              router.push({
                pathname: "/(tabs)/desired-destinations-map" as any,
                params: {
                  sheetMode: "edit",
                  editingIndex: String(editingIndex),
                },
              });
            }}
          >
            <Typography
              type="bodyMedium"
              weight="semibold"
              style={styles.textBlue}
            >
              {sheetSelectFromMap}
            </Typography>
          </TouchableOpacity>
          <View
            style={[
              styles.addressDisplayBox,
              !inputAddress.trim() && styles.addressDisplayBoxPlaceholder,
            ]}
          >
            <Typography
              type="bodyMedium"
              weight="regular"
              style={[
                styles.addressDisplayText,
                !inputAddress.trim() && styles.addressDisplayTextPlaceholder,
              ]}
            >
              {inputAddress.trim() || sheetAddressPlaceholder}
            </Typography>
          </View>

          <View style={[styles.section, { marginTop: 24 }]}>
            <Typography
              type="titleExtraLarge"
              weight="semibold"
              style={styles.textBlack}
            >
              {sheetCommissionTitle}
            </Typography>
            <Typography
              type="bodyMedium"
              weight="regular"
              style={[styles.textBlack, styles.mt10]}
            >
              {sheetCommissionDescription}
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
              loading={isSavingEdit}
              disabled={!inputAddress.trim() || isSavingEdit}
              onPress={handleUpdateDestination}
            >
              {isSavingEdit ? sheetButtonUpdating : sheetButtonUpdate}
            </Button>
          </View>
        </View>
      </BottomSheet>

      {/* Delete destination confirmation (same pattern as More screen logout/delete profile) */}
      <ConfirmationSheet
        open={deleteConfirmSheetOpen}
        title={deleteConfirmTitle}
        description={deleteConfirmDescription}
        cancelButtonText={deleteConfirmCancel}
        confirmButtonText={deleteConfirmConfirm}
        onCancel={() => {
          setDeleteConfirmSheetOpen(false);
          setDestinationToDelete(null);
        }}
        onConfirm={async () => {
          setDeleteConfirmSheetOpen(false);
          const dest = destinationToDelete;
          setDestinationToDelete(null);
          if (!dest) return;
          try {
            await deleteDestinationAPI(dest.id);
            showToast(toastDeleted, {
              variant: "success",
              position: "top",
            });
          } catch (error: any) {
            showToast(error?.message ?? toastDeleteFailed, {
              variant: "error",
              position: "top",
            });
          }
        }}
      />
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
  addressDisplayBox: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: textColors.grey200,
    borderRadius: 8,
    minHeight: 44,
    backgroundColor: textColors.grey100,
    opacity: 0.8,
  },
  addressDisplayBoxPlaceholder: {
    opacity: 0.7,
  },
  addressDisplayText: {
    color: textColors.grey900,
    flexWrap: "wrap",
  },
  addressDisplayTextPlaceholder: {
    color: textColors.grey900,
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
  textBlue: { color: textColors.blue500 },
});
