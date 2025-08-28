# Google Maps Setup Guide

This project now includes Google Maps integration for location picking functionality. Follow these steps to complete the setup:

## 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key to your app's bundle identifier

## 2. Update Configuration Files

### Update app.json
Replace the placeholder API keys in `app.json`:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_ACTUAL_IOS_API_KEY"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ACTUAL_ANDROID_API_KEY"
        }
      }
    },
    "plugins": [
      [
        "react-native-maps",
        {
          "googleMapsApiKey": "YOUR_ACTUAL_API_KEY"
        }
      ]
    ]
  }
}
```

### Update Map Component
In `components/Map.tsx`, replace the placeholder API key in the `reverseGeocode` function:

```typescript
const response = await fetch(
  `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=YOUR_ACTUAL_API_KEY`
);
```

## 3. Platform-Specific Setup

### iOS
1. Run `npx expo run:ios` to build the iOS app
2. The Google Maps configuration will be automatically applied

### Android
1. Run `npx expo run:android` to build the Android app
2. The Google Maps configuration will be automatically applied

## 4. Features

The implemented map includes:
- Interactive Google Maps with touch-to-select functionality
- Automatic address reverse geocoding
- Current location detection
- Custom marker for selected locations
- Responsive UI with instruction overlay
- Button state management based on location selection

## 5. Usage

Users can:
1. View the map with their current location
2. Tap anywhere on the map to select a location
3. See the selected location marked with a pin
4. Get the address automatically filled in the input field
5. Continue with the selected destination

## 6. Troubleshooting

- **Map not loading**: Check API key configuration and internet connection
- **Location permission denied**: Ensure location permissions are granted
- **Geocoding not working**: Verify Geocoding API is enabled and API key is valid
- **Build errors**: Make sure to rebuild the app after configuration changes

## 7. Security Notes

- Never commit API keys to version control
- Use environment variables for production builds
- Restrict API keys to your app's bundle identifier
- Monitor API usage in Google Cloud Console
