import Button from "@/components/Button";
import Input from "@/components/Form/Input";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import { showToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { updateBaseUrls } from "@/config/apiConfig";
import { DEPLOYED_BASE_URL_STORAGE_KEY } from "@/constants/global";
import { setStorageItem } from "@/utils/helpers";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

/**
 * Screen that prompts the user to enter the deployed base URL on first launch.
 * This URL is used as the base for all API services.
 * Validation ensures it is a valid HTTPS URL.
 */
export default function BaseUrlSetupScreen() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Basic validation for HTTPS URL
   */
  const validateUrl = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed.startsWith("https://")) return false;
    
    // Also allow IP addresses for testing if needed, but user specifically asked for HTTPS URL
    // So we'll stick to a slightly more lenient regex that just ensures it's https and has some content after
    const simpleHttpsRegex = /^https:\/\/.+/;
    
    return simpleHttpsRegex.test(trimmed);
  };

  const handleSubmit = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      showToast("Please enter a URL", { variant: "error", position: "top" });
      return;
    }

    if (!validateUrl(trimmedUrl)) {
      showToast("Please enter a valid HTTPS URL", { variant: "error", position: "top" });
      return;
    }

    setLoading(true);
    try {
      // Remove trailing slash if present for consistency
      const finalUrl = trimmedUrl.endsWith("/") ? trimmedUrl.slice(0, -1) : trimmedUrl;
      
      await setStorageItem(DEPLOYED_BASE_URL_STORAGE_KEY, finalUrl);
      updateBaseUrls(finalUrl);
      showToast("Base URL configured successfully", { variant: "success", position: "top" });
      
      // Navigate to login
      router.replace("/(screens)/auth/login");
    } catch (error) {
      showToast("Failed to save URL. Please try again.", { variant: "error", position: "top" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Environment Setup" hideBackIcon />
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.centeredRow}>
            <Logo size="Large" />
          </View>

          <View style={styles.titleGroup}>
            <Typography type="titleExtraLarge" weight="semibold">
              Server Configuration
            </Typography>
            <Typography type="bodyMedium">
              Please enter the deployed base URL for the server you want to connect to. This will be used for all services.
            </Typography>
          </View>

          <View style={styles.formGroup}>
            <Input
              label="Deployed Base URL"
              placeholder="https://api.example.com"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              name="baseUrl"
            />
            
            <Button
              variant="primary"
              rounded="half"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
            >
              Submit
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  keyboardAvoiding: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    gap: 30,
  },
  centeredRow: {
    alignItems: "center",
  },
  titleGroup: {
    gap: 8,
  },
  formGroup: {
    gap: 20,
  },
});
