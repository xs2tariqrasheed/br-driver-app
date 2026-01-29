import { getStorageItem, setStorageItem } from "@/utils/helpers";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
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
  if (!Device.isDevice) return null;
  try {
    await ensureAndroidChannelAsync();
    const settings = await Notifications.getPermissionsAsync();
    let status = settings.status;
    if (status !== "granted" && settings.canAskAgain) {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") return null;

    const projectId = getExpoProjectId();
    if (!projectId) return null;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch {
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
  try {
    const [stored, current] = await Promise.all([
      getStoredToken(userId),
      getExpoPushTokenAsync(),
    ]);
    if (!current) return false;
    if (stored === current) return true;

    const ok = await registerTokenWithBackend(userId, current);
    if (ok) await storeToken(userId, current);
    return ok;
  } catch {
    return false;
  }
}

