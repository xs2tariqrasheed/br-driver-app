import Button from "@/components/Button";
import Input from "@/components/Form/Input";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import { showToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { updateBaseUrls } from "@/config/apiConfig";
import { textColors } from "@/constants/colors";
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
 * Validation ensures it is a valid HTTP or HTTPS URL without port.
 * The port :3001 will be automatically appended when making API calls.
 */
export default function BaseUrlSetupScreen() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Basic validation for HTTP/HTTPS URL without port
   */
  const validateUrl = (input: string) => {
    const trimmed = input.trim();
    // Accept both http:// and https://
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return false;
    }
    
    // Reject URLs that contain a port (colon followed by digits before the first slash or end)
    // This ensures user enters base URL without port (e.g., http://3.84.108.176)
    if (/:(\d+)(?:\/|$)/.test(trimmed)) {
      return false;
    }
    
    // Simple regex to ensure it's http/https and has valid format
    const urlRegex = /^https?:\/\/[^\s\/]+(?:\/.*)?$/;
    
    return urlRegex.test(trimmed);
  };

  const handleSubmit = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      showToast("Please enter a URL", { variant: "error", position: "top" });
      return;
    }

    if (!validateUrl(trimmedUrl)) {
      showToast("Please enter a valid HTTP or HTTPS URL (without port)", { variant: "error", position: "top" });
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
            <Typography style={styles.textBlack} type="titleExtraLarge" weight="semibold">
              Server Configuration
            </Typography>
            <Typography style={styles.textBlack} weight="regular" type="bodyMedium">
              Please enter the deployed base URL for the server you want to connect to (without port). This will be used for all services.
            </Typography>
          </View>

          <View style={styles.formGroup}>
            <Input
              label="Deployed Base URL"
              placeholder="http://3.84.108.176"
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
  textBlack: {
    color: textColors.black,
  },
});
