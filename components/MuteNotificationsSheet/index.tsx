import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import Toggle from "@/components/Form/Toggle";
import Typography from "@/components/Typography";
import { showToast } from "@/components/Toast";
import { textColors } from "@/constants/colors";
import { HOME_CONTENT_KEYS } from "@/content/(tabs)/home-keys";
import { useSettings } from "@/context/SettingsContext";
import { useGetContent } from "@/hooks/useGetContent";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

interface MuteNotificationsSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function MuteNotificationsSheet({
  open,
  onClose,
}: MuteNotificationsSheetProps) {
  const { getContent } = useGetContent();
  const [settings, , { updateNotificationSettings }] = useSettings();

  const {
    sheetMuteTitle,
    sheetMuteJobOffers,
    sheetMuteAll,
    sheetMuteSave,
    toastMuteAll,
    toastMuteJobOffers,
    toastMuteSettingsSaved,
  } = useMemo(() => {
    const get = getContent;
    return {
      sheetMuteTitle: get(HOME_CONTENT_KEYS.SHEET_MUTE_TITLE),
      sheetMuteJobOffers: get(HOME_CONTENT_KEYS.SHEET_MUTE_JOB_OFFERS),
      sheetMuteAll: get(HOME_CONTENT_KEYS.SHEET_MUTE_ALL),
      sheetMuteSave: get(HOME_CONTENT_KEYS.SHEET_MUTE_SAVE),
      toastMuteAll: get(HOME_CONTENT_KEYS.TOAST_MUTE_ALL),
      toastMuteJobOffers: get(HOME_CONTENT_KEYS.TOAST_MUTE_JOB_OFFERS),
      toastMuteSettingsSaved: get(HOME_CONTENT_KEYS.TOAST_MUTE_SETTINGS_SAVED),
    };
  }, [getContent]);

  const storedMuteJobOffers = settings.notifications.muteJobOffers;
  const storedMuteAll = settings.notifications.muteAll;

  // Local state for toggles; prepopulate from context (context is hydrated from localStorage on app load)
  const [muteJobOffers, setMuteJobOffers] = useState<boolean>(storedMuteJobOffers);
  const [muteAll, setMuteAll] = useState<boolean>(storedMuteAll);

  // Whenever the sheet opens, sync local state from stored values (context + localStorage)
  useEffect(() => {
    if (open) {
      setMuteJobOffers(storedMuteJobOffers);
      setMuteAll(storedMuteAll);
    }
  }, [open, storedMuteJobOffers, storedMuteAll]);

  // Handle save: update context + storage only (no API), show success message
  const handleSave = async () => {
    await updateNotificationSettings({ muteJobOffers, muteAll });
    const message = muteAll
      ? toastMuteAll
      : muteJobOffers
        ? toastMuteJobOffers
        : toastMuteSettingsSaved;
    showToast(message, { variant: "success", position: "top" });
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      snapPoints={["30%"]}
      headerTitle={sheetMuteTitle}
    >
      <View style={styles.container}>
        <View style={styles.group}>
          <View style={styles.row}>
            <Typography type="bodyLarge" weight="medium" style={styles.text}>
              {sheetMuteJobOffers}
            </Typography>
            <Toggle
              variant="switch"
              value={muteJobOffers}
              setValue={setMuteJobOffers}
              size={styles.toggle}
            />
          </View>
          <View style={styles.row}>
            <Typography type="bodyLarge" weight="medium" style={styles.text}>
              {sheetMuteAll}
            </Typography>
            <Toggle
              variant="switch"
              value={muteAll}
              setValue={setMuteAll}
              size={styles.toggle}
            />
          </View>
        </View>
        <View style={styles.footer}>
          <Button rounded="half" variant="primary" onPress={handleSave}>
            {sheetMuteSave}
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
    backgroundColor: textColors.white,
  },
  group: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  text: {
    color: textColors.black,
    fontSize: 16,
  },
  footer: {
    paddingTop: 12,
  },
  toggle: {
    width: 42,
    height: 24,
  },
});
