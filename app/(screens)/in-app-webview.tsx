import Header from "@/components/Header";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

// Placeholder URL when no url param is provided (e.g. before web app is deployed)
const DEFAULT_WEBVIEW_URL = "https://example.com";

export default function InAppWebViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string; title?: string }>();

  const uri = useMemo(() => {
    const raw = params.url?.trim();
    if (raw && (raw.startsWith("http://") || raw.startsWith("https://"))) {
      return raw;
    }
    return DEFAULT_WEBVIEW_URL;
  }, [params.url]);

  const title = useMemo(
    () => params.title?.trim() || "Web",
    [params.title],
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={title}
        hideBackIcon={false}
        onBackPress={() => router.back()}
      />
      <View style={styles.webviewWrap}>
        <WebView
          source={{ uri }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webviewWrap: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
