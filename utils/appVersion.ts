import Constants from "expo-constants";

/**
 * Version strings from the native binary (iOS / Android), not from CMS.
 * Mirrors `version` + `ios.buildNumber` / Android `versionCode` from app.json / EAS at build time.
 */
export function getNativeAppVersion(): string {
  return (
    Constants.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    "—"
  );
}

export function getNativeBuildNumber(): string | null {
  const b = Constants.nativeBuildVersion;
  if (b == null || String(b).trim() === "") return null;
  return String(b);
}

/** e.g. `1.2.0 (3)` — semver + store build number */
export function getAppVersionLabel(): string {
  const version = getNativeAppVersion();
  const build = getNativeBuildNumber();
  if (build != null) {
    return `${version} (${build})`;
  }
  return version;
}
