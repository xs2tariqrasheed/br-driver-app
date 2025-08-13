import Typography from "@/components/Typography";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import {
  ANDROID_RIPPLE_COLOR,
  BACKGROUND_COLOR,
  BORDER_COLOR,
  CHEVRON_CHAR,
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
  SEPARATOR_WIDTH_PERCENT,
} from "./constants";

export type AccordionItem = {
  key: string;
  label: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  extra?: ReactNode;
  collapsible?: "disabled" | "header" | "icon";
};

export type AccordionProps = {
  // Collapse-like API
  items?: AccordionItem[];
  activeKey?: string | string[];
  defaultActiveKey?: string | string[];
  accordion?: boolean;
  onChange?: (key: string | string[]) => void;
  destroyInactivePanel?: boolean;
  expandIcon?: (props: { isActive: boolean }) => ReactNode;
  expandIconPosition?: "left" | "right";
  collapsible?: "disabled" | "header" | "icon";
  disabled?: boolean;

  // Backwards-compatible single-panel props
  icon?: ReactNode;
  title?: string;
  children?: ReactNode;
};

const normalizeToArray = (keys?: string | string[]): string[] => {
  if (keys == null) return [];
  return Array.isArray(keys) ? keys : [keys];
};

type PanelProps = {
  item: AccordionItem;
  isActive: boolean;
  onToggle: () => void;
  destroyInactivePanel: boolean;
  expandIcon?: (props: { isActive: boolean }) => ReactNode;
  expandIconPosition: "left" | "right";
  defaultCollapsible?: "disabled" | "header" | "icon";
  groupDisabled?: boolean;
};

const Panel: React.FC<PanelProps> = ({
  item,
  isActive,
  onToggle,
  destroyInactivePanel,
  expandIcon,
  expandIconPosition,
  defaultCollapsible,
  groupDisabled,
}) => {
  const disabled = groupDisabled || item.disabled;
  const effectiveCollapsible = item.collapsible ?? defaultCollapsible;

  const rotationAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotationAnim, {
      toValue: isActive ? 1 : 0,
      duration: ROTATION_DURATION_MS,
      useNativeDriver: true,
    }).start();
  }, [isActive, rotationAnim]);

  const chevronStyle = useMemo<Pick<ViewStyle, "transform">>(
    () => ({
      transform: [
        {
          rotate: rotationAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [ROTATE_DEG_INACTIVE, ROTATE_DEG_ACTIVE],
          }),
        },
      ],
    }),
    [rotationAnim]
  );

  const [hasRenderedOnce, setHasRenderedOnce] = useState<boolean>(isActive);
  useEffect(() => {
    if (isActive && !hasRenderedOnce) setHasRenderedOnce(true);
  }, [isActive, hasRenderedOnce]);

  const canToggleFromHeader =
    !disabled &&
    effectiveCollapsible !== "disabled" &&
    effectiveCollapsible !== "icon";
  const canToggleFromIcon =
    !disabled &&
    effectiveCollapsible !== "disabled" &&
    effectiveCollapsible !== "header";

  const renderChevron = () => {
    if (expandIcon) {
      return expandIcon({ isActive });
    }
    return (
      <Animated.View style={[styles.chevronContainer, chevronStyle]}>
        <Text style={styles.chevronText}>{CHEVRON_CHAR}</Text>
      </Animated.View>
    );
  };

  const HeaderLeft = (
    <View style={styles.leftGroup}>
      {item.icon ? <View style={styles.iconContainer}>{item.icon}</View> : null}
      <Typography type="bodyLarge" weight="medium" style={styles.headerTitle}>
        {item.label}
      </Typography>
    </View>
  );

  const ChevronPressable = (
    <Pressable
      onPress={canToggleFromIcon ? onToggle : undefined}
      android_ripple={
        canToggleFromIcon ? { color: ANDROID_RIPPLE_COLOR } : undefined
      }
    >
      {renderChevron()}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Pressable
        onPress={canToggleFromHeader ? onToggle : undefined}
        style={styles.header}
        android_ripple={
          canToggleFromHeader ? { color: ANDROID_RIPPLE_COLOR } : undefined
        }
      >
        {expandIconPosition === "left" ? (
          <View style={styles.rowCenter}>
            {ChevronPressable}
            {HeaderLeft}
          </View>
        ) : (
          HeaderLeft
        )}
        <View style={styles.rightGroup}>
          {item.extra}
          {expandIconPosition === "right" ? ChevronPressable : null}
        </View>
      </Pressable>

      {isActive ? <View style={styles.separator} /> : null}

      {destroyInactivePanel ? (
        isActive ? (
          <View style={styles.content}>{item.children}</View>
        ) : null
      ) : hasRenderedOnce ? (
        <View style={[styles.content, !isActive ? styles.hidden : null]}>
          {item.children}
        </View>
      ) : null}
    </View>
  );
};

