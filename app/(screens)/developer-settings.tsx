import Toggle from "@/components/Form/Toggle";
import Header from "@/components/Header";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { useDevSettings } from "@/context/DevSettingsContext";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

export default function DeveloperSettingsScreen() {
  const router = useRouter();
  const { showContentKeys, setShowContentKeys } = useDevSettings();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <Header title="Developer Settings" onBackPress={() => router.back()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <View style={styles.row}>
            <Typography
              type="bodyMedium"
              weight="medium"
              style={styles.label}
              numberOfLines={2}
            >
              Show content keys instead of values
            </Typography>
            <Toggle
              variant="switch"
              value={showContentKeys}
              setValue={setShowContentKeys}
            />
          </View>
          <Typography type="bodySmall" style={styles.hint}>
            When enabled, the app displays dynamic content keys (e.g.{" "}
            driver-app-startup-error-title-primary) instead of the actual text.
            Useful for verifying content key usage. State persists across app
            restarts.
          </Typography>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    flex: 1,
    color: textColors.black,
    marginRight: 12,
  },
  hint: {
    color: textColors.grey500,
    lineHeight: 20,
  },
});
