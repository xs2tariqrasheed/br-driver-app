import Button from "@/components/Button";
import { Header } from "@/components/Header";
import Typography from "@/components/Typography";
import { useBottomTabOverflow } from "@/components/ui/TabBarBackground";
import { textColors } from "@/constants/colors";
import { SYSTEM_SETTINGS_KEYS } from "@/constants/global";
import { EARNINGS_CONTENT_KEYS } from "@/content/(tabs)/earnings-keys";
import { useAuth } from "@/context/AuthContext";
import { useGetContent } from "@/hooks/useGetContent";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

export default function EarningsScreen() {
  const { getContent } = useGetContent();
  const [auth] = useAuth();

  const { headerTitle, message, actionOpenPortal, driverWebAppProdUrl } =
    useMemo(() => {
      const get = getContent;
      return {
        headerTitle: get(EARNINGS_CONTENT_KEYS.HEADER_TITLE),
        message: get(EARNINGS_CONTENT_KEYS.MESSAGE),
        actionOpenPortal: get(EARNINGS_CONTENT_KEYS.ACTION_OPEN_PORTAL),
        driverWebAppProdUrl: get(
          SYSTEM_SETTINGS_KEYS.DRIVER_WEB_APP_PRODUCTION_URL,
        ),
      };
    }, [getContent]);

  const router = useRouter();
  const bottomTabOverflow = useBottomTabOverflow();

  const handleBackPress = () => {
    router.push("/(tabs)");
  };

  const handleOpenEarningsPortal = () => {
    const base = (driverWebAppProdUrl || "").replace(/\/$/, "");
    const url = base
      ? `${base}/earnings?token=${auth?.token ?? ""}`
      : undefined;
    if (!url) return;
    router.push({
      pathname: "/(screens)/in-app-webview",
      params: {
        url,
        title: headerTitle,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={headerTitle} onBackPress={handleBackPress} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomTabOverflow + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <Typography
            type="bodyLarge"
            weight="regular"
            style={styles.messageText}
          >
            {message}
          </Typography>

          <View style={styles.buttonContainer}>
            <Button
              variant="primary"
              rounded="half"
              onPress={handleOpenEarningsPortal}
            >
              {actionOpenPortal}
            </Button>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  messageText: {
    color: textColors.grey800,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
  },
});
