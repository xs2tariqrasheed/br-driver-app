# Typography Component Documentation

## Overview

The `Typography` component provides standardized text styles for your application, ensuring consistency and theme-awareness across your UI. It is built on top of React Native's `Text` component and supports all standard `TextProps` and accessibility props.

## Features

- **Theme-aware color:** Uses default or custom colors, supporting both light and dark themes.
- **Standardized font family:** Uses SF Pro Display font family for consistent appearance.
- **Flexible text styles:** Supports various types and weights for text.
- **Fallback logic:** If a type/weight combination is missing, a fallback font size is used.
- **Full support for React Native Text props and accessibility.**

## Usage

```tsx
import { Typography } from "@/components/Typography";

<Typography type="bodyLarge" weight="Regular">Body Text</Typography>
<Typography type="titleLarge" weight="Bold" style={{ color: '#333' }}>Title</Typography>
```

## Props

| Prop         | Type               | Required | Description                                                             |
| ------------ | ------------------ | -------- | ----------------------------------------------------------------------- |
| `type`       | `TypographyType`   | Yes      | The text type (see valid values below). No default; must be provided.   |
| `weight`     | `TypographyWeight` | Yes      | The font weight (see valid values below). No default; must be provided. |
| `children`   | `React.ReactNode`  | Yes      | The text content to display.                                            |
| `style`      | `TextStyle`        | No       | Additional styles to apply to the text.                                 |
| ...TextProps | `TextProps`        | No       | Any other React Native Text props.                                      |

## Valid Values

### TypographyType

```
titleExtraLarge | titleLarge | titleMedium | headingLarge | headingSmall | subHeadingLarge | bodyLarge | bodyMedium | bodySmall | labelLarge | labelMedium | labelSmall
```

### TypographyWeight

```
Black | Bold | Semibold | Medium | Regular
```

## Default Values

- The default `type` is `bodyLarge`.
- The default `weight` is `Regular`.
- If a type/weight combination is missing, the fallback font size from `constants/typography.ts` is used.

## Example

```tsx
<Typography type="titleLarge" weight="Bold">
  Welcome to the App
</Typography>

<Typography type="bodyMedium" weight="Regular" style={{ color: 'gray' }}>
  This is a description.
</Typography>
```

## Notes

- The component is theme-aware and will use the default text color unless a custom color is provided via the `style` prop.
- The font family is set to SF Pro Display for platform consistency.
- All standard accessibility and text props are supported.
- You can customize the appearance further by passing additional styles via the `style` prop.
