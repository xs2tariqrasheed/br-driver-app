# Package Info Context

The `PackageInfoContext` provides a global state management solution for displaying package information in a bottom sheet modal throughout the app.

## Usage

### 1. Integration

The provider and sheet are already integrated into your app layout at `/app/_layout.tsx`.

### 2. Use the hook to open the modal

```tsx
import { usePackageInfo } from "@/context/PackageInfoContext";

function MyComponent() {
  const { openPackageInfo } = usePackageInfo();

  const handleShowPackageInfo = () => {
    openPackageInfo({
      numberOfPackages: 1,
      weight: "5.6 Kg",
      phoneNumber: "0123456789",
      recipientName: "John Smith",
      instructions:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    });
  };

  return <Button onPress={handleShowPackageInfo}>View Package Info</Button>;
}
```

## API Reference

### `usePackageInfo()`

Returns an object with the following properties:

- **`isOpen: boolean`** - Whether the modal is currently open
- **`data: PackageInfo | null`** - The current package information data
- **`openPackageInfo: (data: PackageInfo) => void`** - Function to open the modal with data
- **`closePackageInfo: () => void`** - Function to close the modal

### `PackageInfo` Type

```typescript
type PackageInfo = {
  numberOfPackages?: number;
  weight?: string;
  phoneNumber?: string;
  recipientName?: string;
  instructions?: string;
};
```

## Features

- **Global State Management** - Access from anywhere in your app
- **Type-Safe** - Full TypeScript support
- **Automatic Bottom Sheet** - Beautiful modal presentation
- **Reusable Components** - Uses ValueBox from Special Requirements
- **Flexible Data** - All fields are optional

## Component Display

The modal displays package information in the following format:

1. **Number of Packages** - Numeric value in a teal/black value box (reuses ValueBox component)
2. **Weight** - Text display (e.g., "5.6 Kg")
3. **Phone Number** - Text display
4. **Recipient Name** - Text display
5. **Instructions** - Multi-line text in a light gray box

## Design Specifications

- **Typography**: SF PRO Display
  - Labels: 14px Semibold (black)
  - Values: 14px Regular (black)
  - Instructions: 14px Regular (black)
- **Value Box**: 32x32, reused from Special Requirements
- **Instructions Box**: Light gray background (grey0), 8px border radius, 12px padding
- **Button**: Teal gradient, "half" rounded (12px)

## Example

```tsx
import { usePackageInfo } from "@/context/PackageInfoContext";

function RideDetailsScreen({ rideData }) {
  const { openPackageInfo } = usePackageInfo();

  const showPackageDetails = () => {
    openPackageInfo({
      numberOfPackages: rideData.packageCount,
      weight: `${rideData.weight} Kg`,
      phoneNumber: rideData.recipientPhone,
      recipientName: rideData.recipientName,
      instructions: rideData.deliveryInstructions || "No special instructions",
    });
  };

  return (
    <Pressable onPress={showPackageDetails}>
      <Typography>View Package Information</Typography>
    </Pressable>
  );
}
```

## Reusable Components

### `InfoRow` Component

A reusable component for label-value pairs:

```tsx
<InfoRow label="Weight" value="5.6 Kg" />

// With custom value component
<InfoRow label="Number of Packages" value={<ValueBox value={1} />} />
```

**Props:**

- `label: string` - The label text (left side)
- `value: React.ReactNode` - The value to display (right side)

## Relationship with Special Requirements

This component follows the same pattern as `SpecialRequirementsSheet`:

- Uses the same context pattern for global state
- Reuses the `ValueBox` component for numeric displays
- Similar bottom sheet configuration
- Consistent styling and typography

Both components can be opened from anywhere in the app and provide a consistent user experience.
