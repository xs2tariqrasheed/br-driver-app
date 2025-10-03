# Special Requirements Context

The `SpecialRequirementsContext` provides a global state management solution for displaying special requirements information in a bottom sheet modal throughout the app.

## Usage

### 1. Wrap your app with the provider

```tsx
import { SpecialRequirementsProvider } from "@/context/SpecialRequirementsContext";

function App() {
  return (
    <SpecialRequirementsProvider>
      {/* Your app content */}
    </SpecialRequirementsProvider>
  );
}
```

### 2. Add the sheet component to your layout

```tsx
import SpecialRequirementsSheet from "@/components/SpecialRequirementsSheet";

function Layout() {
  return (
    <>
      {/* Your layout content */}
      <SpecialRequirementsSheet />
    </>
  );
}
```

### 3. Use the hook to open the modal

```tsx
import { useSpecialRequirements } from "@/context/SpecialRequirementsContext";

function MyComponent() {
  const { openSpecialRequirements } = useSpecialRequirements();

  const handleShowRequirements = () => {
    openSpecialRequirements({
      totalPassengers: 2,
      bags: 4,
      pets: true,
      wheelchair: false,
      childSeat: {
        infant: 1,
        toddler: 1,
        booster: 0,
      },
      armedDriver: true,
      driverLanguage: "English",
    });
  };

  return <Button onPress={handleShowRequirements}>View Requirements</Button>;
}
```

## API Reference

### `useSpecialRequirements()`

Returns an object with the following properties:

- **`isOpen: boolean`** - Whether the modal is currently open
- **`data: SpecialRequirements | null`** - The current special requirements data
- **`openSpecialRequirements: (data: SpecialRequirements) => void`** - Function to open the modal with data
- **`closeSpecialRequirements: () => void`** - Function to close the modal

### `SpecialRequirements` Type

```typescript
type SpecialRequirements = {
  totalPassengers?: number;
  bags?: number;
  pets?: boolean;
  wheelchair?: boolean;
  childSeat?: {
    infant?: number;
    toddler?: number;
    booster?: number;
  };
  armedDriver?: boolean;
  driverLanguage?: string;
};
```

## Features

- **Global State Management** - Access from anywhere in your app
- **Type-Safe** - Full TypeScript support
- **Automatic Bottom Sheet** - Beautiful modal presentation
- **Custom Icons** - Visual indicators for each requirement
- **Flexible Data** - All fields are optional

## Component Display

The modal displays requirements in four sections:

1. **Rider Details** - Total passengers and bags with numeric indicators
2. **Accessibility** - Pets and wheelchair with checkboxes
3. **Child Seat** - Infant, Toddler, and Booster seat requirements
4. **Driver Preferences** - Armed driver and language requirements

All values with greater than zero are highlighted with teal colors, while zero values display in black.
