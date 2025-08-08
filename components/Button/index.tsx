import { SF_PRO_FONTS } from "@/components/typography/constants";
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

  // Helper function to wrap text content with proper styling
  const renderStyledChildren = (children: React.ReactNode): React.ReactNode => {
    if (typeof children === "string") {
      return (
        <Text
          style={{
            color: variantStyles.foregroundColor,
            fontFamily: SF_PRO_FONTS.Bold,
          }}
        >
          {children}
        </Text>
      );
    }

    // If children is already a Text element, clone it and apply text color and font
    if (React.isValidElement(children) && children.type === Text) {
      const textElement = children as React.ReactElement<any>;
      return React.cloneElement(textElement, {
        style: [
          {
            color: variantStyles.foregroundColor,
            fontFamily: SF_PRO_FONTS.Bold,
          },
          textElement.props.style,
        ],
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
    <View style={styles.contentRow}>
      {iconLeft ? (
        <View style={styles.iconLeft}>{renderStyledIcon(icon)}</View>
      ) : null}

      <View style={styles.childrenWrap}>
        {renderStyledChildren(contentChildren)}
      </View>

      {iconRight ? (
        <View style={styles.iconRight}>{renderStyledIcon(icon)}</View>
      ) : null}

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator
            size="small"
            color={variantStyles.foregroundColor}
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInteractionBlocked }}
      disabled={isInteractionBlocked}
      style={({ pressed }) => [
        styles.base,
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
        pressed && !isInteractionBlocked && styles.pressed,
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
            styles.gradientContainer,
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

const styles = StyleSheet.create({
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

export default Button;
