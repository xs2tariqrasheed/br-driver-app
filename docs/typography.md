# Typography Component Documentation

## Overview

The `Typography` component provides standardized text styles for your application, ensuring consistency and theme-awareness across your UI. It is built on top of React Native's `Text` component and supports all standard `TextProps` and accessibility props.

## Features

- **Theme-aware color:** Uses default or custom colors, supporting both light and dark themes.
- **Standardized font family:** Uses the system font (San Francisco on iOS, Roboto on Android, etc.).
- **Flexible text styles:** Supports various types, sizes, and weights for text.
- **Fallback logic:** If a type/size combination is missing, a fallback font size is used.
- **Full support for React Native Text props and accessibility.**

## Usage

```
import { Typography } from "@/components/Typography";

<Typography type="title" size="XLarge" weight="Bold">Title</Typography>
<Typography type="body" size="Medium" weight="Regular" lightColor="#333">Body</Typography>
```

## Props

| Prop         | Type               | Required | Description                                                              |
| ------------ | ------------------ | -------- | ------------------------------------------------------------------------ |
| `type`       | `TypographyType`   | Yes      | The text type (e.g., 'title', 'body'). No default; must be provided.     |
| `size`       | `TypographySize`   | Yes      | The text size (e.g., 'XLarge', 'Medium'). No default; must be provided.  |
| `weight`     | `TypographyWeight` | Yes      | The font weight (e.g., 'Bold', 'Regular'). No default; must be provided. |
| `children`   | `React.ReactNode`  | Yes      | The text content to display.                                             |
| `style`      | `TextStyle`        | No       | Additional styles to apply to the text.                                  |
| `lightColor` | `string`           | No       | Custom color for light mode.                                             |
| ...TextProps | `TextProps`        | No       | Any other React Native Text props.                                       |

## Default Values

- There are **no default values** for `type`, `size`, or `weight`. You must provide all three props.
- If a type/size combination is missing, the fallback font size from `constants/typography.ts` is used.

## Example

```
<Typography type="title" size="Large" weight="Bold">
  Welcome to the App
</Typography>

<Typography type="body" size="Small" weight="Regular" style={{ color: 'gray' }}>
  This is a description.
</Typography>
```

## Notes

- The component is theme-aware and will use the default text color unless a custom `lightColor` is provided.
- The font family is set to the system font for platform consistency.
- All standard accessibility and text props are supported.
