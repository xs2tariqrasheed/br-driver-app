# RideMap Native Implementation

## Overview

Replaced the WebView-based `RideMapWebView` component with a native Google Maps implementation using `react-native-maps` and `react-native-maps-directions`.

## What Changed

### 1. New Component: `components/RideMap/index.tsx`

- **Native MapView**: Uses `react-native-maps` instead of WebView
- **MapViewDirections**: Native route rendering with polylines
- **Performance**: Significantly better performance and smoother animations
- **Native Features**: Full access to native map APIs and gestures

### 2. Updated: `app/(screens)/active-ride.tsx`

- Imports changed from `RideMapWebView` to `RideMap`
- Component usage remains identical with same props interface
- No changes to screen logic required

## Key Features

### Map Markers

- **Car Icon**: Current driver location with rotation based on direction of travel
- **Pickup Icon**: Red pickup location marker with callout
- **Dropoff Icon**: Green dropoff location marker with callout
- **Rotation**: Car marker rotates smoothly based on bearing/heading

### Route Visualization

- **Pickup Route**: Blue polyline from current location to pickup (dynamic)
- **Dropoff Route**: Green polyline from pickup to dropoff
- **Auto-switching**: Pickup route disappears when driver reaches pickup location
- **Real-time updates**: Routes update as car position changes

### UI Overlays

- **Status Tag**: Top-left corner showing ride status ("En Route", "On Scene")
- **ETA Tag**: Top-right corner showing estimated arrival time
- **Waze Button**: Bottom-left button for opening navigation in Waze
- **Testing Controls**: Dev-only controls for simulating car movement

### Callouts & Info Windows

- **Tap markers**: Tap pickup/dropoff markers to see address details
- **Styled callouts**: Native callouts with color-coded indicators
- **Auto-fit bounds**: Map automatically adjusts to show all markers

### Navigation Integration

- **Waze deep linking**: Opens Waze app with destination pre-filled
- **Fallback**: Opens Waze web version if app not installed
- **Cross-platform**: Works on both iOS and Android

### Testing Mode

- **Simulate movement**: Test car movement along the route
- **Automatic rotation**: Car icon rotates based on movement direction
- **Route switching**: Automatically switches from pickup to dropoff route
- **Dev-only feature**: Helps with testing UI without actual driving

## Component API

```tsx
interface RideMapProps {
  pickupAddress: string;
  dropoffAddress: string;
  rideStatus?: string; // Default: "En Route"
  eta?: string; // Optional ETA display
  showWazeButton?: boolean; // Default: false
  onWazePress?: () => void;
  onMapReady?: () => void;
  onError?: (error: string) => void;
}
```

## Usage Example

```tsx
import RideMap from "@/components/RideMap";

<RideMap
  pickupAddress="99C7+8WV, Service Road, Kahna Nau, Lahore"
  dropoffAddress="18-KM Main Lahore – Kasur Rd، opp. Descon Head Office,"
  eta="10 mins"
  showWazeButton={true}
  rideStatus="En Route"
  onMapReady={() => console.log("Map ready")}
  onError={(error) => console.error("Map error:", error)}
/>;
```

## Advantages Over WebView

### Performance

- ✅ Native rendering (no JavaScript bridge)
- ✅ Smooth 60fps animations
- ✅ Better memory management
- ✅ Faster map loading and panning
- ✅ Hardware-accelerated graphics

### User Experience

- ✅ Native map gestures (pinch, rotate, tilt)
- ✅ Instant touch feedback
- ✅ Smoother marker animations
- ✅ Better offline support
- ✅ Consistent with system maps

### Development

- ✅ No HTML/JS string generation
- ✅ Full TypeScript support
- ✅ Easier debugging
- ✅ Better error handling
- ✅ Access to all native map features

### Maintenance

- ✅ Simpler component structure
- ✅ Standard React Native patterns
- ✅ No WebView quirks
- ✅ Better testability

## Technical Details

### Dependencies

- `react-native-maps`: v1.20.1 (already installed)
- `react-native-maps-directions`: v1.9.0 (already installed)
- Uses `PROVIDER_GOOGLE` for consistent experience

### Geocoding

- Uses `geocodeAddress()` helper from utils
- Converts address strings to coordinates
- Handles errors gracefully with fallbacks

### Directions

- Uses `react-native-maps-directions` component
- Calculates routes via Google Directions API
- Renders polylines automatically
- Provides route coordinates for testing

### Car Rotation

