import { textColors } from "@/constants/colors";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import CustomBottomSheet from "../BottomSheet";
import Button from "../Button";
import Counter from "../Counter";
import TextArea from "../Form/TextArea";
import Typography from "../Typography";

export interface ETABottomSheetProps {
  open?: boolean;
  onClose: () => void;
  onSubmit: (eta: number, note?: string) => void;
  snapPoints?: (string | number)[];
  initialSnapIndex?: number;
  showHeader?: boolean;
  backdrop?: boolean | ((props: any) => React.ReactElement);
  swipeToClose?: boolean;
  snapPointsWhenKeyboardVisible?: (string | number)[];
  isLoading?: boolean;
  // Update ETA specific props
  variant?: "default" | "update";
  description?: string;
  showNoteSection?: boolean;
  buttonText?: string;
  headerTitle?: string;
  // Initial values for update variant
  initialEta?: number;
  initialNote?: string;
}

/**
 * ETA Bottom Sheet Component
 *
 * A simplified bottom sheet that shows ETA counter and submit button
 * Used when driver accepts a ride offer
 */
const ETABottomSheet: React.FC<ETABottomSheetProps> = memo(({
  open = false,
  onClose,
  onSubmit,
  snapPoints = ["40%"],
  initialSnapIndex = 0,
  showHeader = true,
  backdrop = true,
  swipeToClose = false,
  isLoading = false,
  variant = "default",
  description,
  showNoteSection = false,
  buttonText = "Submit",
  headerTitle = "Provide ETA",
  snapPointsWhenKeyboardVisible,
  initialEta,
  initialNote,
}) => {
  /**
   * IMPORTANT (iOS): keep controlled TextInput state OUTSIDE the BottomSheet component tree root.
   * If we store `note` in this component, every keystroke re-renders `CustomBottomSheet` /
   * `@gorhom/bottom-sheet` which can cause focus loss ("blinking") on iOS simulators.
   *
   * We keep the form state in a child component so only that subtree re-renders.
   */
  const SheetContent = memo(function SheetContent() {
    // Keep latest values in refs so submit can read both without forcing parent rerenders
    const defaultEta = initialEta ?? 15;
    const etaRef = useRef<number>(defaultEta);
    const noteRef = useRef<string>(initialNote || "");

    const EtaSection = memo(function EtaSection({
      open,
      disabled,
      onEtaChange,
      initialValue,
    }: {
      open: boolean;
      disabled: boolean;
      onEtaChange: (eta: number) => void;
      initialValue?: number;
    }) {
      const [eta, setEta] = useState(initialValue ?? 15);

      useEffect(() => {
        if (!open) {
          const resetValue = initialValue ?? 15;
          setEta(resetValue);
          onEtaChange(resetValue);
        } else if (initialValue !== undefined) {
          // When sheet opens, set to initial value if provided
          setEta(initialValue);
          onEtaChange(initialValue);
        }
      }, [open, onEtaChange, initialValue]);

      const handleEtaChange = useCallback(
        (next: number) => {
          setEta(next);
          onEtaChange(next);
        },
        [onEtaChange]
      );

      return (
        <View
          style={[
            styles.etaSection,
            variant === "update"
              ? styles.etaSectionUpdate
              : styles.etaSectionDefault,
          ]}
        >
          <Typography
            type="bodyLarge"
            weight="semibold"
            style={styles.etaSectionTitle}
          >
            Est.Time of Arrival{" "}
            <Typography
              type="bodyLarge"
              weight="regular"
              style={styles.etaSectionTitle}
            >
              (ETA)
            </Typography>
          </Typography>

          <Counter
            containerStyle={styles.etaCounterContainer}
            value={eta}
            onChange={handleEtaChange}
            min={1}
            max={60}
            step={1}
            formatLabel={(value) => `${value} mins`}
            disabled={disabled}
          />
        </View>
      );
    });

    const NoteSection = memo(function NoteSection({
      open,
      disabled,
      onNoteChange,
      initialValue,
    }: {
      open: boolean;
      disabled: boolean;
      onNoteChange: (note: string) => void;
      initialValue?: string;
    }) {
      const [note, setNote] = useState(initialValue || "");

      useEffect(() => {
        if (!open) {
          const resetValue = initialValue || "";
          setNote(resetValue);
          onNoteChange(resetValue);
        } else if (initialValue !== undefined) {
          // When sheet opens, set to initial value if provided
          setNote(initialValue);
          onNoteChange(initialValue);
        }
      }, [open, onNoteChange, initialValue]);

      const handleNoteChange = useCallback(
        (text: string) => {
          setNote(text);
          onNoteChange(text);
        },
        [onNoteChange]
      );

      if (!(variant === "update" && showNoteSection)) return null;

      return (
        <View style={styles.noteSection}>
          <Typography
            type="bodyLarge"
            weight="medium"
            style={styles.noteLabel}
          >
            Add a Note
          </Typography>
          <TextArea
            placeholder="eg. Heavy traffic on main road."
            value={note}
            onChangeText={handleNoteChange}
            numberOfLines={3}
            style={styles.noteTextArea}
            returnKeyType="done"
            blurOnSubmit={true}
            disabled={disabled}
          />
        </View>
      );
    });

    const handleEtaRefChange = useCallback((eta: number) => {
      etaRef.current = eta;
    }, []);

    const handleNoteRefChange = useCallback((note: string) => {
      noteRef.current = note;
    }, []);

    const handleSubmit = useCallback(() => {
      if (showNoteSection) {
        onSubmit(etaRef.current, noteRef.current);
      } else {
        onSubmit(etaRef.current);
      }
    }, [onSubmit, showNoteSection]);

    return (
      <View style={styles.container}>
        {/* Description for Update variant */}
        {variant === "update" && description && (
          <Typography
            type="bodyLarge"
            weight="regular"
            style={styles.description}
          >
            {description}
          </Typography>
        )}

        {/* ETA Section (kept isolated so typing note doesn't re-render the Counter) */}
        <EtaSection
          open={open}
          disabled={isLoading}
          onEtaChange={handleEtaRefChange}
          initialValue={initialEta}
        />

        {/* Note Section (isolated so pressing +/- doesn't re-render the TextArea) */}
        <NoteSection
          open={open}
          disabled={isLoading}
          onNoteChange={handleNoteRefChange}
          initialValue={initialNote}
        />

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <Button
            variant="primary"
            rounded="half"
            onPress={handleSubmit}
            disabled={isLoading}
            loading={isLoading}
          >
            {buttonText || "Submit"}
          </Button>
        </View>
      </View>
    );
  });

  return (
    <CustomBottomSheet
      open={open}
      onClose={onClose}
      snapPoints={snapPoints}
      initialSnapIndex={snapPointsWhenKeyboardVisible ? 1 : initialSnapIndex}
      showHeader={showHeader}
      backdrop={backdrop}
      swipeToClose={swipeToClose}
      headerTitle={headerTitle}
      snapPointsWhenKeyboardVisible={snapPointsWhenKeyboardVisible}
      disabledClose={isLoading}
    >
      {/* <Divider /> */}
      <SheetContent />
    </CustomBottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  description: {
    fontSize: 16,
    color: textColors.black,
    lineHeight: 22,
    marginBottom: 24,
  },
  etaSection: {
    marginBottom: 24,
  },
  etaSectionDefault: {
    flexDirection: "column",
    gap: 16,
  },
  etaSectionUpdate: {
    flexDirection: "column",
    gap: 16,
  },
  etaSectionTitle: {
    color: textColors.black,
  },
  etaCounterContainer: {
    width: "100%",
  },
  updateCounter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: textColors.grey100,
    alignItems: "center",
    justifyContent: "center",
  },
  counterButtonText: {
    fontSize: 20,
    color: textColors.black,
  },
  counterButtonDisabled: {
    color: textColors.grey400,
  },
  counterValue: {
    minWidth: 80,
    height: 48,
    borderWidth: 1,
    borderColor: textColors.teal600,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: textColors.white,
  },
  counterValueText: {
    fontSize: 16,
    color: textColors.black,
  },
  noteSection: {
    gap: 12,
    marginBottom: 24,
  },
  noteLabel: {
    fontSize: 16,
    color: textColors.black,
  },
  noteTextArea: {
    marginTop: 0,
  },
  submitSection: {
    marginTop: "auto",
    paddingBottom: 20,
  },
  updateButton: {
    height: 48,
    backgroundColor: textColors.teal600,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  updateButtonText: {
    color: textColors.white,
    fontSize: 16,
    textTransform: "uppercase",
  },
});

export default ETABottomSheet;
