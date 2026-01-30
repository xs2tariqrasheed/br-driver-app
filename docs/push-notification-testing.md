# Push Notification Testing Guide (BR Driver App)

This guide walks through building a development APK and testing Expo push notifications (background and app-killed states) on a physical device.

---

## 1. Generate a development APK

From the **br-driver-app** directory:

```bash
cd br-driver-app
eas build --profile development --platform android
```

- **Profile**: `development` (uses `developmentClient: true`, internal distribution, APK).
- **Output**: EAS will build in the cloud and provide a download link for the APK when done.
- **Prerequisites**: Log in with `eas login` if needed; ensure `app.json` has correct `extra.eas.projectId` and Android `googleServicesFile` is set.

For a **preview** APK (no dev client, still internal):

```bash
eas build --profile preview --platform android
```

---

## 2. Install the APK on a device

1. Download the APK from the EAS build page (link in the build log or Expo dashboard).
2. Transfer to your Android device (e.g. USB, cloud, or direct download on device).
3. Enable **Install from unknown sources** for the app/browser you use to open the APK.
4. Install and open the BR Driver app.

Use a **physical device**; push notifications do not behave correctly on emulators (no FCM/APNs).

---

## 3. Prerequisites for testing

- **Backend**: Token registration endpoint implemented (see `docs/expo-push-backend-changes.md`). Until then, the app still gets and caches the Expo push token locally but won’t register it with the backend.
- **Firebase**: Android app configured in Firebase with `google-services.json` in `br-driver-app` and package name `com.mujahidforeaims.brdriverapp`.
- **Expo**: Project has an EAS project ID in `app.json` so `getExpoPushTokenAsync()` can succeed.

---

## 4. Get the device push token (for manual sends)

1. Log in as a driver in the app.
2. Grant notification permission when prompted.
3. Either:
   - **Option A**: Add temporary logging in the app (e.g. in `registerTokenIfNeeded` or where you call `getExpoPushTokenAsync`) and read the token from logs (e.g. `npx react-native log-android` or device logcat), or  
   - **Option B**: Implement a small dev-only screen that displays the result of `getExpoPushTokenAsync()` so you can copy the token.

