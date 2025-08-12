import Typography from "@/components/Typography";
import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

export type AccordionProps = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
};

/**
 * Accordion
 * - Uses Pressable for the header
 * - Left-aligned custom icon, followed by title
 * - Right side built-in chevron that rotates on expand/collapse
 * - Renders children when expanded
 */
const Accordion: React.FC<AccordionProps> = ({ icon, title, children }) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotationAnim, {
      toValue: expanded ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [expanded, rotationAnim]);

  const chevronStyle = useMemo<Pick<ViewStyle, "transform">>(
    () => ({
      transform: [
        {
          rotate: rotationAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "90deg"], // right (closed) -> down (open)
          }),
        },
      ],
    }),
    [rotationAnim]
  );

  const onToggle = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onToggle}
        style={styles.header}
        android_ripple={{ color: "#e5e7eb" }}
      >
        <View style={styles.leftGroup}>
          <View style={styles.iconContainer}>{icon}</View>
          <Typography
            type="bodyLarge"
            weight="medium"
            style={styles.headerTitle}
          >
            {title}
          </Typography>
        </View>
        <Animated.View style={[styles.chevronContainer, chevronStyle]}>
          <Text style={styles.chevronText}>{"›"}</Text>
        </Animated.View>
      </Pressable>

      {expanded ? <View style={styles.separator} /> : null}

      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D0D0D0",
    overflow: "hidden",
    backgroundColor: "#F7F7F7",
  },
  header: {
    paddingHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    height: 42,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  iconContainer: {
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
    flexShrink: 1,
  },
  chevronContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronText: {
    fontSize: 35,
    lineHeight: 35,
    color: "#6b7280",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  headerTitle: {
    lineHeight: 22,
    includeFontPadding: false,
    flexShrink: 1,
  },
  separator: {
    width: "90%",
    height: 1,
    backgroundColor: "#D0D0D0",
    alignSelf: "center",
    marginVertical: 8,
  },
  content: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 16,
  },
});

export default Accordion;
