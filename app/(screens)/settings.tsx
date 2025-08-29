import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import Counter from "@/components/Counter";
import Divider from "@/components/Divider";
import Toggle from "@/components/Form/Toggle";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import {
  AUTO_BID_PRICE_OPTIONS,
  ETA_BUFFER_MINUTES_MAX,
  ETA_BUFFER_MINUTES_MIN,
  FEATURED_DRIVER_PRICE_MAX,
  FEATURED_DRIVER_PRICE_MIN,
} from "@/constants/global";
import { useSettings } from "@/context/SettingsContext";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useSettings();

  const [featured, setFeatured] = useState<number>(
    settings.featuredDriverPriceUSD ?? 0
  );
  const [etaMinutes, setEtaMinutes] = useState<number>(
    settings.etaBufferMinutes ?? 0
  );
  const [autoBidEnabled, setAutoBidEnabled] = useState<boolean>(
    settings.autoBidEnabled ?? false
  );
  const [strategy, setStrategy] = useState<string | null>(
    settings.autoBidStrategy ?? null
  );

  // Bottom sheet for selecting auto-bid price
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);

  const openSheet = () => setSheetOpen(true);
  const closeSheet = () => setSheetOpen(false);

  // No-op helpers removed; using reusable Counter component instead.

  const handleSave = async () => {
    await setSettings({
      ...settings,
      featuredDriverPriceUSD: featured,
      etaBufferMinutes: etaMinutes,
      autoBidEnabled,
      autoBidStrategy: autoBidEnabled ? strategy : null,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <Header title="Settings" onBackPress={() => router.back()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centeredRow}>
          <Logo size="Large" />
        </View>

        <View style={styles.section}>
          <Typography
            type="titleExtraLarge"
            weight="semibold"
            style={styles.textBlack}
          >
            Show Me as a Featured Driver
          </Typography>
          <Typography
            type="bodyMedium"
            weight="regular"
            style={styles.textBlack}
          >
            Boost your visibility in the customer app by appearing as a featured
            driver.
          </Typography>
          <Counter
            value={featured}
            onChange={setFeatured}
            min={FEATURED_DRIVER_PRICE_MIN}
            max={FEATURED_DRIVER_PRICE_MAX}
            step={1}
            formatLabel={(v) => `$${v}`}
          />
        </View>

        <Divider />

        <View style={styles.section}>
          <Typography
            type="titleExtraLarge"
            weight="semibold"
            style={styles.textBlack}
          >
            Add Extra Time to My ETA
          </Typography>
          <Typography
            type="bodyMedium"
            weight="regular"
            style={styles.textBlack}
          >
            Add buffer minutes to the system-calculated ETA to account for
            traffic or other delays.
          </Typography>
          <Counter
            value={etaMinutes}
            onChange={setEtaMinutes}
            min={ETA_BUFFER_MINUTES_MIN}
            max={ETA_BUFFER_MINUTES_MAX}
            step={1}
            formatLabel={(v) => `${v} mins`}
          />
        </View>

        <Divider />

        <View style={styles.rowSpaceBetween}>
          <Typography
            type="bodyLarge"
            weight="semibold"
            style={styles.textBlack16}
          >
            Auto-Bid on Ride Offers
          </Typography>
          <Toggle
            variant="switch"
            value={autoBidEnabled}
            setValue={(next: boolean) => {
              setAutoBidEnabled(next);
              if (!next) setStrategy(null);
            }}
            size={{ width: 42, height: 24 }}
          />
        </View>

        {autoBidEnabled ? (
          <View style={styles.autoBidBlock}>
            <Typography
              type="bodyMedium"
              weight="regular"
              style={styles.textBlack}
            >
              Automatically bid on rides using your preferred pricing strategy.
              Choose how your bid compares to the customer’s base price.
            </Typography>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={openSheet}
              style={styles.dropdown}
            >
              <Typography
                type="bodyLarge"
                weight="medium"
                style={strategy ? styles.textBlack : styles.placeholder}
                numberOfLines={1}
              >
                {strategy ?? "Select price for bid"}
              </Typography>
              <Image
                source={require("@/assets/images/black-down-arrow-icon.png")}
                style={styles.icon24}
              />
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button rounded="half" variant="primary" onPress={handleSave}>
          Save
        </Button>
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={closeSheet}
        snapPoints={["45%"]}
        headerTitle="Select Bid Price"
      >
        <View style={styles.sheetContainer}>
          <Divider />

          {AUTO_BID_PRICE_OPTIONS.map((opt) => {
            const selected = strategy === opt;
            return (
              <View key={opt}>
                <TouchableOpacity
                  style={styles.sheetRow}
                  onPress={() => {
                    setStrategy(opt);
                    closeSheet();
                  }}
                >
                  <Typography
                    type={selected ? "titleMedium" : "bodyLarge"}
                    weight={selected ? "bold" : "medium"}
                    style={styles.textBlack}
                  >
                    {opt}
                  </Typography>
                </TouchableOpacity>
                <Divider />
              </View>
            );
          })}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: textColors.white },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 12, paddingVertical: 24, gap: 20 },
  centeredRow: { alignItems: "center" },
  section: { gap: 4 },
  textBlack: { color: textColors.black },
  textBlack16: { color: textColors.black, fontSize: 16 },

  counterRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  iconButton24: {
    borderRadius: 12,
    marginTop: 4,
  },
  disabledBtn: {
    opacity: 0.4,
  },
  icon20: { width: 20, height: 20, resizeMode: "contain" },
  icon24: { width: 24, height: 24, resizeMode: "contain" },
  counterValueWrap: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: textColors.teal600,
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: { color: textColors.black },
  rowSpaceBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  autoBidBlock: { gap: 8 },
  dropdown: {
    height: 48,
    width: "100%",
    borderWidth: 1,
    borderColor: textColors.grey200,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  placeholder: { color: textColors.grey400 },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: textColors.white,
  },
  sheetRoot: { borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  sheetContainer: {
    backgroundColor: textColors.white,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: { fontSize: 21, color: textColors.black },
  sheetRow: { paddingVertical: 12 },
});
