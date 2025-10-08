# RideOfferContext Usage Guide

## Overview

The `RideOfferContext` provides a global way to show ride offer modals throughout your application. It can be used with or without callbacks, making it flexible for different scenarios.

## Setup

The provider is already integrated in the root layout (`app/_layout.tsx`), so you can use it anywhere in your app.

## Basic Usage

### 1. Import the Hook

```tsx
import { useRideOffer } from "@/context/RideOfferContext";
```

### 2. Use the Hook in Your Component

```tsx
export default function MyScreen() {
  const { showRideOfferModal } = useRideOffer();

  // Your component logic
}
```

## Examples

### Example 1: Show Modal with Custom Callbacks (From a Screen)

When you want to handle the actions yourself (e.g., from ride details screen):

```tsx
import { useRideOffer } from "@/context/RideOfferContext";

export default function RideDetailsScreen() {
  const { showRideOfferModal } = useRideOffer();

  const handleShowOffer = () => {
    const offer = {
      type: "sequential" as const,
      tripOffer: {
        tripId: "trip-123",
        pickupLocation: { lat: 37.7749, lng: -122.4194 },
        dropoffLocation: { lat: 37.7849, lng: -122.4094 },
        fare: 55,
      },
      timestamp: new Date().toISOString(),
      timeout: 30000,
    };

    showRideOfferModal(offer, {
      onAccept: async () => {
        console.log("Custom accept handler");
        // Your custom logic here
        await myAcceptAPI();
      },
      onSkipPrice: async () => {
        console.log("Custom skip price handler");
        // Your custom logic here
        await mySkipAPI();
      },
      onHide: async () => {
        console.log("Custom hide handler");
        // Your custom logic here
        await myHideAPI();
      },
    });
  };

  return (
    <View>
      <Button onPress={handleShowOffer} title="Show Offer" />
    </View>
  );
}
```

### Example 2: Show Modal Without Callbacks (From Socket Events)

When you want to use the global handlers (e.g., from socket events):

```tsx
import { useRideOffer } from "@/context/RideOfferContext";

export default function GlobalSocketListener() {
  const { showRideOfferModal } = useRideOffer();

  useEffect(() => {
    // Socket event listener
    socket.on("new-ride-offer", (data) => {
      const offer = {
        type: data.type,
        tripOffer: data.tripOffer,
        timestamp: data.timestamp,
        timeout: data.timeout,
      };

      // Show modal without callbacks - will use global handlers
      showRideOfferModal(offer);
    });

    return () => {
      socket.off("new-ride-offer");
    };
  }, [showRideOfferModal]);

  return null;
}
```

### Example 3: Programmatically Hide Modal

```tsx
import { useRideOffer } from "@/context/RideOfferContext";

export default function MyScreen() {
  const { hideRideOfferModal } = useRideOffer();

  const handleCancel = () => {
    // Close the modal programmatically
    hideRideOfferModal();
  };

  return (
    <View>
      <Button onPress={handleCancel} title="Cancel" />
    </View>
  );
}
```

### Example 4: Access Current Offer State

```tsx
import { useRideOffer } from "@/context/RideOfferContext";

export default function MyScreen() {
  const { currentOffer, isRideOfferModalVisible } = useRideOffer();

  return (
    <View>
      <Text>Modal Visible: {isRideOfferModalVisible ? "Yes" : "No"}</Text>
      {currentOffer && (
        <Text>Current Trip ID: {currentOffer.tripOffer.tripId}</Text>
      )}
    </View>
  );
}
```

## API Reference

### Context Values

| Property                  | Type                                                     | Description                                   |
| ------------------------- | -------------------------------------------------------- | --------------------------------------------- |
| `isRideOfferModalVisible` | `boolean`                                                | Whether the modal is currently visible        |
| `currentOffer`            | `RideOffer \| null`                                      | The current ride offer being displayed        |
| `modalCallbacks`          | `ModalCallbacks \| null`                                 | The callbacks provided when showing the modal |
| `showRideOfferModal`      | `(offer: RideOffer, callbacks?: ModalCallbacks) => void` | Show the ride offer modal                     |
| `hideRideOfferModal`      | `() => void`                                             | Hide the ride offer modal                     |
| `acceptRideOffer`         | `() => Promise<void>`                                    | Accept the current ride offer                 |
| `skipRideOfferPrice`      | `() => Promise<void>`                                    | Skip the price for the current ride offer     |
| `hideRideOffer`           | `() => Promise<void>`                                    | Hide the current ride offer                   |

### Types

#### RideOffer

```typescript
interface RideOffer {
  type: "sequential" | "broadcast";
  tripOffer: {
    tripId: string;
    pickupLocation: { lat: number; lng: number };
    dropoffLocation: { lat: number; lng: number };
    fare: number;
  };
  timestamp: string;
  timeout: number;
}
```

#### ModalCallbacks

```typescript
interface ModalCallbacks {
  onAccept?: () => void | Promise<void>;
  onSkipPrice?: () => void | Promise<void>;
  onHide?: () => void | Promise<void>;
}
```

## Notes

- The modal is automatically rendered by the `RideOfferProvider`, so you don't need to add it to your components
- When callbacks are provided, they take precedence over the global handlers
- Global handlers have TODO comments for API integration - implement these when the backend is ready
- The modal automatically closes after successful accept/skip/hide actions
- On error, the modal stays open to allow the user to retry or cancel

## TODO

When the backend API is ready, update the global handlers in `context/RideOfferContext.tsx`:

1. `handleGlobalAcceptOffer` - Implement accept API call
2. `handleGlobalSkipPrice` - Implement skip price API call
3. `handleGlobalHideOffer` - Implement hide offer API call
4. Add Toast notifications for success/error feedback
5. Add proper error handling and retry logic
