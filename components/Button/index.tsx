import { SF_PRO_FONTS } from "@/components/Typography/constants";
import { textColors } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type ButtonBlock = boolean | "half";
type ButtonRounded = "full" | "half";
type IconPosition = "left" | "right";
type ButtonVariant = "primary" | "outlined" | "danger";

export type ButtonProps = {
  children: React.ReactNode;
  /**
   * Button visual style variant. Defaults to "primary".
   * - "primary" → gradient background (teal400 to teal800) with white text (default)
   * - "outlined" → transparent background with teal600 border and black text
   * - "danger" → red background (#EA1C1C) with white text for destructive actions
   */
  variant?: ButtonVariant;
  /**
   * By default the button is full-width.
   * - block={false} → width fits content
   * - block="half" → width is 50%
   */
  block?: ButtonBlock;
  /**
   * Border radius options:
   * - default → 4
   * - "full" → 23 (fully rounded for 46px height)
   * - "half" → 12
   */
  rounded?: ButtonRounded;
  /** Optional icon node to render alongside children */
  icon?: React.ReactNode;
  /** Where to render the icon relative to children. Default: "right" */
  iconPosition?: IconPosition;
  /** Greys out the button and blocks all press events */
  disabled?: boolean;
  /** Renders a spinner on the right and blocks all press events */
  loading?: boolean;
  /** Optional style override for the outer Pressable */
  style?: StyleProp<ViewStyle>;
} & Omit<PressableProps, "children" | "style" | "disabled">;

const Button = (props: ButtonProps) => {
  const {
    children,
    variant = "primary", // Default to primary variant
    block = true,
    rounded,
    icon,
    iconPosition = "right",
    disabled = false,
    loading = false,
    style,
    // Forward any other Pressable props like onPress, onPressIn, onPressOut, onLongPress, hitSlop, delayLongPress, etc.
    ...pressableProps
  } = props;

  const isInteractionBlocked = disabled || loading;

  const widthStyle: StyleProp<ViewStyle> =
    block === "half"
      ? { width: "50%" }
      : block === false
      ? { alignSelf: "flex-start" }
      : { width: "100%" };

  const borderRadius = rounded === "full" ? 23 : rounded === "half" ? 12 : 4;

  // Determine styling based on variant and state
  const getVariantStyles = () => {
    if (isInteractionBlocked) {
      return {
        backgroundColor: textColors.grey100,
        foregroundColor: textColors.grey600,
        useGradient: false as const,
      };
    }

    switch (variant) {
      case "primary":
        return {
          backgroundColor: "transparent", // Will use gradient
          foregroundColor: textColors.white,
          useGradient: true as const,
          gradientColors: [textColors.teal400, textColors.teal800] as const,
        };
      case "outlined":
        return {
          backgroundColor: "transparent",
          foregroundColor: textColors.black,
          useGradient: false as const,
          borderColor: textColors.teal600,
          borderWidth: 1,
        };
      case "danger":
        return {
          backgroundColor: textColors.red500,
          foregroundColor: textColors.white,
          useGradient: false as const,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const iconLeft = icon && iconPosition === "left";
  const iconRight = icon && iconPosition === "right";

  const textStyle = StyleSheet.create({
    text: {
      color: variantStyles.foregroundColor,
      fontFamily: SF_PRO_FONTS.Bold,
    },
  });

  // Helper function to wrap text content with proper styling
  const renderStyledChildren = (children: React.ReactNode): React.ReactNode => {
    if (typeof children === "string") {
      return <Text style={textStyle.text}>{children}</Text>;
    }

    // If children is already a Text element, clone it and apply text color and font
    if (React.isValidElement(children) && children.type === Text) {
      const textElement = children as React.ReactElement<any>;
      return React.cloneElement(textElement, {
        style: [textStyle.text, textElement.props.style],
      });
    }

    // For other React nodes, return as-is
    return children;
  };

  // Helper function to apply proper color to icon
  const renderStyledIcon = (iconElement: React.ReactNode): React.ReactNode => {
    if (React.isValidElement(iconElement)) {
      return React.cloneElement(iconElement as React.ReactElement<any>, {
        color: variantStyles.foregroundColor,
      });
    }
    return iconElement;
  };

  const ContentComponent = ({
    children: contentChildren,
  }: {
    children: React.ReactNode;
  }) => (
    <View style={ButtonStyles.contentRow}>
      {(() => {
        const hasLabel = React.Children.count(contentChildren) > 0;
        return (
          <>
            {iconLeft ? (
              <View style={hasLabel ? ButtonStyles.iconLeft : undefined}>
                {renderStyledIcon(icon)}
              </View>
            ) : null}

            {hasLabel ? (
              <View style={ButtonStyles.childrenWrap}>
                {renderStyledChildren(contentChildren)}
              </View>
            ) : null}

            {iconRight ? (
              <View style={hasLabel ? ButtonStyles.iconRight : undefined}>
                {renderStyledIcon(icon)}
              </View>
            ) : null}

            {loading ? (
              <View style={ButtonStyles.loaderWrap}>
                <ActivityIndicator
                  size="small"
                  color={variantStyles.foregroundColor}
                />
              </View>
            ) : null}
          </>
        );
      })()}
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInteractionBlocked }}
      disabled={isInteractionBlocked}
      style={({ pressed }) => [
        ButtonStyles.base,
        { borderRadius },
        !variantStyles.useGradient && {
          backgroundColor: variantStyles.backgroundColor,
        },
        variantStyles.useGradient && {
          paddingHorizontal: 0, // Remove padding when using gradient (gradient container handles it)
        },
        variantStyles.borderColor && {
          borderColor: variantStyles.borderColor,
          borderWidth: variantStyles.borderWidth,
        },
        widthStyle,
        pressed && !isInteractionBlocked && ButtonStyles.pressed,
        style,
      ]}
      {...pressableProps}
    >
      {variantStyles.useGradient && variantStyles.gradientColors ? (
        <LinearGradient
          colors={variantStyles.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            ButtonStyles.gradientContainer,
            { borderRadius, minHeight: 46 }, // Ensure minimum height matches button
          ]}
        >
          <ContentComponent>{children}</ContentComponent>
        </LinearGradient>
      ) : (
        <ContentComponent>{children}</ContentComponent>
      )}
    </Pressable>
  );
};

