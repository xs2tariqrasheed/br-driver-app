# Typography Component

The `Typography` component provides a consistent, theme-aware way to render text throughout the app. It supports a wide range of text types (headings, body, labels, etc.), sizes, and weights, with built-in support for light/dark themes and a default font family.

## Purpose

- Standardize text styles across the app
- Support light and dark themes automatically
- Encourage consistent use of font sizes, weights, and colors

## Usage

```tsx
import { Typography } from './components/Typography';

<Typography type="title" size="XLarge" weight="Bold">Extra Large Bold Title</Typography>
<Typography type="body" size="Medium" weight="Regular">Medium Regular Body Text</Typography>
<Typography type="label" size="Small" weight="Semibold" lightColor="#333" darkColor="#fff">Small Semibold Label</Typography>
```

## Props

| Prop         | Type                   | Required | Description                                                         |
| ------------ | ---------------------- | -------- | ------------------------------------------------------------------- |
| `type`       | TypographyType         | Yes      | The text type (e.g., 'title', 'body', 'label')                      |
| `size`       | TypographySize         | Yes      | The text size (e.g., 'XLarge', 'Large', 'Medium', 'Small')          |
| `weight`     | TypographyWeight       | Yes      | The text weight (e.g., 'Bold', 'Semibold', 'Medium', 'Regular')     |
| `children`   | React.ReactNode        | Yes      | The text content                                                    |
| `style`      | TextStyle              | No       | Additional styles to apply                                          |
| `lightColor` | string                 | No       | Override text color in light mode                                   |
| `darkColor`  | string                 | No       | Override text color in dark mode                                    |
| ...TextProps | React Native TextProps | No       | All standard React Native Text props, including accessibility props |

## Types, Sizes, and Weights

- **type:** 'title', 'heading', 'subHeading', 'body', 'label'
- **size:** 'XLarge', 'Large', 'Medium', 'Small'
- **weight:** 'Bold', 'Semibold', 'Medium', 'Regular'

Refer to `constants/typography.ts` for the full list and font size mapping.

## Fallbacks

- If a type/size combination is missing, a default font size is used.
- All of `type`, `size`, and `weight` are required props (TypeScript will enforce this).

## Best Practices

- Use the appropriate type/size/weight for each text role (e.g., headings, body, labels)
- Prefer the default theme-aware color unless a specific override is needed
- Use the `style` prop for minor adjustments, but avoid overriding core typography styles
- Pass accessibility props as needed for screen readers

---

For more details, see the implementation in `components/Typography.tsx` and `constants/typography.ts`.