The token looks like: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`.

---

## 5. FCM credentials (required for Expo Push Tool on Android)

To send notifications via the [Expo Push Notifications Tool](https://expo.dev/notifications) to Android devices, Expo must have your **FCM V1 service account key** (not the legacy server key). Without it you’ll see: *"InvalidCredentials: Unable to retrieve the FCM server key for the recipient's app."*

**Steps:**

1. **Create a Google Service Account key in Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com) → your project (**br-driver-app**) → **Project settings** (gear) → [**Service accounts**](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk).
   - Click **Generate new private key** → **Generate key**. Save the JSON file securely (e.g. `br-driver-app-firebase-adminsdk.json`).
   - **Do not commit this file.** Add it to `.gitignore` (e.g. `*-firebase-adminsdk*.json` or the exact filename).

2. **Upload the key to Expo**
   - **Option A – Expo dashboard:** [expo.dev](https://expo.dev) → your project → **Credentials** (under Project settings) → **Android** → under **FCM V1 service account key** click **Add a service account key** → **Upload new key** → select the JSON file → **Save**.
   - **Option B – EAS CLI:** Run `eas credentials`, choose **Android** → **production** (or the profile you use for builds) → **Google Service Account** → **Manage your Google Service Account Key for Push Notifications (FCM V1)** → **Upload a new service account key** → select the JSON file.

3. **Confirm**
   - After saving, send a test from the [Expo Push Notifications Tool](https://expo.dev/notifications) with your Expo push token. It should succeed instead of returning InvalidCredentials.

If you use an **existing** service account (e.g. from Google Cloud), it must have the **Firebase Cloud Messaging API** / **Firebase Messaging API Admin** role in Google Cloud IAM. See [Expo FCM credentials](https://docs.expo.dev/push-notifications/fcm-credentials/).

---

## 6. Send a test notification (Expo push tool)

1. Open [Expo Push Notifications Tool](https://expo.dev/notifications).
2. Paste the **Expo Push Token** from step 4.
3. Fill **Title** and **Message**.
4. (Optional) For tap routing, add JSON in **Message** or use **Additional data**:
   - To open ride offer: `{ "tripId": "<trip-id>" }`
   - Otherwise the app opens the notifications screen when the user taps.
5. Send the notification.

---

## 7. What to test

### 6.1 Background (app in background, not killed)

1. Open the app, log in, then send the app to background (Home or Recent).
2. Send a test push from the Expo tool (or from your backend).
3. **Expected**: System notification appears (banner/sound per device settings). Tapping it opens the app and triggers your response listener (e.g. navigate to ride offer if `tripId` is in `data`, else to notifications).

### 6.2 Killed (app not running)

1. Force-close the app (swipe away from Recents).
2. Send a test push.
3. **Expected**: System notification appears. Tapping it launches the app; `getLastNotificationResponseAsync()` runs and your code routes the user (e.g. to ride offer or notifications screen).

### 6.3 Foreground (app open and in foreground)

1. App open and in foreground.
2. Send a test push.
3. **Expected**: No system notification banner/list (handler returns `shouldShowBanner: false`, `shouldShowList: false`). Your in-app notification flow is unchanged.

### 6.4 Tap routing

- Send a push with **Additional data**: `{ "tripId": "some-trip-id" }`. Tap notification → app should open the ride-offer flow (or the correct screen for that trip).
- Send a push with no `tripId` or only `notificationId`/`type`. Tap → app should open the notifications screen.

---

## 8. Troubleshooting

| Issue | Check |
|-------|--------|
| No token / token null | Device is physical; notification permission granted; EAS project ID in app config; for Android, `google-services.json` present and package name matches. |
| **`SERVICE_NOT_AVAILABLE`** (Android) | **Add your app’s SHA-1 to Firebase** (see [8.1 Fix SERVICE_NOT_AVAILABLE](#81-fix-service_not_available-android) below). Also ensure Google Play Services is up to date on the device and FCM is enabled in Firebase. |
| **`FIS_AUTH_ERROR`** (Android) | **Firebase Installation auth failed.** Enable Firebase Installation API in Google Cloud and fix API key restrictions (see [8.2 Fix FIS_AUTH_ERROR](#82-fix-fis_auth_error-android) below). |
| Notification not received (background/killed) | Token is correct; payload is valid; device network; for Android, app not in aggressive battery optimization. |
| Tap does nothing | Response listener and `getLastNotificationResponseAsync()` are registered in `_layout.tsx`; navigation root is mounted when handling the response. |
| Foreground notification still shows | Ensure `setNotificationHandler` returns `shouldShowBanner: false` and `shouldShowList: false` (see `pushNotificationService.ts`). |

### 8.1 Fix SERVICE_NOT_AVAILABLE (Android)

If you see `Error getting push token: ... SERVICE_NOT_AVAILABLE` on a **physical device**, FCM is rejecting the app. Common causes: **SHA fingerprints not in Firebase**, wrong Firebase project, or propagation delay.

**Steps:**

1. **Get SHA-1 and SHA-256 from your EAS Android keystore (not local debug.keystore)**
   - Open [Expo Dashboard](https://expo.dev) → your project → **Credentials** → **Android**.
   - Under the keystore used for the build you installed (e.g. default), copy **SHA-1** and **SHA-256**.
   - Or run: `eas credentials --platform android`, select the keystore, and copy both fingerprints.
   - **Important:** Use the fingerprints from the **EAS** keystore (the one that signed the APK you installed). Do not use `~/.android/debug.keystore` unless you run a local debug build.

2. **Add both SHA-1 and SHA-256 to Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com) → project **br-driver-app** (the same project as in your `google-services.json`).
   - **Project settings** (gear) → **Your apps** → select the Android app with package **`com.mujahidforeaims.brdriverapp`**.
   - Click **Add fingerprint**, paste **SHA-1**, Save. Then **Add fingerprint** again, paste **SHA-256**, Save.

3. **Wait and clear app state**
   - Firebase/Google can take **5–30 minutes** to apply new fingerprints. Wait a bit, then:
   - On the device: **Settings → Apps → BR Driver → Storage → Clear storage** (or uninstall and reinstall the app).
   - Open the app again, log in, and check logs for `ExponentPushToken: ...`. The app will also retry once after 12 seconds if the first request fails with SERVICE_NOT_AVAILABLE.

4. **If it still fails, double-check**
   - **Same Firebase project:** The **project_id** in `google-services.json` (e.g. `br-driver-app`) must match the Firebase project where you added the fingerprints.
   - **Cloud Messaging:** Firebase Console → Project settings → **Cloud Messaging** tab — ensure it’s enabled (no need to create a new server key for Expo).
   - **Google Play Services:** On the device, Play Store → My apps → **Google Play Services** → Update if available.
   - **Network:** Try without VPN; ensure the device can reach Google (e.g. open google.com in the browser).

### 8.2 Fix FIS_AUTH_ERROR (Android)

If you see `Error getting push token: ... FIS_AUTH_ERROR`, the **Firebase Installation Service** cannot get an auth token. Common causes: **Firebase Installation API** not enabled in Google Cloud, or the **API key** in your app is restricted so it cannot call Firebase APIs.

**Steps:**

1. **Enable Firebase Installation API in Google Cloud**
   - Go to [Google Cloud Console](https://console.cloud.google.com) and select the project linked to your Firebase project (same as `project_id` in `google-services.json`, e.g. **br-driver-app**).
   - Open **APIs & Services** → **Library** (or go to [API Library](https://console.cloud.google.com/apis/library)).
   - Search for **Firebase Installation API** and open it. Click **Enable** if it is not already enabled.
   - Also ensure **Firebase Cloud Messaging API** (or **FCM** / **Cloud Messaging**) is enabled.

2. **Check API key restrictions**
   - In Google Cloud Console → **APIs & Services** → **Credentials**.
   - Find the **API key** that is used by your Android app (the one in `google-services.json` under `client[0].api_key[0].current_key`). You may have multiple keys; the Android client usually uses the key from the downloaded `google-services.json`.
   - Open that key. If **Application restrictions** or **API restrictions** are set, ensure they allow:
     - **Firebase Installations API**
     - **Firebase Cloud Messaging API** (or relevant Firebase/Google APIs)
   - Easiest fix for development: set **API restrictions** to **Don’t restrict key** (or add the two APIs above). Do not over-restrict the key so that Firebase SDK cannot call these APIs.

3. **Use a fresh `google-services.json`**
   - In [Firebase Console](https://console.firebase.google.com) → your project → **Project settings** → **Your apps** → select the Android app (`com.mujahidforeaims.brdriverapp`).
   - Download **google-services.json** again and replace the file in your project (`./google-services.json` and `./android/app/google-services.json` if you use a native `android` folder). Rebuild the app if you change native config.

4. **Clear app data and retry**
   - On the device: **Settings → Apps → BR Driver → Storage → Clear storage** (or reinstall). Then open the app, log in, and check logs again.

---

## 9. Backend-driven testing

Once the backend implements the flow in `docs/expo-push-backend-changes.md`:

1. Driver logs in → app calls token registration endpoint.
2. Backend stores the Expo push token.
3. Trigger a real event (e.g. new trip offer) so the backend sends a push via `expo-server-sdk`.
4. Repeat steps 6.1–6.4 using backend-sent notifications instead of the Expo push tool.

This validates end-to-end: registration, storage, and sending with the correct `data` shape (`tripId`, etc.) for tap routing.
