## Settings Context (App preferences, persisted)

The Settings Context provides a centralized, persistent store for user-configurable app preferences (Login Settings, Ride Preferences, Notifications). It mirrors the `AuthContext`/`DriverContext` patterns and persists via `AsyncStorage` using small helpers in `utils/helpers`.

### File locations

- Provider and hook: `context/SettingsContext.tsx`
- Storage key: `SETTINGS_STORAGE_KEY` (`"@settings"`)
- UI entry: `app/(screens)/more/app-settings.tsx` (Accordion-based settings screen)

### State shape

```
export type LoginSettings = {
  enableFaceRecognition: boolean;
  enableFaceId: boolean;
  enableFingerprint: boolean;
};

export type HomePagePreferences = {
  liveJobs: boolean;
  futureReservations: boolean;
  longDistanceIntercity: boolean;
  pets: boolean;
  package: boolean;
};

export type RidePreferences = {
  homePage: HomePagePreferences;
};

export type NotificationsSettings = {
  muteJobOffers: boolean;
  muteAll: boolean;
};

export type SettingsObject = {
  loginSettings: LoginSettings;
  ridePreferences: RidePreferences;
  notifications: NotificationsSettings;
  [key: string]: unknown; // forward-compatible extension point
};
```

Defaults (used on first run and as a fallback):

```
{
  loginSettings: {
    enableFaceRecognition: true,
    enableFaceId: true,
    enableFingerprint: true,
  },
  ridePreferences: {
    homePage: {
      liveJobs: false,
      futureReservations: false,
      longDistanceIntercity: false,
      pets: false,
      package: false,
    },
  },
  notifications: {
    muteJobOffers: false,
    muteAll: false,
  },
}
```

### Hydration and persistence

- On mount, the provider reads `@settings` from storage and hydrates the context. While hydrating, children are not rendered to avoid flicker.
- Stored data is deep-merged with `DEFAULT_SETTINGS` so newly added keys are automatically populated across nested objects (e.g., `ridePreferences.homePage`).
- Calling `setSettings(next)` updates context state and saves to storage.

### API

The hook returns a tuple `[settings, setSettings]`:

```
import { useSettings } from "@/context/SettingsContext";

const [settings, setSettings] = useSettings();

// Read values
const isFingerprintAllowed = settings.loginSettings.enableFingerprint;

// Update a login toggle (persisted)
await setSettings({
  ...settings,
  loginSettings: {
    ...settings.loginSettings,
    enableFingerprint: false,
  },
});

// Update a ride preference (nested)
await setSettings({
  ...settings,
  ridePreferences: {
    ...settings.ridePreferences,
    homePage: {
      ...settings.ridePreferences.homePage,
      liveJobs: true,
    },
  },
});

// Update notifications
await setSettings({
  ...settings,
  notifications: {
    ...settings.notifications,
    muteAll: true,
  },
});
```

### App Settings screen

- Implemented in `app/(screens)/more/app-settings.tsx` using `Accordion` and `Toggle` components.
- Panels:
  - Login Settings: 3 toggles (Face Recognition, Face ID, Fingerprint)
  - Ride Preferences → Home Page: 5 toggles (Live Jobs, Future Reservations, Long Distance/Intercity, Pets, Package)
  - Notifications: 2 toggles (Mute Job Offers, Mute All)
  - App Info: displays `APP_VERSION` from `constants/global.ts`
- Additional items in the list (Availability & Scheduling, Safety Settings) are placeholders for future panels.

### Login screen integration

- `app/(screens)/auth/login.tsx` reads `SettingsContext` to enable/disable biometric login options:
  - UI shows greyed-out card, icon, and text only when a method is disabled in settings.
  - Unsupported methods display a "Not supported" reason and open an info sheet when tapped.
  - Tap is hard-disabled when a method is disabled in settings.

### Extending the context

To add a category (e.g., Availability):

1. Extend types in `context/SettingsContext.tsx` and add defaults to `DEFAULT_SETTINGS`.
2. The provider will deep-merge stored values with defaults on hydration (forward-compatible).
3. Build an Accordion panel in `app-settings.tsx` that reads/writes via `setSettings`.
4. Consume the new setting(s) in relevant screens.
