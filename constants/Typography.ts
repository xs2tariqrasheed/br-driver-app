// Typography constants for font family, weights, sizes, and allowed values
import { TextStyle } from "react-native";

export const SYSTEM_FONT = "System";

export const FONT_WEIGHTS = {
  Bold: "bold" as TextStyle["fontWeight"],
  Semibold: "600" as TextStyle["fontWeight"],
  Medium: "500" as TextStyle["fontWeight"],
  Regular: "400" as TextStyle["fontWeight"],
} as const;

export const FONT_SIZES = {
  title: {
    XLarge: 40,
    Large: 32,
    Medium: 28,
    Small: 24, // fallback if needed
  },
  heading: {
    XLarge: 28, // fallback if needed
    Large: 24,
    Medium: 20,
    Small: 18,
  },
  subHeading: {
    XLarge: 20, // fallback if needed
    Large: 18,
    Medium: 16,
    Small: 14,
  },
  body: {
    XLarge: 18, // fallback if needed
    Large: 17,
    Medium: 16,
    Small: 14,
  },
  label: {
    XLarge: 15, // fallback if needed
    Large: 13,
    Medium: 12,
    Small: 11,
  },
};

export const TYPOGRAPHY_TYPES = [
  "title",
  "heading",
  "subHeading",
  "body",
  "label",
] as const;

export const TYPOGRAPHY_SIZES = ["XLarge", "Large", "Medium", "Small"] as const;

export const TYPOGRAPHY_WEIGHTS = [
  "Bold",
  "Semibold",
  "Medium",
  "Regular",
] as const;

export const FALLBACK_FONT_SIZE = 16;
export const THEME_COLOR_KEY = "text";
