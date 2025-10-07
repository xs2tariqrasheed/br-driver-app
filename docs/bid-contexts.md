# Bid Contexts Documentation

This document describes the global context providers for managing bid-related bottom sheets throughout the application.

## Overview

The bid contexts provide a centralized way to manage the visibility and state of various bid-related bottom sheets from any screen in the application. Each context follows the same pattern as other global contexts like `SpecialRequirementsContext` and `PackageInfoContext`.

## Available Contexts

### 1. BidBottomSheetContext

Manages the bid submission modal where drivers can customize their bid amount, ETA, and boost options.

**Location:** `context/BidBottomSheetContext.tsx`

**Hook:** `useBidBottomSheet()`

**State:**

- `isBidBottomSheetVisible: boolean` - Whether the bid bottom sheet is visible
- `bidData: BidData | null` - The bid data to display
- `isSubmitting: boolean` - Whether a bid submission is in progress

**Actions:**

- `showBidBottomSheet(data: BidData)` - Show the bid bottom sheet with data
- `hideBidBottomSheet()` - Hide the bid bottom sheet and reset state
- `setSubmitting(loading: boolean)` - Set the submitting state

**Usage:**

```tsx
import { useBidBottomSheet } from '@/context/BidBottomSheetContext';

function MyComponent() {
  const { showBidBottomSheet, hideBidBottomSheet, isBidBottomSheetVisible } = useBidBottomSheet();

  const handleShowBid = () => {
    showBidBottomSheet(bidData);
  };

  return (
    // Your component JSX
  );
}
```

### 2. BidWaitingTimerContext

Manages the progress timer bottom sheet that shows while waiting for customer response after bid submission.

**Location:** `context/BidWaitingTimerContext.tsx`

**Hook:** `useBidWaitingTimer()`

**State:**

- `isBidWaitingTimerVisible: boolean` - Whether the waiting timer is visible
- `progressDuration: number` - Duration of the progress timer in milliseconds

**Actions:**

- `showBidWaitingTimer(duration?: number)` - Show the waiting timer with optional custom duration
- `hideBidWaitingTimer()` - Hide the waiting timer
- `onCompleteProgress()` - Called when the progress timer completes
- `onCancel()` - Called when the cancel button is pressed

**Usage:**

```tsx
import { useBidWaitingTimer } from '@/context/BidWaitingTimerContext';

function MyComponent() {
  const { showBidWaitingTimer, hideBidWaitingTimer } = useBidWaitingTimer();

  const handleStartWaiting = () => {
    showBidWaitingTimer(30000); // 30 seconds
  };

  return (
    // Your component JSX
  );
}
```

### 3. BidAcceptedContext

Manages the bid accepted status sheet that shows when a customer accepts the driver's bid.

**Location:** `context/BidAcceptedContext.tsx`

**Hook:** `useBidAccepted()`

**State:**

- `isBidAcceptedVisible: boolean` - Whether the accepted status sheet is visible

**Actions:**

- `showBidAccepted()` - Show the bid accepted status sheet
- `hideBidAccepted()` - Hide the bid accepted status sheet
- `onTimerComplete()` - Called when the countdown timer completes
- `onClose()` - Called when the close button is pressed

**Usage:**

```tsx
import { useBidAccepted } from '@/context/BidAcceptedContext';

function MyComponent() {
  const { showBidAccepted, hideBidAccepted } = useBidAccepted();

  const handleBidAccepted = () => {
    showBidAccepted();
  };

  return (
    // Your component JSX
  );
}
```

### 4. BidExpiredContext

Manages the bid expired status sheet that shows when a bid expires.

**Location:** `context/BidExpiredContext.tsx`

**Hook:** `useBidExpired()`

**State:**

- `isBidExpiredVisible: boolean` - Whether the expired status sheet is visible

**Actions:**

- `showBidExpired()` - Show the bid expired status sheet
- `hideBidExpired()` - Hide the bid expired status sheet
- `onTimerComplete()` - Called when the countdown timer completes
- `onClose()` - Called when the close button is pressed