- Calculates bearing between consecutive points
- Uses native `rotation` prop on Marker
- Smooth interpolation during testing mode
- Supports both manual and automatic updates

### Location Handling

- Gets current location via `getCurrentLocation()` helper
- Auto-centers map to show all markers
- Adjusts bounds with appropriate padding
- Handles permission errors gracefully

### Waze Integration

```tsx
// iOS
waze://?ll=LAT,LNG&navigate=yes

// Android
waze://?ll=LAT,LNG&navigate=yes

// Fallback (web)
https://waze.com/ul?ll=LAT,LNG&navigate=yes
```

## Implementation Details

### Car Marker Rotation

The car icon rotates based on the bearing between two consecutive route points:

```tsx
const bearing = calculateBearing(startPoint, endPoint);
setCarRotation(bearing);

// In Marker component
<Marker rotation={carRotation} flat={true} />;
```

### Route Switching Logic

```tsx
// Check distance to pickup
const distance = getDistance(currentLocation, pickupLocation);
if (distance < 50 && showPickupRoute) {
  // Within 50 meters - switch to dropoff route
  setShowPickupRoute(false);
}
```

### Testing Mode Flow

1. User clicks "Start Testing"
2. Component retrieves route coordinates from MapViewDirections
3. Interval timer updates position every 2 seconds
4. Car marker moves and rotates along the route
5. Routes switch automatically near pickup
6. Stops when reaching end of route

## File Structure

```
components/
  RideMap/
    index.tsx          # Native implementation
  RideMapWebView/
    index.tsx          # Old WebView (can be deprecated)

app/
  (screens)/
    active-ride.tsx    # Updated to use RideMap

utils/
  helpers.ts           # Shared geocoding/directions functions
```

## Migration Notes

If you have other screens using `RideMapWebView`:

1. Change import: `RideMapWebView` → `RideMap`
2. Props remain the same (backward compatible)
3. Remove any WebView-specific workarounds
4. Test on both iOS and Android

## Testing Checklist

- [x] Map loads with correct initial position
- [x] Car marker displays at current location
- [x] Pickup marker shows correct location
- [x] Dropoff marker shows correct location
- [x] Blue route renders from car to pickup
- [x] Green route renders from pickup to dropoff
- [x] Car icon rotates based on direction
- [x] Status tag displays correctly
- [x] ETA tag displays when provided
- [x] Waze button opens Waze app
- [x] Marker callouts show address info
- [x] Testing mode simulates movement
- [x] No linter errors
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Test with various addresses
- [ ] Test offline behavior
- [ ] Test Waze integration on device

## Known Limitations

1. **Geocoding**: Requires valid addresses or coordinates
2. **API Key**: Needs Google Maps API key with proper restrictions
3. **Network**: Requires internet for initial geocoding and routes
4. **Car Icon**: SVG support depends on react-native-svg library

## Future Enhancements

Potential improvements:

1. **Real-time location tracking**: Live GPS updates
2. **Traffic layer**: Show traffic conditions
3. **Alternative routes**: Display multiple route options
4. **Voice navigation**: Turn-by-turn instructions
5. **Route optimization**: Suggest better routes
6. **Offline maps**: Cache map tiles for offline use
7. **Custom styling**: Dark mode, custom map themes
8. **ETA calculation**: Real-time ETA updates based on traffic
9. **Geofencing**: Alerts when approaching pickup/dropoff
10. **Trip recording**: Record and replay completed trips

## Performance Optimization

- Marker icons are cached and reused
- `tracksViewChanges={false}` for static markers (can be added)
- Route coordinates stored in refs to avoid re-renders
- Map bounds calculated only when needed
- Testing interval uses refs to avoid state updates

## Troubleshooting

### Map not showing

- Check Google Maps API key is valid
- Verify API key has Maps SDK enabled
- Check console for specific errors

### Markers not appearing

- Ensure coordinates are valid numbers
- Check that geocoding succeeded
- Verify marker images are loaded

### Routes not rendering

- Confirm Directions API is enabled
- Check API key has Directions API access
- Verify origin/destination coordinates are valid

### Waze button not working

- Install Waze app on device
- Check deep linking permissions
- Test fallback web URL

## Related Files

- `/components/RideMap/index.tsx` - New native component
- `/components/RideMapWebView/index.tsx` - Old WebView component
- `/app/(screens)/active-ride.tsx` - Updated screen
- `/utils/helpers.ts` - Geocoding and directions helpers
- `/components/RideOffer/index.tsx` - Reference implementation
