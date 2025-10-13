# MapLoading Component

A reusable loading component that displays an animated location icon with three concentric pulse rings creating a wave effect.

## Features

- **Three Pulse Rings**: Different sizes (80px, 100px, 120px) creating a wave effect
- **Staggered Animation**: 500ms delays between each ring for smooth wave motion
- **Centered Location Icon**: Uses `location-icon.png` from assets
- **Black Color Scheme**: Professional black aesthetic
- **Smooth Animations**: Native performance with 60fps
- **Customizable**: Optional callbacks for animation events

## Usage

### Basic Usage

```tsx
import MapLoading from "@/components/MapLoading";

function MyComponent() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View style={{ flex: 1 }}>
      {isLoading ? <MapLoading isLoading={isLoading} /> : <YourContent />}
    </View>
  );
}
```

### With Callbacks

```tsx
import MapLoading from "@/components/MapLoading";

function MyComponent() {
  const [isLoading, setIsLoading] = useState(true);

  const handleAnimationStart = () => {
    console.log("Loading animation started");
  };

  const handleAnimationStop = () => {
    console.log("Loading animation stopped");
  };

  return (
    <MapLoading
      isLoading={isLoading}
      onAnimationStart={handleAnimationStart}
      onAnimationStop={handleAnimationStop}
    />
  );
}
```

## Props

| Prop               | Type         | Default     | Description                                     |
| ------------------ | ------------ | ----------- | ----------------------------------------------- |
| `isLoading`        | `boolean`    | `true`      | Whether the loading animation should be visible |
| `onAnimationStart` | `() => void` | `undefined` | Optional callback when animation starts         |
| `onAnimationStop`  | `() => void` | `undefined` | Optional callback when animation stops          |

## Animation Details

- **Pulse Effect**: Each ring scales from 1x to 2.5x and fades out
- **Duration**: 1.5 seconds for each complete pulse cycle
- **Staggered Timing**: 500ms delays between rings
- **Opacity Levels**: 0.6, 0.4, 0.2 for different visual intensity
- **Location Icon**: 50x50px, scales and fades in smoothly

## Styling

The component uses a white background and black pulse rings. The location icon is centered and uses the asset from `@/assets/images/location-icon.png`.

## Performance

- Uses `useNativeDriver: true` for smooth 60fps animations
- Efficient memory management with proper cleanup
- Optimized for React Native performance
