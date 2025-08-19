import { TOKEN_KEY } from "@/constants/global";
import AsyncStorage from "@react-native-async-storage/async-storage";

type StorageValue = string;

export const isDevEnvironment = (): boolean => {
  const env = process.env.EXPO_PUBLIC_ENVIRONMENT || "production";
  return env.toLowerCase() === "dev";
};

export const logger =
  () =>
  (...args: unknown[]) => {
    if (isDevEnvironment()) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  };

export const setStorageItem = async (
  key: string,
  value: StorageValue
): Promise<void> => {
  await AsyncStorage.setItem(key, value);
};

export const getStorageItem = async (key: string): Promise<string | null> => {
  return AsyncStorage.getItem(key);
};

export const removeStorageItem = async (key: string): Promise<void> => {
  await AsyncStorage.removeItem(key);
};

export const clearStorage = async (): Promise<void> => {
  await AsyncStorage.clear();
};

export const getAllStorageKeys = async (): Promise<readonly string[]> => {
  const keys = await AsyncStorage.getAllKeys();
  return keys;
};

export const multiSetStorageItems = async (
  entries: Array<[string, StorageValue]>
): Promise<void> => {
  await AsyncStorage.multiSet(entries);
};

export const multiGetStorageItems = async (
  keys: readonly string[]
): Promise<ReadonlyArray<[string, string | null]>> => {
  return AsyncStorage.multiGet(keys);
};

export const setAuthToken = async (token: string): Promise<void> => {
  await setStorageItem(TOKEN_KEY, token);
};

export const getAuthToken = async (): Promise<string | null> => {
  return getStorageItem(TOKEN_KEY);
};

export const clearAuthToken = async (): Promise<void> => {
  await removeStorageItem(TOKEN_KEY);
};
