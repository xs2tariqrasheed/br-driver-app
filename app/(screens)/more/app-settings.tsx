import Accordion from "@/components/Accordion";
import Header from "@/components/Header";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { APP_SETTINGS_ITEMS, APP_VERSION } from "@/constants/global";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export default function AppSettingsScreen() {
  const router = useRouter();

  const items = APP_SETTINGS_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    icon: (
      <Image
        source={require("@/assets/images/app-settings-icon.png")}
        style={styles.icon}
      />
    ),
    children:
      item.key === "app-info" ? (
        <View style={styles.infoRow}>
          <Typography
            type="bodyMedium"
            weight="semibold"
            style={styles.infoLabel}
          >
            Version
          </Typography>
          <Typography
            type="bodyMedium"
            weight="regular"
            style={styles.infoValue}
          >
            {APP_VERSION}
          </Typography>
        </View>
      ) : (
        <View>
          <Typography type="bodyMedium" weight="regular" style={styles.noData}>
            No Data Found
          </Typography>
        </View>
      ),
  }));

  return (
    <SafeAreaView style={styles.container}>
      <Header title="App Settings" onBackPress={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Accordion items={items} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
  },
  content: {
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  noData: {
    color: textColors.black,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabel: {
    color: textColors.black,
  },
  infoValue: {
    color: textColors.black,
  },
});
