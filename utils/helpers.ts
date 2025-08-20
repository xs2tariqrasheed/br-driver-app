import { TOKEN_KEY } from "@/constants/global";
import AsyncStorage from "@react-native-async-storage/async-storage";

type StorageValue = string;

/**
 * Returns whether the current Expo environment is development.
 *
 * Reads `process.env.EXPO_PUBLIC_ENVIRONMENT` and compares it to "dev".
 * Falls back to "production" when unspecified.
 *
 * @returns {boolean} True when environment is dev, false otherwise.
 */
export const isDevEnvironment = (): boolean => {
  const env = process.env.EXPO_PUBLIC_ENVIRONMENT || "production";
  return env.toLowerCase() === "dev";
};

/**
 * Creates a console logger function that no-ops outside of development.
 *
 * The returned function proxies its arguments to `console.log` only when
 * `isDevEnvironment()` returns true.
 *
 * @returns {(…args: unknown[]) => void} A logger function safe to use in prod.
 * @example
 * const log = logger();
 * log("Sending request", payload);
 */
export const logger =
  () =>
  (...args: unknown[]) => {
    if (isDevEnvironment()) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  };

/**
 * Persists a string value in AsyncStorage.
 *
 * @param {string} key - Storage key under which to save the value.
 * @param {string} value - The string value to persist.
 * @returns {Promise<void>} Resolves when the value has been saved.
 */
export const setStorageItem = async (
  key: string,
  value: StorageValue
): Promise<void> => {
  await AsyncStorage.setItem(key, value);
};

/**
 * Retrieves a string value from AsyncStorage.
 *
 * @param {string} key - Storage key to read.
 * @returns {Promise<string | null>} The stored value or null if not found.
 */
export const getStorageItem = async (key: string): Promise<string | null> => {
  return AsyncStorage.getItem(key);
};

/**
 * Removes a specific key/value pair from AsyncStorage.
 *
 * @param {string} key - Storage key to remove.
 * @returns {Promise<void>} Resolves when the key has been removed.
 */
export const removeStorageItem = async (key: string): Promise<void> => {
  await AsyncStorage.removeItem(key);
};

/**
 * Clears all keys from AsyncStorage. Use with caution.
 *
 * @returns {Promise<void>} Resolves when storage is cleared.
 */
export const clearStorage = async (): Promise<void> => {
  await AsyncStorage.clear();
};

/**
 * Returns all existing keys in AsyncStorage.
 *
 * @returns {Promise<readonly string[]>} An array of keys.
 */
export const getAllStorageKeys = async (): Promise<readonly string[]> => {
  const keys = await AsyncStorage.getAllKeys();
  return keys;
};

/**
 * Stores multiple key/value pairs in one batch operation.
 *
 * @param {Array<[string, string]>} entries - Array of [key, value] pairs.
 * @returns {Promise<void>} Resolves when all pairs are saved.
 */
export const multiSetStorageItems = async (
  entries: Array<[string, StorageValue]>
): Promise<void> => {
  await AsyncStorage.multiSet(entries);
};

/**
 * Retrieves multiple values by their keys in one batch operation.
 *
 * @param {readonly string[]} keys - Keys to read.
 * @returns {Promise<ReadonlyArray<[string, string | null]>>} Array of [key, value] tuples.
 */
export const multiGetStorageItems = async (
  keys: readonly string[]
): Promise<ReadonlyArray<[string, string | null]>> => {
  return AsyncStorage.multiGet(keys);
};

/**
 * Stores the auth token using the application's canonical token key.
 *
 * @param {string} token - Token string to persist.
 * @returns {Promise<void>} Resolves when stored.
 */
export const setAuthToken = async (token: string): Promise<void> => {
  await setStorageItem(TOKEN_KEY, token);
};

/**
 * Reads the auth token from AsyncStorage.
 *
 * @returns {Promise<string | null>} Token string if present, else null.
 */
export const getAuthToken = async (): Promise<string | null> => {
  return getStorageItem(TOKEN_KEY);
};

/**
 * Removes the stored auth token.
 *
 * @returns {Promise<void>} Resolves when removed.
 */
export const clearAuthToken = async (): Promise<void> => {
  await removeStorageItem(TOKEN_KEY);
};
