import { getStorageItem, setStorageItem } from "@/utils/helpers";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const STORAGE_KEY_PREFIX = "@expoPushToken:";

// Foreground: suppress Expo/system notification UI. Background/killed are unaffected.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannelAsync(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });
  } catch {
    // no-op
  }
}

function getExpoProjectId(): string | undefined {
  // Prefer EAS project id from app config.
  const easProjectId =
    (Constants as any)?.easConfig?.projectId ||
    (Constants as any)?.expoConfig?.extra?.eas?.projectId;
  return (
    process.env.EXPO_PUBLIC_PROJECT_ID ||
    process.env.EXPO_PROJECT_ID ||
    easProjectId
  );
}

async function getStoredToken(userId: string): Promise<string | null> {
  try {
    const raw = await getStorageItem(`${STORAGE_KEY_PREFIX}${userId}`);
    return raw || null;
  } catch {
    return null;
  }
}

async function storeToken(userId: string, token: string): Promise<void> {
  try {
    await setStorageItem(`${STORAGE_KEY_PREFIX}${userId}`, token);
  } catch {
    // ignore
  }
}

export async function getExpoPushTokenAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Push notifications not supported on simulator/emulator");
    return null;
  }
  try {
    await ensureAndroidChannelAsync();
    const settings = await Notifications.getPermissionsAsync();
    let status = settings.status;
    if (status !== "granted" && settings.canAskAgain) {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") {
      console.log("Push notification permission not granted:", status);
      return null;
    }

    const projectId = getExpoProjectId();
    console.log("Using EAS Project ID:", projectId);
    if (!projectId) {
      console.log("EAS Project ID not found in app config");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log("ExponentPushToken:", tokenData.data);
    return tokenData.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log("Error getting push token:", error);
    if (Platform.OS === "android" && typeof message === "string") {
      if (message.includes("FIS_AUTH_ERROR")) {
        console.log(
          "→ FIS_AUTH_ERROR: Enable Firebase Installation API in Google Cloud and ensure API key is not restricted. See docs/push-notification-testing.md §8.2"
        );
      } else if (message.includes("SERVICE_NOT_AVAILABLE")) {
        console.log(
          "→ Add SHA-1 and SHA-256 from EAS Credentials to Firebase. See docs/push-notification-testing.md §8.1"
        );
      }
    }
    return null;
  }
}

// Backend placeholder: safe no-op until backend endpoint exists.
async function registerTokenWithBackend(_userId: string, _token: string) {
  // Intentionally left as a safe stub.
  // When backend is ready, implement an authenticated upsert endpoint and call it here.
  return true;
}

export async function registerTokenIfNeeded(userId: string): Promise<boolean> {
  console.log("registerTokenIfNeeded called for userId:", userId);
  try {
    const [stored, current] = await Promise.all([
      getStoredToken(userId),
      getExpoPushTokenAsync(),
    ]);
    if (!current) {
      console.log("No push token available for registration");
      return false;
    }
    if (stored === current) {
      console.log("Push token already registered for this user");
      return true;
    }

    const ok = await registerTokenWithBackend(userId, current);
    if (ok) {
      console.log("Push token registered successfully with backend");
      await storeToken(userId, current);
    } else {
      console.log("Failed to register push token with backend");
    }
    return ok;
  } catch (error) {
    console.log("Error in registerTokenIfNeeded:", error);
    return false;
  }
}
