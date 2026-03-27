import Input from "@/components/Form/Input";
import { showToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { GOOGLE_MAPS_API_KEY } from "@/constants/global";
import { extractZipCodeFromAddress, logger } from "@/utils/helpers";
import {
  fetchPlaceDetails,
  fetchPlacePredictions,
  type PlacePrediction,
} from "@/utils/googlePlaces";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export type ResolvedPlacePayload = {
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
  postalCode: string;
};

type GooglePlacesAddressFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  onPlaceResolved: (payload: ResolvedPlacePayload) => void;
  placeholder: string;
  label?: string;
};

const DEBOUNCE_MS = 350;
const SUGGESTIONS_MAX_HEIGHT = 220;
/** Avoid spinner flash on fast autocomplete responses */
const AUTOCOMPLETE_SPINNER_DELAY_MS = 180;

/**
 * Address text field with Google Places Autocomplete suggestions.
 */
export function GooglePlacesAddressField({
  value,
  onChangeText,
  onPlaceResolved,
  placeholder,
  label,
}: GooglePlacesAddressFieldProps) {
  // logger() returns a new function each call — stabilise so useEffect/deps don't thrash.
  const log = useMemo(() => logger(), []);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  /** After picking a suggestion, skip one autocomplete run (avoids extra API calls on resolved address). */
  const suppressAutocompleteAfterResolveRef = useRef(false);
  /** Bumps when the user edits or starts a new selection; ignores stale place-details responses. */
  const placeDetailsOpIdRef = useRef(0);

  const clearLoadingDelay = useCallback(() => {
    if (loadingDelayRef.current) {
      clearTimeout(loadingDelayRef.current);
      loadingDelayRef.current = null;
    }
    setLoading(false);
  }, []);

  const scheduleLoadingShown = useCallback(() => {
    if (loadingDelayRef.current) {
      clearTimeout(loadingDelayRef.current);
    }
    loadingDelayRef.current = setTimeout(() => {
      loadingDelayRef.current = null;
      setLoading(true);
    }, AUTOCOMPLETE_SPINNER_DELAY_MS);
  }, []);

  const runAutocomplete = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (q.length < 2) {
        clearLoadingDelay();
        setPredictions([]);
        return;
      }
      const id = ++requestIdRef.current;
      scheduleLoadingShown();
      try {
        const list = await fetchPlacePredictions(q, GOOGLE_MAPS_API_KEY);
        if (id === requestIdRef.current) {
          setPredictions(list);
        }
      } catch (e) {
        log("[GooglePlacesAddressField] autocomplete error", e);
        if (id === requestIdRef.current) {
          setPredictions([]);
        }
      } finally {
        if (id === requestIdRef.current) {
          clearLoadingDelay();
        }
      }
    },
    [log, clearLoadingDelay, scheduleLoadingShown],
  );

  useEffect(() => {
    if (suppressAutocompleteAfterResolveRef.current) {
      suppressAutocompleteAfterResolveRef.current = false;
      setPredictions([]);
      clearLoadingDelay();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void runAutocomplete(value);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, runAutocomplete, clearLoadingDelay]);

  const handleInputChange = useCallback(
    (text: string) => {
      // User edit must not be treated as the post-resolve address sync (suppress would skip autocomplete).
      suppressAutocompleteAfterResolveRef.current = false;
      placeDetailsOpIdRef.current += 1;
      setDetailsLoading(false);
      onChangeText(text);
    },
    [onChangeText],
  );

  const handleSelect = useCallback(
    async (item: PlacePrediction) => {
      // Do not dismiss keyboard here — first tap would only hide keyboard (handled + parent scroll).
      // Drop any in-flight autocomplete so its `finally` can't leave loading stuck.
      requestIdRef.current += 1;
      clearLoadingDelay();
      setPredictions([]);

      suppressAutocompleteAfterResolveRef.current = true;
      const opId = ++placeDetailsOpIdRef.current;
      setDetailsLoading(true);
      try {
        const d = await fetchPlaceDetails(item.placeId, GOOGLE_MAPS_API_KEY);
        if (opId !== placeDetailsOpIdRef.current) return;
        const postal =
          d.postalCode?.trim() ||
          extractZipCodeFromAddress(d.formattedAddress) ||
          "00000";
        onPlaceResolved({
          address: d.formattedAddress,
          latitude: d.latitude,
          longitude: d.longitude,
          placeId: d.placeId,
          postalCode: postal,
        });
        requestAnimationFrame(() => Keyboard.dismiss());
      } catch (e) {
        if (opId !== placeDetailsOpIdRef.current) return;
        log("[GooglePlacesAddressField] place details error", e);
        suppressAutocompleteAfterResolveRef.current = false;
        showToast(
          "Could not load that address. Try another suggestion or use the map.",
          { variant: "error", position: "top" },
        );
      } finally {
        if (opId === placeDetailsOpIdRef.current) {
          setDetailsLoading(false);
        }
      }
    },
    [log, onPlaceResolved, clearLoadingDelay],
  );

  return (
    <View style={styles.wrap}>
      <Input
        {...(label ? { label } : {})}
        style={styles.inputMultilineContainer}
        placeholder={placeholder}
        value={value}
        onChangeText={handleInputChange}
        autoCorrect={false}
        autoCapitalize="words"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        blurOnSubmit={false}
        returnKeyType="default"
        inputStyle={styles.multilineInput}
      />
      {detailsLoading ? (
        <View style={styles.loaderRow}>
          <ActivityIndicator color={textColors.teal600} />
          <Typography
            type="labelSmall"
            weight="regular"
            style={styles.loaderText}
          >
            Loading address…
          </Typography>
        </View>
      ) : null}
      {loading && predictions.length === 0 && value.trim().length >= 2 ? (
        <View style={styles.loaderRow}>
          <ActivityIndicator color={textColors.teal600} />
        </View>
      ) : null}
      {predictions.length > 0 ? (
        <ScrollView
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          nestedScrollEnabled
          style={styles.list}
          showsVerticalScrollIndicator
        >
          {predictions.map((item) => (
            <Pressable
              key={item.placeId}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
              ]}
              onPress={() => void handleSelect(item)}
            >
              <Typography
                type="bodyMedium"
                weight="semibold"
                style={styles.mainText}
                numberOfLines={2}
              >
                {item.mainText}
              </Typography>
              {item.secondaryText ? (
                <Typography
                  type="labelSmall"
                  weight="regular"
                  style={styles.subText}
                  numberOfLines={2}
                >
                  {item.secondaryText}
                </Typography>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  inputMultilineContainer: {
    alignItems: "flex-start",
    paddingVertical: 10,
    minHeight: 88,
  },
  multilineInput: {
    minHeight: 68,
    paddingTop: 4,
    paddingBottom: 8,
  },
  list: {
    maxHeight: SUGGESTIONS_MAX_HEIGHT,
    marginTop: 8,
    borderWidth: 1,
    borderColor: textColors.grey200,
    borderRadius: 8,
    backgroundColor: textColors.white,
  },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: textColors.grey200,
  },
  rowPressed: {
    backgroundColor: textColors.grey100,
  },
  mainText: {
    color: textColors.black,
  },
  subText: {
    color: textColors.grey600,
    marginTop: 2,
  },
  loaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  loaderText: {
    color: textColors.grey700,
  },
});
