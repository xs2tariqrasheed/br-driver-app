import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from "react-native";

export type ActionIconButtonProps = {
  /** Function to call when button is pressed */
  onPress: () => void;
  /** Icon source (image require or uri) */
  iconUrl: ImageSourcePropType;
  /** Optional disabled state */
  disabled?: boolean;
};

export const ActionIconButton: React.FC<ActionIconButtonProps> = ({
  onPress,
  iconUrl,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Image source={iconUrl} style={styles.icon} resizeMode="contain" />
    </TouchableOpacity>
  );
};

export type ActionIconBarProps = {
  /** Array of button configurations */
  buttons: Array<{
    onPress: () => void;
    iconUrl: ImageSourcePropType;
    disabled?: boolean;
    visible?: boolean;
  }>;
  /** Enable horizontal scrolling for many buttons */
  scrollable?: boolean;
};

export const ActionIconBar: React.FC<ActionIconBarProps> = ({
  buttons,
  scrollable = false,
}) => {
  // Filter buttons based on visibility
  const visibleButtons = buttons.filter((button) => button.visible !== false);

  const renderButtons = () => {
    return visibleButtons.map((button, index) => (
      <ActionIconButton
        key={index}
        onPress={button.onPress}
        iconUrl={button.iconUrl}
        disabled={button.disabled}
      />
    ));
  };

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
      >
        {renderButtons()}
      </ScrollView>
    );
  }

  return <View style={styles.container}>{renderButtons()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  button: {
    width: 54,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A0A0A0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 24,
    height: 24,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default ActionIconBar;
