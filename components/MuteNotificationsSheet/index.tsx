import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import Toggle from "@/components/Form/Toggle";
import Typography from "@/components/Typography";
import { showToast } from "@/components/Toast";
import { textColors } from "@/constants/colors";
import { useSettings } from "@/context/SettingsContext";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

interface MuteNotificationsSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function MuteNotificationsSheet({
  open,
  onClose,
}: MuteNotificationsSheetProps) {
  const [settings, , { updateNotificationSettings }] = useSettings();

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
      ? "All notifications muted"
      : muteJobOffers
        ? "Job offers muted"
        : "Notification settings saved";
    showToast(message, { variant: "success", position: "top" });
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      snapPoints={["30%"]}
      headerTitle="Mute Notifications"
    >
      <View style={styles.container}>
        <View style={styles.group}>
          <View style={styles.row}>
            <Typography type="bodyLarge" weight="medium" style={styles.text}>
              Mute Job Offers
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
              Mute All
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
            Save
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
