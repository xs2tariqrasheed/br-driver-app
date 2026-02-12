import Button from "@/components/Button";
import { Header } from "@/components/Header";
import Typography from "@/components/Typography";
import { useBottomTabOverflow } from "@/components/ui/TabBarBackground";
import { textColors } from "@/constants/colors";
import { URLS } from "@/constants/global";
import { EARNINGS_CONTENT_KEYS } from "@/content/(tabs)/earnings-keys";
import { useGetContent } from "@/hooks/useGetContent";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

export default function EarningsScreen() {
  const { getContent } = useGetContent();

  const { headerTitle, message, actionOpenPortal } = useMemo(() => {
    const get = getContent;
    return {
      headerTitle: get(EARNINGS_CONTENT_KEYS.HEADER_TITLE),
      message: get(EARNINGS_CONTENT_KEYS.MESSAGE),
      actionOpenPortal: get(EARNINGS_CONTENT_KEYS.ACTION_OPEN_PORTAL),
    };
  }, [getContent]);

  const router = useRouter();
  const bottomTabOverflow = useBottomTabOverflow();

  const handleBackPress = () => {
    router.push("/(tabs)");
  };

  const handleOpenEarningsPortal = () => {
    router.push({
      pathname: "/(screens)/in-app-webview",
      params: {
        url: URLS.earningsPortal,
        title: "Web Portal",
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
