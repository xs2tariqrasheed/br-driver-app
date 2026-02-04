import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import Counter from "@/components/Counter";
import Divider from "@/components/Divider";
import Toggle from "@/components/Form/Toggle";
import Header from "@/components/Header";
import Loader from "@/components/Loader";
import Logo from "@/components/Logo";
import { showToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import {
  ETA_BUFFER_MINUTES_MAX,
  ETA_BUFFER_MINUTES_MIN,
  EXTRA_COMMISSION_PRICE_OPTIONS,
  FEATURED_DRIVER_PRICE_MAX,
  FEATURED_DRIVER_PRICE_MIN,
} from "@/constants/global";
import { useSettings } from "@/context/SettingsContext";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
  const settingsContext = useSettings();
  const [settings, setSettings, status] = settingsContext;
  const { isLoading, error, clearError } = status;

  const [featured, setFeatured] = useState<number>(
    settings.featuredDriverPriceUSD ?? 0
  );
  const [etaMinutes, setEtaMinutes] = useState<number>(
    settings.etaBufferMinutes ?? 0
  );
  const [autoBidEnabled, setAutoBidEnabled] = useState<boolean>(
    settings.autoBidEnabled ?? false
  );
  const [strategy, setStrategy] = useState<number | null>(
    settings.autoBidStrategy ?? null
  );

  // Bottom sheet for selecting auto-bid price
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);

  const openSheet = () => setSheetOpen(true);
  const closeSheet = () => setSheetOpen(false);

  // Display label for selected strategy: 0 → "Customer price", positive → "+10%", negative → "-5%"
  const getStrategyLabel = (value: number | null): string => {
    if (value === null) return "Select price for bid";
    const opt = EXTRA_COMMISSION_PRICE_OPTIONS.find((o) => o.value === value);
    return opt ? opt.label : value === 0 ? "Customer price" : value > 0 ? `+${value}%` : `${value}%`;
  };

  // Sync local state from context whenever screen is focused so we show latest
  // values (including after save, when driver comes back to the screen)
  useFocusEffect(
    useCallback(() => {
      setFeatured(settings.featuredDriverPriceUSD ?? 0);
      setEtaMinutes(settings.etaBufferMinutes ?? 0);
      setAutoBidEnabled(settings.autoBidEnabled ?? false);
      setStrategy(settings.autoBidStrategy ?? null);
    }, [
      settings.featuredDriverPriceUSD,
      settings.etaBufferMinutes,
      settings.autoBidEnabled,
      settings.autoBidStrategy,
    ])
  );

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      showToast(error, { variant: "error", position: "top" });
      clearError();
    }
  }, [error, clearError]);

  const handleSave = async () => {
    try {
      await setSettings({
        ...settings,
        featuredDriverPriceUSD: featured,
        etaBufferMinutes: etaMinutes,
        autoBidEnabled,
        autoBidStrategy: autoBidEnabled ? strategy : null,
      });
      showToast("Settings saved successfully", {
        variant: "success",
        position: "top",
      });
      router.back();
    } catch (e) {
      // Error is handled by context and shown via useEffect
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <Header title="Settings" onBackPress={() => router.back()} />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Loader size="medium" />
          <Typography type="bodyMedium" style={styles.loadingText}>
            Saving settings...
          </Typography>
        </View>
      )}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        pointerEvents={isLoading ? "none" : "auto"}
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
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </View>

        <Divider />

        <View style={styles.section}>
          <View style={styles.rowSpaceBetween}>
            <Typography
              type="titleExtraLarge"
              weight="semibold"
              style={styles.textBlack}
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
              disabled={isLoading}
              size={{ width: 42, height: 24 }}
            />
          </View>
          <Typography
            type="bodyMedium"
            weight="regular"
            style={styles.textBlack}
          >
            Automatically bid on rides using your preferred pricing strategy.
            Choose how your bid compares to the customer's base price.
          </Typography>
          {autoBidEnabled ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={openSheet}
              style={[styles.dropdown, isLoading && styles.disabledBtn]}
              disabled={isLoading}
            >
              <Typography
                type="bodyLarge"
                weight="medium"
                style={strategy !== null ? styles.textBlack : styles.placeholder}
                numberOfLines={1}
              >
                {getStrategyLabel(strategy)}
              </Typography>
              <Image
                source={require("@/assets/images/black-down-arrow-icon.png")}
                style={styles.icon24}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          rounded="half"
          variant="primary"
          onPress={handleSave}
          disabled={isLoading}
        >
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

          {EXTRA_COMMISSION_PRICE_OPTIONS.map((opt) => {
            const selected = strategy === opt.value;
            return (
              <View key={opt.value}>
                <TouchableOpacity
                  style={styles.sheetRow}
                  onPress={() => {
                    setStrategy(opt.value);
                    closeSheet();
                  }}
                >
                  <Typography
                    type={selected ? "titleMedium" : "bodyLarge"}
                    weight={selected ? "bold" : "medium"}
                    style={styles.textBlack}
                  >
                    {opt.label}
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
