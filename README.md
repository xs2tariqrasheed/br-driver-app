# Typography Component

The `Typography` component provides a consistent, theme-aware way to render text throughout the app. It supports a wide range of variants for headings, body text, labels, and more, with built-in support for light/dark themes and a default font family.

## Purpose

- Standardize text styles across the app
- Support light and dark themes automatically
- Encourage consistent use of font sizes, weights, and colors

## Usage

```tsx
import { Typography } from './components/Typography';

<Typography variant="titleXLargeBlack">Extra Large Black Title</Typography>
<Typography variant="bodyMediumRegular">Medium Regular Body Text</Typography>
<Typography variant="labelSmallSemibold" lightColor="#333" darkColor="#fff">Small Semibold Label</Typography>
```

## Props

| Prop         | Type                   | Required | Description                                                         |
| ------------ | ---------------------- | -------- | ------------------------------------------------------------------- |
| `variant`    | TypographyVariant      | Yes      | The text style variant to use (see below for options)               |
| `children`   | React.ReactNode        | Yes      | The text content                                                    |
| `style`      | TextStyle              | No       | Additional styles to apply                                          |
| `lightColor` | string                 | No       | Override text color in light mode                                   |
| `darkColor`  | string                 | No       | Override text color in dark mode                                    |
| ...TextProps | React Native TextProps | No       | All standard React Native Text props, including accessibility props |

## Variants

The `variant` prop supports a wide range of options, such as:

- `titleXLargeBlack`, `titleXLargeBold`, `titleXLargeSemibold`, `titleXLargeMedium`, `titleXLargeRegular`
- `bodyMediumRegular`, `bodySmallBold`, `labelLargeSemibold`, etc.

Refer to `components/Typography.tsx` for the full list of supported variants.

## Best Practices

- Use the appropriate variant for each text role (e.g., headings, body, labels)
- Prefer the default theme-aware color unless a specific override is needed
- Use the `style` prop for minor adjustments, but avoid overriding core typography styles
- Pass accessibility props as needed for screen readers

---

For more details, see the implementation in `components/Typography.tsx`.
