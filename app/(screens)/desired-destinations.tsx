import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import Counter from "@/components/Counter";
import DesiredLocationItem from "@/components/DesiredLocationItem";
import Divider from "@/components/Divider";
import Input from "@/components/Form/Input";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { MAX_DESIRED_LOCATIONS } from "@/constants/global";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

  // Local state for desired destinations list (stub for now)
  const [destinations, setDestinations] = useState<string[]>([]);

  // Commission percent state (0-100)
  const [commission, setCommission] = useState<number>(0);

  // Add/Edit Destination bottom sheet state
  const [inputAddress, setInputAddress] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);

  // Handle incoming params from map screen
  useEffect(() => {
    console.log("Params received:", params);
    if (params.selectedAddress) {
      console.log("Setting input address:", params.selectedAddress);
      setInputAddress(params.selectedAddress as string);
      setIsSheetOpen(true);
      // Clear the params to avoid reopening on subsequent renders
      router.setParams({
        selectedAddress: undefined,
        selectedCoordinates: undefined,
      });
    }
  }, [params.selectedAddress, router]);

  const handleAddDestination = () => {
    console.log("handleAddDestination called");
    setEditingIndex(null);
    setInputAddress("");
    console.log("Opening sheet");
    setIsSheetOpen(true);
  };

  const handleSave = () => {
    // TODO: Persist destinations and commission to context/API.
    router.back();
  };

  const isSaveDisabled = useMemo(
    () => destinations.length === 0,
    [destinations.length]
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Desired Destinations" onBackPress={() => router.back()} />

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
            disabled={destinations.length >= MAX_DESIRED_LOCATIONS}
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
            {destinations.map((addr, idx) => (
              <View
                key={`${addr}-${idx}`}
                style={{ marginTop: idx === 0 ? 0 : 8 }}
              >
                <DesiredLocationItem
                  priority={`P${idx + 1}`}
                  address={addr}
                  onEdit={() => {
                    setInputAddress(addr);
                    setEditingIndex(idx);
                    setIsSheetOpen(true);
                  }}
                  onDelete={() => {
                    setDestinations(destinations.filter((_, i) => i !== idx));
                  }}
                />
              </View>
            ))}
          </View>
        )}

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Typography
            type="titleExtraLarge"
            weight="semibold"
            style={styles.textBlack}
          >
            Offer a Commission
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
      </ScrollView>

      <View style={styles.footer}>
        <Button
          rounded="half"
          variant="primary"
          onPress={handleSave}
          disabled={isSaveDisabled}
        >
          Save
        </Button>
      </View>

      {/* Add Destination Bottom Sheet */}
      <BottomSheet
        snapPointsWhenKeyboardVisible={["58%", "90%"]}
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
              router.push("/(screens)/desired-destinations-map" as any);
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
            placeholder="Enter a location or address"
            value={inputAddress}
            onChangeText={setInputAddress}
            style={{ marginTop: 12 }}
          />

          <View style={styles.sheetFooter}>
            <Button
              rounded="half"
              variant="primary"
              disabled={
                !inputAddress.trim() ||
                (editingIndex === null &&
                  destinations.length >= MAX_DESIRED_LOCATIONS)
              }
              onPress={() => {
                const trimmed = inputAddress.trim();
                if (!trimmed) return;
                setDestinations((prev) => {
                  if (editingIndex !== null) {
                    const copy = [...prev];
                    copy[editingIndex] = trimmed;
                    return copy;
                  }
                  if (prev.length >= MAX_DESIRED_LOCATIONS) return prev;
                  return [...prev, trimmed];
                });
                setInputAddress("");
                setEditingIndex(null);
                setIsSheetOpen(false);
              }}
            >
              Save
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
  footer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: textColors.white,
  },
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
});
