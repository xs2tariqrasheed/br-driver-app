## BR Driver App

A React Native mobile application built with Expo for driver operations and job management.

### Features

- **Authentication flow**: Login, forgot user ID, forgot password, OTP verification, reset/update password
- **Tabbed navigation**: Home, Active Job, and More using Expo Router with custom, haptic tab items
- **Global notifications**: Toast-style notifications with variants (success, warning, error) and auto-hide
- **Robust API layer**: Axios client with request/response interceptors, auth header injection, and consistent error handling
- **Reusable data hooks**: `useFetch`, `usePost`, `useDelete`, `useGetById` with loading/error/data state management
- **Typed routes**: File-based routing with typed routes enabled
- **Polished UI/UX**: Custom typography system, SF Pro fonts, buttons, accordion, bottom sheet provider, haptics, and blur tab bar on iOS
- **Skeleton loading**: Shimmer-based `SkeletonLoader` component for content placeholders

### Setup

#### Prerequisites

- Node.js v18+
- Expo CLI
- iOS Simulator (Xcode) and/or Android Emulator (Android Studio)

#### Installation

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure environment (optional but recommended)

   The API client reads `EXPO_PUBLIC_BASE_URL` for the backend base URL.

   ```bash
   EXPO_PUBLIC_BASE_URL=https://api.example.com npx expo start
   ```

3. Start the development server

   ```bash
   npx expo start
   ```

You can open the app in a development build, Android emulator, iOS simulator, or Expo Go. This project uses file-based routing via Expo Router.

### Project Structure

```
br-driver-app/
├── app/                       # Expo Router entry and screens
│   ├── _layout.tsx            # Root providers (Auth, BottomSheet, Toast) and navigation
│   ├── (tabs)/                # Tab navigator
│   │   ├── _layout.tsx        # Tabs: Home, Active Job, More
│   │   ├── index.tsx          # Home tab
│   │   ├── active-job.tsx     # Active Job tab
│   │   └── more.tsx           # More tab
│   └── (screens)/             # Non-tab screens
│       ├── auth/              # Auth flow screens (login, OTP, password)
│       └── notifications.tsx  # Notifications screen
├── components/                # Reusable UI components
│   ├── Toast/                 # Global toast host and API
│   ├── Typography/            # Typography system and presets
│   ├── Button/                # Buttons and swipe button
│   ├── Accordion/             # Accordion UI
│   ├── Loader/                # Spinner and skeleton loader
│   └── ui/                    # Tab bar background, icons, etc.
├── config/
│   └── apiConfig.ts           # Axios client with interceptors
├── constants/                 # Colors, endpoints, globals
├── context/
│   ├── AuthContext.tsx        # Auth state + persistence (AsyncStorage)
│   ├── DriverContext.tsx      # Driver state (online/offline) + persistence
│   └── SettingsContext.tsx    # App preferences (Login, Ride, Notifications) + persistence
├── hooks/                     # Data-fetching hooks (GET/POST/DELETE/GET-by-ID)
├── utils/                     # Helpers (logger, storage utils)
├── assets/                    # Fonts and images
└── scripts/                   # Project scripts
```

### Key Modules

#### AuthContext

- Hydrates auth state from AsyncStorage and exposes `[auth, setAuth]`
- Simple API for setting/clearing persisted auth
- Used globally in `app/_layout.tsx`

Usage:

```typescript
import { useAuth } from "@/context/AuthContext";

const [auth, setAuth] = useAuth();

// Set token (persisted)
await setAuth({ token: "jwt-token" });

// Clear token (removes persistence)
await setAuth(null);
```

#### API Client and Hooks

- Centralized axios instance with interceptors in `config/apiConfig.ts`
- Hooks: `useFetch`, `usePost`, `useDelete`, `useGetById` for consistent stateful requests

Example (GET):

```typescript
import { useFetch } from "@/hooks/useFetch";

const { data, loading, error, execute } = useFetch<any>("/example");

// Later in an effect or handler
await execute({ page: 1 });
```

