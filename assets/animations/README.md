# Lottie Animations

Place your Lottie animation JSON files in this directory.

## Where to Get Free Lottie Animations

1. **LottieFiles** - https://lottiefiles.com/

   - Free and premium animations
   - Browse by category
   - Can download as JSON files

2. **Lottie Animations** - https://lottie-animations.com/

   - Another source for free animations

3. **Airbnb's Lottie** - https://airbnb.io/lottie/
   - Official site with resources and examples

## How to Add an Animation

1. Download a `.json` file from LottieFiles
2. Place it in this directory (e.g., `loading.json`, `success.json`, `error.json`)
3. Import and use in your components:

```typescript
import LottieView from "lottie-react-native";

// In your component:
<LottieView
  source={require("../../assets/animations/loading.json")}
  autoPlay
  loop
  style={{ width: 200, height: 200 }}
/>;
```

## Popular Free Animation Types

- Loading spinners
- Success/checkmarks
- Error states
- Empty states
- Confirmation animations
- Onboarding illustrations
