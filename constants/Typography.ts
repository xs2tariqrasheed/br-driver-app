// SF Pro Display font families (registered in app/_layout.tsx)
export const SF_PRO_FONTS = {
  Regular: "SF-Pro-Display-Regular",
  Medium: "SF-Pro-Display-Medium",
  Semibold: "SF-Pro-Display-Semibold",
  Bold: "SF-Pro-Display-Bold",
  Black: "SF-Pro-Display-Black",
} as const;

export const DEFAULT_TYPOGRAPHY_TYPE = "bodyRegular";
export const DEFAULT_TYPOGRAPHY_WEIGHT = "Medium";

const STYLE_VARIANTS = [
  { name: "black", fontFamily: SF_PRO_FONTS.Black },
  { name: "bold", fontFamily: SF_PRO_FONTS.Bold },
  { name: "semibold", fontFamily: SF_PRO_FONTS.Semibold },
  { name: "medium", fontFamily: SF_PRO_FONTS.Medium },
  { name: "regular", fontFamily: SF_PRO_FONTS.Regular },
];

const SIZE_VARIANTS = [
  { name: "titleExtraLarge", size: 24 },
  { name: "titleLarge", size: 22 },
  { name: "titleMedium", size: 21 },
  { name: "headingLarge", size: 19 },
  { name: "headingSmall", size: 18 },
  { name: "subHeadingLarge", size: 17 },
  { name: "bodyLarge", size: 16 },
  { name: "bodyMedium", size: 14 },
  { name: "bodySmall", size: 12 },
  { name: "labelLarge", size: 12 },
  { name: "labelMedium", size: 11 },
  { name: "labelSmall", size: 10 },
];

export const TYPOGRAPHY_VARIANTS = Object.fromEntries(
  SIZE_VARIANTS.flatMap((size) =>
    STYLE_VARIANTS.map((style) => [
      `${size.name}${style.name.charAt(0).toUpperCase() + style.name.slice(1)}`,
      {
        fontSize: size.size,
        fontFamily: style.fontFamily,
        lineHeight: 100,
        letterSpacing: 0,
      },
    ])
  )
);

export type TYPOGRAPHY_TYPE =
  | "titleExtraLarge"
  | "titleLarge"
  | "titleMedium"
  | "headingLarge"
  | "headingSmall"
  | "subHeadingLarge"
  | "bodyLarge"
  | "bodyMedium"
  | "bodySmall"
  | "labelLarge"
  | "labelMedium"
  | "labelSmall";

export type TYPOGRAPHY_WEIGHT =
  | "black"
  | "bold"
  | "semibold"
  | "medium"
  | "regular";

export type TYPOGRAPHY_COLOR_VARIANT =
  | "success"
  | "danger"
  | "disabled"
  | "warning"
  | "secondary"
  | "underline"
  | "delete"
  | "strong"
  | "italic"
  | "mark";