**Usage:**

```tsx
import { useBidExpired } from '@/context/BidExpiredContext';

function MyComponent() {
  const { showBidExpired, hideBidExpired } = useBidExpired();

  const handleBidExpired = () => {
    showBidExpired();
  };

  return (
    // Your component JSX
  );
}
```

### 5. BidUnsuccessfulContext

Manages the bid unsuccessful status sheet that shows when a customer rejects the driver's bid.

**Location:** `context/BidUnsuccessfulContext.tsx`

**Hook:** `useBidUnsuccessful()`

**State:**

- `isBidUnsuccessfulVisible: boolean` - Whether the unsuccessful status sheet is visible

**Actions:**

- `showBidUnsuccessful()` - Show the bid unsuccessful status sheet
- `hideBidUnsuccessful()` - Hide the bid unsuccessful status sheet
- `onTimerComplete()` - Called when the countdown timer completes
- `onClose()` - Called when the close button is pressed

**Usage:**

```tsx
import { useBidUnsuccessful } from '@/context/BidUnsuccessfulContext';

function MyComponent() {
  const { showBidUnsuccessful, hideBidUnsuccessful } = useBidUnsuccessful();

  const handleBidUnsuccessful = () => {
    showBidUnsuccessful();
  };

  return (
    // Your component JSX
  );
}
```

## Integration

All bid contexts are automatically provided at the app level in `app/_layout.tsx`. The contexts are nested in the following order:

```tsx
<BidBottomSheetProvider>
  <BidWaitingTimerProvider>
    <BidAcceptedProvider>
      <BidExpiredProvider>
        <BidUnsuccessfulProvider>
          {/* Your app content */}
        </BidUnsuccessfulProvider>
      </BidExpiredProvider>
    </BidAcceptedProvider>
  </BidWaitingTimerProvider>
</BidBottomSheetProvider>
```

## Global Components

Each context automatically renders its corresponding bottom sheet component globally, so you don't need to manually include them in your screens. The components are:

- `BidBottomSheet` - Rendered by `BidBottomSheetProvider`
- `BidWaitingTimer` - Rendered by `BidWaitingTimerProvider`
- `BidStatusSheet` (with ACCEPTED status) - Rendered by `BidAcceptedProvider`
- `BidStatusSheet` (with EXPIRED status) - Rendered by `BidExpiredProvider`
- `BidStatusSheet` (with UNSUCCESSFUL status) - Rendered by `BidUnsuccessfulProvider`

## Best Practices

1. **Always use the hooks** - Don't try to access the context directly
2. **Handle callbacks appropriately** - Override the default callback behavior when needed
3. **Reset state when hiding** - The contexts automatically reset their state when hidden
4. **Use appropriate timing** - The waiting timer and status sheets have built-in countdown timers
5. **Test all states** - Make sure to test all possible bid states and transitions

## Example Workflow

Here's a typical bid workflow using the contexts:

```tsx
import {
  useBidBottomSheet,
  useBidWaitingTimer,
  useBidAccepted,
  useBidExpired,
  useBidUnsuccessful
} from '@/context';

function BidWorkflow() {
  const { showBidBottomSheet } = useBidBottomSheet();
  const { showBidWaitingTimer } = useBidWaitingTimer();
  const { showBidAccepted } = useBidAccepted();
  const { showBidExpired } = useBidExpired();
  const { showBidUnsuccessful } = useBidUnsuccessful();

  const handleStartBid = () => {
    // Show bid customization sheet
    showBidBottomSheet(bidData);
  };

  const handleBidSubmitted = () => {
    // After bid submission, show waiting timer
    showBidWaitingTimer();
  };

  const handleBidResponse = (status: 'accepted' | 'expired' | 'unsuccessful') => {
    switch (status) {
      case 'accepted':
        showBidAccepted();
        break;
      case 'expired':
        showBidExpired();
        break;
      case 'unsuccessful':
        showBidUnsuccessful();
        break;
    }
  };

  return (
    // Your component JSX
  );
}
```
