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
  FEATURED_DRIVER_PRICE_MAX,
  FEATURED_DRIVER_PRICE_MIN,
} from "@/constants/global";
import { SETTINGS_CONTENT_KEYS } from "@/content/settings-keys";
import { useSettings } from "@/context/SettingsContext";
import { useGetContent } from "@/hooks/useGetContent";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  // Page Content Start
  const { getContent } = useGetContent();
  const {
    headerTitle,
    loadingMessage,
    toastSaved,
    featuredTitle,
    featuredDescription,
    etaTitle,
    etaDescription,
    autoBidTitle,
    autoBidDescription,
    autoBidPlaceholder,
    autoBidCustomerPrice,
    sheetBidPriceTitle,
    bidOptionPlus10,
    bidOptionPlus5,
    bidOptionCustomerPrice,
    bidOptionMinus5,
    bidOptionMinus10,
    actionSave,
  } = useMemo(() => {
    const get = getContent;
    return {
      headerTitle: get(SETTINGS_CONTENT_KEYS.HEADER_TITLE),
      loadingMessage: get(SETTINGS_CONTENT_KEYS.LOADING_MESSAGE),
      toastSaved: get(SETTINGS_CONTENT_KEYS.TOAST_SAVED),
      featuredTitle: get(SETTINGS_CONTENT_KEYS.FEATURED_TITLE),
      featuredDescription: get(SETTINGS_CONTENT_KEYS.FEATURED_DESCRIPTION),
      etaTitle: get(SETTINGS_CONTENT_KEYS.ETA_TITLE),
      etaDescription: get(SETTINGS_CONTENT_KEYS.ETA_DESCRIPTION),
      autoBidTitle: get(SETTINGS_CONTENT_KEYS.AUTO_BID_TITLE),
      autoBidDescription: get(SETTINGS_CONTENT_KEYS.AUTO_BID_DESCRIPTION),
      autoBidPlaceholder: get(SETTINGS_CONTENT_KEYS.AUTO_BID_PLACEHOLDER),
      autoBidCustomerPrice: get(SETTINGS_CONTENT_KEYS.AUTO_BID_CUSTOMER_PRICE),
      sheetBidPriceTitle: get(SETTINGS_CONTENT_KEYS.SHEET_BID_PRICE_TITLE),
      bidOptionPlus10: get(SETTINGS_CONTENT_KEYS.BID_OPTION_PLUS_10),
      bidOptionPlus5: get(SETTINGS_CONTENT_KEYS.BID_OPTION_PLUS_5),
      bidOptionCustomerPrice: get(
        SETTINGS_CONTENT_KEYS.BID_OPTION_CUSTOMER_PRICE,
      ),
      bidOptionMinus5: get(SETTINGS_CONTENT_KEYS.BID_OPTION_MINUS_5),
      bidOptionMinus10: get(SETTINGS_CONTENT_KEYS.BID_OPTION_MINUS_10),
      actionSave: get(SETTINGS_CONTENT_KEYS.ACTION_SAVE),
    };
  }, [getContent]);
  // Page Content End

  // Extra commission selectable price strategies. Keep values as numbers for backend.
  const extraCommissionPriceOptions = [
    { label: bidOptionPlus10, value: 10 },
    { label: bidOptionPlus5, value: 5 },
    { label: bidOptionCustomerPrice, value: 0 },
    { label: bidOptionMinus5, value: -5 },
    { label: bidOptionMinus10, value: -10 },
  ];

  const router = useRouter();
  const settingsContext = useSettings();
  const [settings, setSettings, status] = settingsContext;
  const { isLoading, error, clearError } = status;

  const [featured, setFeatured] = useState<number>(
    settings.featuredDriverPriceUSD ?? 0,
  );
  const [etaMinutes, setEtaMinutes] = useState<number>(
    settings.etaBufferMinutes ?? 0,
  );
  const [autoBidEnabled, setAutoBidEnabled] = useState<boolean>(
    settings.autoBidEnabled ?? false,
  );
  const [strategy, setStrategy] = useState<number | null>(
    settings.autoBidStrategy ?? null,
  );

  // Bottom sheet for selecting auto-bid price
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);

  const openSheet = () => setSheetOpen(true);
  const closeSheet = () => setSheetOpen(false);

  // Display label for selected strategy: 0 → "Customer price", positive → "+10%", negative → "-5%"
  const getStrategyLabel = (value: number | null): string => {
    if (value === null) return autoBidPlaceholder;
    const opt = extraCommissionPriceOptions.find((o) => o.value === value);
    return opt
      ? opt.label
      : value === 0
        ? autoBidCustomerPrice
        : value > 0
          ? `${bidOptionPlus10}%`
          : `${bidOptionMinus5}%`;
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
    ]),
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
      showToast(toastSaved, {
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
      <Header title={headerTitle} onBackPress={() => router.back()} />
      {isLoading && (
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
            {featuredTitle}
          </Typography>
          <Typography
            type="bodyMedium"
            weight="regular"
            style={styles.textBlack}
          >
            {featuredDescription}
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
            {etaTitle}
          </Typography>
          <Typography
            type="bodyMedium"
            weight="regular"
            style={styles.textBlack}
          >
            {etaDescription}
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
              {autoBidTitle}
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
            {autoBidDescription}
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
                style={
                  strategy !== null ? styles.textBlack : styles.placeholder
                }
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
          {actionSave}
        </Button>
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={closeSheet}
        snapPoints={["45%"]}
        headerTitle={sheetBidPriceTitle}
      >
        <View style={styles.sheetContainer}>
          <Divider />

          {extraCommissionPriceOptions.map((opt) => {
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
