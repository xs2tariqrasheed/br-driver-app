/**
 * @fileoverview Accordion Component - A collapsible panel component with animation support
 *
 * This file contains a fully-featured accordion component that supports:
 * - Multiple expandable panels
 * - Controlled and uncontrolled modes
 * - Smooth animations with Material Design ripple effects
 * - TypeScript support with comprehensive type definitions
 * - Array-based API for managing multiple active keys
 *
 */

import Typography from "@/components/Typography";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Animated, Image, Pressable, StyleSheet, View } from "react-native";
import {
  ANDROID_RIPPLE_COLOR,
  BACKGROUND_COLOR,
  BORDER_COLOR,
  CHEVRON_COLOR,
  CHEVRON_FONT_SIZE,
  CHEVRON_LINE_HEIGHT,
  CHEVRON_SIZE,
  CONTAINER_MARGIN_BOTTOM,
  CONTAINER_RADIUS,
  CONTENT_GAP,
  CONTENT_PADDING_BOTTOM,
  CONTENT_PADDING_HORIZONTAL,
  HEADER_GAP,
  HEADER_HEIGHT,
  HEADER_PADDING_HORIZONTAL,
  ICON_MARGIN_RIGHT,
  ROTATE_DEG_ACTIVE,
  ROTATE_DEG_INACTIVE,
  ROTATION_DURATION_MS,
  SEPARATOR_HEIGHT,
  SEPARATOR_MARGIN_VERTICAL,
} from "./constants";

/**
 * Represents a single accordion panel item
 * @interface AccordionItem
 */
export type AccordionItem = {
  /** Unique identifier for the accordion panel */
  key: string;
  /** The header content displayed for this panel */
  label: ReactNode;
  /** The collapsible content that shows when panel is expanded */
  children: ReactNode;
  /** Optional icon displayed next to the label in the header */
  icon?: ReactNode;
};

/**
 * Props for the Accordion component
 * @interface AccordionProps
 * @example
 * ```tsx
 * // Multiple panels control
 * <Accordion
 *   items={items}
 *   activeKeys={["panel1", "panel2"]}
 *   onChange={(keys) => console.log('Active panels:', keys)}
 * />
 * ```
 */
export type AccordionProps = {
  /** Array of accordion panel items to render */
  items: AccordionItem[];
  /**
   * Controlled active panel keys. Array of strings.
   * When provided, component operates in controlled mode.
   */
  activeKeys?: string[];
  /**
   * Default active panel keys for uncontrolled mode.
   * Only used when activeKeys is not provided.
   */
  defaultActiveKeys?: string[];
  /**
   * Callback fired when panel state changes.
   * Receives the current active keys as parameter.
   */
  onChange?: (keys: string[]) => void;
};

/**
 * Props for the internal Panel component
 * @interface PanelProps
 */
type PanelProps = {
  /** The accordion item data to render */
  item: AccordionItem;
  /** Whether this panel is currently expanded */
  isActive: boolean;
  /** Callback to toggle the panel's expanded state */
  onToggle: () => void;
};

/**
 * Individual accordion panel component that handles expand/collapse functionality.
 * Features animated chevron rotation and conditional content rendering.
 *
 * @param item - The accordion item data to render
 * @param isActive - Whether this panel is currently expanded
 * @param onToggle - Callback to toggle the panel's expanded state
 */
const Panel: React.FC<PanelProps> = ({ item, isActive, onToggle }) => {
  // Animation value for chevron rotation (0 = collapsed, 1 = expanded)
  const rotationAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  // Animate chevron rotation when panel state changes
  useEffect(() => {
    Animated.timing(rotationAnim, {
      toValue: isActive ? 1 : 0,
      duration: ROTATION_DURATION_MS,
      useNativeDriver: true, // Better performance for transform animations
    }).start();
  }, [isActive, rotationAnim]);

  return (
    <View style={styles.container}>
      {/* Header section with label, optional icon, and animated chevron */}
      <Pressable
        onPress={onToggle}
        style={styles.header}
        android_ripple={{ color: ANDROID_RIPPLE_COLOR }} // Material Design ripple on Android
      >
        {/* Left side: Icon (optional) + Label */}
        <View style={styles.leftGroup}>
          {item.icon ? (
            <View style={styles.iconContainer}>{item.icon}</View>
          ) : null}
          <Typography
            type="bodyLarge"
            weight="medium"
            style={styles.headerTitle}
          >
            {item.label}
          </Typography>
        </View>

        {/* Right side: Animated chevron */}
        <View style={styles.rightGroup}>
          <Animated.View
            style={{
              ...styles.chevronContainer,
              transform: [
                {
                  // Rotate chevron based on panel state (0deg → 90deg)
                  rotate: rotationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [ROTATE_DEG_INACTIVE, ROTATE_DEG_ACTIVE],
                  }),
                },
              ],
            }}
          >
            <Image
              source={require("../../assets/images/black-right-arrow-icon.png")}
              style={styles.chevronImage}
            />
          </Animated.View>
        </View>
      </Pressable>

      {/* Separator line (only shown when expanded) */}
      {isActive ? <View style={styles.separator} /> : null}

      {/* Panel content (hidden when collapsed) */}
      <View style={[styles.content, !isActive ? styles.hidden : null]}>
        {item.children}
      </View>
    </View>
  );
};