#### DriverContext

- Mirrors the AuthContext pattern and exposes `[driver, setDriver]`
- Persists the driver's status to AsyncStorage using `DRIVER_STORAGE_KEY`
- UI labels come from `DRIVER_STATUS` constants

Usage:

```typescript
import { useDriver } from "@/context/DriverContext";
import { DRIVER_STATUS } from "@/constants/global";

const [driver, setDriver] = useDriver();

// Read
const isOnline = !!driver?.online;

// Update
await setDriver({ ...(driver ?? {}), online: true });

// Labels for UI (do not hardcode strings)
const labels = [DRIVER_STATUS.OFFLINE, DRIVER_STATUS.ONLINE] as const;
```

See `docs/driver-context.md` for more details.

#### SettingsContext

- Centralized app preferences persisted to AsyncStorage under `@settings`
- Categories: `loginSettings`, `ridePreferences.homePage`, `notifications`
- Used in App Settings screen to toggle features and on Login to enable/disable biometrics

Usage:

```typescript
import { useSettings } from "@/context/SettingsContext";

const [settings, setSettings] = useSettings();

// Update a login toggle
await setSettings({
  ...settings,
  loginSettings: { ...settings.loginSettings, enableFingerprint: false },
});

// Update a ride preference (nested)
await setSettings({
  ...settings,
  ridePreferences: {
    ...settings.ridePreferences,
    homePage: { ...settings.ridePreferences.homePage, liveJobs: true },
  },
});

// Update notifications
await setSettings({
  ...settings,
  notifications: { ...settings.notifications, muteAll: true },
});
```

See `docs/settings-context.md` for full details.

Example (POST):

```typescript
import { usePost } from "@/hooks/usePost";

const { data, loading, error, execute } = usePost<any, { email: string }>(
  "/login"
);
await execute({ email: "john@doe.com" });
```

#### Toast Notifications

- Custom toast host and `showToast` API with variants: `success`, `warning`, `error`
- Auto-hide with safe-area aware top offset

Usage:

```typescript
import { showToast } from "@/components/Toast";

showToast("Profile updated", { variant: "success", position: "top" });
```

### Component Demos

- All UI components come with runnable demos in `components/Examples.tsx`.
- To preview all components quickly, temporarily render the Examples screen in the Home tab:

```typescript
// app/(tabs)/index.tsx
import Examples from "@/components/Examples";

export default function HomeScreen() {
  return <Examples />;
}
```

Remove or revert this change when you're done exploring the components.

Or enable a dedicated Examples tab without editing screens by starting Expo with an env flag:

```bash
EXPO_PUBLIC_SHOW_EXAMPLES=true npx expo start
```

This will add an `Examples` tab automatically.

### Development

#### Running

```bash
npm start          # Start Expo dev server
npm run android    # Open on Android
npm run ios        # Open on iOS
npm run web        # Open on web
```

#### Linting

```bash
npm run lint
```

#### Resetting the starter example (optional)

```bash
npm run reset-project
```

### Configuration Notes

- Fonts are loaded in `app/_layout.tsx` (SF Pro Display family)
- Typed routes are enabled via Expo Router experiments
- API base URL can be configured via `EXPO_PUBLIC_BASE_URL`
- Temporary/dummy auth endpoints live in `constants/endpoints.ts`

### Dependencies (excerpt)

- **Core**: React 19.0.0, React Native 0.79.5, Expo ~53.0.20
- **Navigation**: Expo Router ~5.1.4, React Navigation, Gesture Handler, Reanimated, Screens, Safe Area Context
- **Networking**: axios, @react-native-async-storage/async-storage
- **UI/UX**: @gorhom/bottom-sheet, expo-blur, expo-haptics, expo-linear-gradient, @expo/vector-icons
- **Forms**: react-hook-form

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### License

This project is proprietary and confidential.
