import Button from "@/components/Button";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import useAppPermissions from "@/hooks/useAppPermissions";
import React, { useEffect } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PermissionGateProps = {
  children: React.ReactNode;
};

const PermissionGate: React.FC<PermissionGateProps> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const {
    statuses,
    isAllGranted,
    isAnyDenied,
    isLoading,
    requestAll,
    openSettingsIfDenied,
  } = useAppPermissions();

  useEffect(() => {
    if (!isAllGranted && !isAnyDenied) {
      void requestAll();
    }
  }, [isAllGranted, isAnyDenied, requestAll]);

  if (isAllGranted) return <>{children}</>;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.card}>
        <Typography type="headingLarge" weight="semibold" style={styles.title}>
          Permissions Required
        </Typography>
        <Typography type="bodyLarge" style={styles.description}>
          We require Location and Notifications to operate. Please allow both to
          continue.
        </Typography>

        <View style={styles.statusRow}>
          <View style={styles.bullet} />
          <Typography type="bodyLarge" style={styles.statusText}>
            Location: {statuses.location}
          </Typography>
        </View>
        <View style={styles.statusRow}>
          <View style={styles.bullet} />
          <Typography type="bodyLarge" style={styles.statusText}>
            Notifications: {statuses.notifications}
          </Typography>
        </View>

        {isLoading ? (
          <ActivityIndicator
            color={textColors.teal600}
            style={{ marginTop: 16 }}
          />
        ) : (
          <>
            <Button
              variant="primary"
              rounded="half"
              onPress={() => void requestAll()}
            >
              Allow Permissions
            </Button>
            {isAnyDenied && (
              <Button
                variant="outlined"
                rounded="half"
                onPress={openSettingsIfDenied}
                style={{ marginTop: 10 }}
              >
                Open Settings
              </Button>
            )}
          </>
        )}

        <Typography type="labelSmall" style={styles.footerNote}>
          {Platform.select({
            ios: "You can also enable them later from iOS Settings.",
            android: "You can also enable them later from App Settings.",
            default: "",
          })}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  card: {
    backgroundColor: textColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  title: { color: textColors.black, marginBottom: 8 },
  description: { color: textColors.black, opacity: 0.8, marginBottom: 16 },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: textColors.teal600,
    marginRight: 8,
  },
  statusText: { color: textColors.black },
  footerNote: {
    color: textColors.black,
    opacity: 0.6,
    marginTop: 12,
    textAlign: "center",
  },
});

export default PermissionGate;