/**
 * Accordion component with support for multiple expandable panels.
 *
 * Features:
 * - Multiple panel support with array-based API
 * - Controlled and uncontrolled modes
 * - Smooth animations with Material Design ripple effects (Android)
 * - TypeScript support with comprehensive type definitions
 * - Customizable styling through constants
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * const items = [
 *   {
 *     key: 'panel1',
 *     label: 'Panel 1',
 *     children: <Text>Content for panel 1</Text>
 *   },
 *   {
 *     key: 'panel2',
 *     label: 'Panel 2',
 *     children: <Text>Content for panel 2</Text>,
 *     icon: <Icon name="star" />
 *   }
 * ];
 *
 * // Uncontrolled mode
 * <Accordion items={items} defaultActiveKeys={["panel1"]} />
 *
 * // Controlled mode
 * <Accordion
 *   items={items}
 *   activeKeys={activeKeys}
 *   onChange={setActiveKeys}
 * />
 *
 * // Multiple panels open
 * <Accordion
 *   items={items}
 *   defaultActiveKeys={["panel1", "panel2"]}
 * />
 * ```
 */
const Accordion: React.FC<AccordionProps> = (props) => {
  const { items, activeKeys, defaultActiveKeys, onChange } = props;

  // Determine if component is in controlled mode (activeKeys prop provided)
  const isControlled = activeKeys !== undefined;

  // Internal state for uncontrolled mode - tracks which panels are open
  const [internalActiveKeys, setInternalActiveKeys] = useState<string[]>(
    () => defaultActiveKeys ?? []
  );

  // Sync internal state with defaultActiveKeys changes in uncontrolled mode
  useEffect(() => {
    // If defaultActiveKeys changes and the component is uncontrolled, update internal state
    // This allows the default to be updated after initial render
    if (!isControlled) {
      setInternalActiveKeys(defaultActiveKeys ?? []);
    }
    // Note: isControlled is intentionally omitted from deps as it shouldn't change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultActiveKeys]);

  // Get the current active keys based on controlled vs uncontrolled mode
  const currentActiveKeys = isControlled
    ? activeKeys ?? [] // Use provided activeKeys in controlled mode
    : internalActiveKeys; // Use internal state in uncontrolled mode

  // Handle panel toggle with support for both controlled and uncontrolled modes
  const handleToggle = useCallback(
    (key: string) => {
      // Check if the panel is currently open
      const isOpen = currentActiveKeys.includes(key);

      // Calculate new active keys (toggle the panel)
      const nextKeys = isOpen
        ? currentActiveKeys.filter((k) => k !== key) // Remove key if open
        : [...currentActiveKeys, key]; // Add key if closed

      // Update internal state only in uncontrolled mode
      if (!isControlled) {
        setInternalActiveKeys(nextKeys);
      }

      // Always call onChange callback if provided (for both modes)
      if (onChange) {
        onChange(nextKeys);
      }
    },
    [currentActiveKeys, isControlled, onChange]
  );

  // Render all accordion panels
  return (
    <View>
      {items.map((item) => {
        // Check if this specific panel should be active/expanded
        const isActive = currentActiveKeys.includes(item.key);
        return (
          <Panel
            key={item.key}
            item={item}
            isActive={isActive}
            onToggle={() => handleToggle(item.key)}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: CONTAINER_RADIUS,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    overflow: "hidden",
    backgroundColor: BACKGROUND_COLOR,
    marginBottom: CONTAINER_MARGIN_BOTTOM,
  },
  header: {
    paddingHorizontal: HEADER_PADDING_HORIZONTAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: HEADER_GAP,
    height: HEADER_HEIGHT,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  iconContainer: {
    marginRight: ICON_MARGIN_RIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronContainer: {
    width: CHEVRON_SIZE,
    height: CHEVRON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronText: {
    fontSize: CHEVRON_FONT_SIZE,
    lineHeight: CHEVRON_LINE_HEIGHT,
    color: CHEVRON_COLOR,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  headerTitle: {
    lineHeight: 22,
    includeFontPadding: false,
    flexShrink: 1,
  },
  separator: {
    height: SEPARATOR_HEIGHT,
    backgroundColor: BORDER_COLOR,
    marginVertical: SEPARATOR_MARGIN_VERTICAL,
    marginHorizontal: 10,
  },
  content: {
    paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
    paddingBottom: CONTENT_PADDING_BOTTOM,
    gap: CONTENT_GAP,
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: HEADER_GAP,
  },
  hidden: {
    display: "none",
  },
  chevronImage: {
    width: 16,
    height: 32,
  },
});

export default Accordion;