export type IconButtonSize = 1 | 2 | 3 | 4;

export type IconButtonProps = {
  /** 1, 2, 3 or 4 */
  size: IconButtonSize;
  /** true → fully rounded per spec, false → square with small radius */
  rounded: boolean;
  /** Disable interaction and apply disabled visuals */
  disabled?: boolean;
  /** Icon element to render (required, icon-only button) */
  icon: React.ReactNode;
  /** Optional style override for the outer container (merged last) */
  style?: StyleProp<ViewStyle>;
} & Omit<PressableProps, "disabled" | "style" | "children">;

export const IconButton: React.FC<IconButtonProps> = ({
  size = 3 as IconButtonSize,
  rounded = true,
  disabled = false,
  icon,
  style,
  ...pressableProps
}) => {
  // Map size + rounded to concrete style values
  const getLayout = (
    sizeValue: IconButtonSize,
    isRounded: boolean
  ): {
    width: number;
    height: number;
    borderRadius: number;
    paddingStyle: ViewStyle;
  } => {
    if (isRounded) {
      switch (sizeValue) {
        case 1:
          return {
            width: 40,
            height: 40,
            borderRadius: 20,
            paddingStyle: { padding: 11 },
          };
        case 2:
          return {
            width: 44,
            height: 44,
            borderRadius: 22,
            paddingStyle: { padding: 12 },
          };
        case 3:
          return {
            width: 48,
            height: 48,
            borderRadius: 24,
            paddingStyle: { padding: 12 },
          };
        case 4:
          return {
            width: 52,
            height: 52,
            borderRadius: 26,
            paddingStyle: { padding: 14 },
          };
      }
    } else {
      switch (sizeValue) {
        case 1:
          return {
            width: 40,
            height: 40,
            borderRadius: 10,
            paddingStyle: {
              paddingTop: 20,
              paddingRight: 122,
              paddingBottom: 20,
              paddingLeft: 122,
            },
          };
        case 2:
          return {
            width: 44,
            height: 44,
            borderRadius: 12,
            paddingStyle: {
              paddingTop: 20,
              paddingRight: 122,
              paddingBottom: 20,
              paddingLeft: 122,
            },
          };
        case 3:
          return {
            width: 48,
            height: 48,
            borderRadius: 12,
            paddingStyle: {
              paddingTop: 20,
              paddingRight: 122,
              paddingBottom: 20,
              paddingLeft: 122,
            },
          };
        case 4:
          return {
            width: 52,
            height: 52,
            borderRadius: 12,
            paddingStyle: {
              paddingTop: 20,
              paddingRight: 122,
              paddingBottom: 20,
              paddingLeft: 122,
            },
          };
      }
    }
  };

  const layout = getLayout(size, rounded) ?? {
    width: 48,
    height: 48,
    borderRadius: rounded ? 24 : 12,
    paddingStyle: rounded ? { padding: 12 } : {},
  };

  const { width, height, borderRadius, paddingStyle } = layout;

  return (
    <Button
      // Use outlined variant so we can precisely control sizing (no gradient container minHeight)
      variant="outlined"
      block={false}
      disabled={disabled}
      icon={icon}
      iconPosition="right"
      // Force exact dimensions and radius as per spec
      style={[
        IconButtonStyles.base,
        {
          width,
          height,
          minHeight: height,
          borderRadius,
        },
        style,
      ]}
      accessibilityRole="button"
      children={null}
      {...pressableProps}
    />
  );
};

const ButtonStyles = StyleSheet.create({
  base: {
    height: 46,
    minHeight: 46,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.9,
  },
  gradientContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  childrenWrap: {
    // Ensures the label stays centered regardless of icon/loader presence
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  loaderWrap: {
    marginLeft: 8,
  },
});

const IconButtonStyles = StyleSheet.create({
  base: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderColor: "white",
    boxShadow: `0px 1px 2px 1px ${textColors.grey300}`,
    borderWidth: 1,
  },
});

export default Button;
export { SwipeableButton } from "./SwipeButton";