/**
 * Accordion (Collapse-like)
 * - Supports multiple panels via `items`
 * - Controlled/uncontrolled via `activeKey` / `defaultActiveKey`
 * - `accordion` mode to allow only one open
 * - `onChange` callback with open keys
 * - `destroyInactivePanel` to unmount closed content
 * - `expandIcon` and `expandIconPosition`
 * - Per-item `disabled`, `extra`, and `collapsible`
 *
 * Styles remain identical to the original single-panel component.
 */
const Accordion: React.FC<AccordionProps> = (props) => {
  const {
    items,
    activeKey,
    defaultActiveKey,
    accordion,
    onChange,
    destroyInactivePanel = false,
    expandIcon,
    expandIconPosition = "right",
    collapsible,
    disabled,
    // backward-compat
    icon,
    title,
    children,
  } = props;

  const derivedItems: AccordionItem[] = useMemo(() => {
    if (items && items.length > 0) return items;
    // Backwards-compatible single panel
    return [
      {
        key: "0",
        label: title ?? "",
        children: children as ReactNode,
        icon,
      },
    ];
  }, [items, icon, title, children]);

  const isControlled = activeKey !== undefined;
  const initialKeys = useMemo(() => {
    const normalized = normalizeToArray(defaultActiveKey);
    return accordion ? normalized.slice(0, 1) : normalized;
  }, [defaultActiveKey, accordion]);

  const [internalActiveKeys, setInternalActiveKeys] =
    useState<string[]>(initialKeys);

  useEffect(() => {
    // If defaultActiveKey changes and the component is uncontrolled, update initial
    if (!isControlled) {
      const normalized = normalizeToArray(defaultActiveKey);
      setInternalActiveKeys(accordion ? normalized.slice(0, 1) : normalized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultActiveKey]);

  const currentActiveKeys = isControlled
    ? accordion
      ? normalizeToArray(activeKey).slice(0, 1)
      : normalizeToArray(activeKey)
    : internalActiveKeys;

  const handleToggle = useCallback(
    (key: string) => {
      const isOpen = currentActiveKeys.includes(key);
      let nextKeys: string[];
      if (accordion) {
        nextKeys = isOpen ? [] : [key];
      } else {
        nextKeys = isOpen
          ? currentActiveKeys.filter((k) => k !== key)
          : [...currentActiveKeys, key];
      }

      if (!isControlled) {
        setInternalActiveKeys(nextKeys);
      }

      if (onChange) {
        if (accordion) {
          onChange(nextKeys.length ? nextKeys[0] : []);
        } else {
          onChange(nextKeys);
        }
      }
    },
    [accordion, currentActiveKeys, isControlled, onChange]
  );

  return (
    <View>
      {derivedItems.map((item) => {
        const isActive = currentActiveKeys.includes(item.key);
        return (
          <Panel
            key={item.key}
            item={item}
            isActive={!!isActive}
            onToggle={() => handleToggle(item.key)}
            destroyInactivePanel={!!destroyInactivePanel}
            expandIcon={expandIcon}
            expandIconPosition={expandIconPosition}
            defaultCollapsible={collapsible}
            groupDisabled={disabled}
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
  titleText: {
    fontSize: 16,
    color: undefined,
    fontWeight: "600",
    flexShrink: 1,
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
    width: SEPARATOR_WIDTH_PERCENT,
    height: SEPARATOR_HEIGHT,
    backgroundColor: BORDER_COLOR,
    alignSelf: "center",
    marginVertical: SEPARATOR_MARGIN_VERTICAL,
  },
  content: {
    paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
    paddingBottom: CONTENT_PADDING_BOTTOM,
    gap: CONTENT_GAP,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: HEADER_GAP,
  },
  hidden: {
    display: "none",
  },
});

export default Accordion;
