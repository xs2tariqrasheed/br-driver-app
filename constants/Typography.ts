// Typography constants for font family, weights, sizes, and allowed values
import { TextStyle } from "react-native";
import { TYPOGRAPHY_SIZES } from "./global";
export {
  TYPOGRAPHY_SIZES,
  TYPOGRAPHY_TYPES,
  TYPOGRAPHY_WEIGHTS,
} from "./global";

export const SYSTEM_FONT = "System";

export const FONT_WEIGHTS = {
  Bold: "bold" as TextStyle["fontWeight"],
  Semibold: "600" as TextStyle["fontWeight"],
  Medium: "500" as TextStyle["fontWeight"],
  Regular: "400" as TextStyle["fontWeight"],
} as const;

// Helper function to create size mappings efficiently
const createSizeMapping = (sizes: readonly [number, number, number, number]) =>
  Object.fromEntries(
    TYPOGRAPHY_SIZES.map((size, index) => [size, sizes[index]])
  ) as Record<(typeof TYPOGRAPHY_SIZES)[number], number>;

export const FONT_SIZES = {
  title: createSizeMapping([40, 32, 28, 24]),
  heading: createSizeMapping([28, 24, 20, 18]),
  subHeading: createSizeMapping([20, 18, 16, 14]),
  body: createSizeMapping([18, 17, 16, 14]),
  label: createSizeMapping([15, 13, 12, 11]),
} as const;

export const DEFAULT_TYPOGRAPHY_TYPE = "body";
export const DEFAULT_TYPOGRAPHY_SIZE = "Medium";
export const DEFAULT_TYPOGRAPHY_WEIGHT = "Regular";

export const FALLBACK_FONT_SIZE = 16;
export const THEME_COLOR_KEY = "text";
