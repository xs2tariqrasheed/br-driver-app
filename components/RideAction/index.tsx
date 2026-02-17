import { textColors } from "@/constants/colors";
import { useOverlayInsets } from "@/context/OverlayInsetsContext";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { SwipeableButton } from "../Button/SwipeButton";

export interface RideActionProps {
  /** Optional left accessory (icon/button). Rendered inside a boxed area. */
  leftComponent?: React.ReactNode | null;
  /** Center swipe button title text */
  swipeTitle: string;
  /** Called when swipe completes successfully */
  onSwipeComplete: () => void;
  /** Disable the center swipe button */
  disabled?: boolean;
  /** Optional right accessory (icon/button). Rendered inside a boxed area. */
  rightComponent?: React.ReactNode | null;
  /** Optional container style override */
  style?: ViewStyle;
  /** Stick the action bar to bottom of the parent container */
  sticky?: boolean;
  /** Called when left button is pressed */
  onLeftPress?: () => void;
  /** Called when right button is pressed */
  onRightPress?: () => void;
  /** Disable only the left action button (overrides disabled for left side when set) */
  leftDisabled?: boolean;
  /** Disable only the right action button (overrides disabled for right side when set) */
  rightDisabled?: boolean;
}

/**
 * RideAction - Bottom action bar with optional left/right accessories and a centered swipe button
 * - White background with 30px top border radii
 * - Left and right areas have fixed width to keep center perfectly centered regardless of presence
 */
const RideAction: React.FC<RideActionProps> = ({
  leftComponent = null,
  swipeTitle,
  onSwipeComplete,
  disabled = false,
  rightComponent = null,
  style,
  sticky = true,
  onLeftPress,
  onRightPress,
  leftDisabled,
  rightDisabled,
}) => {
  const { overlayBottomInset } = useOverlayInsets();
  const isLeftDisabled = disabled || (leftDisabled ?? false);
  const isRightDisabled = disabled || (rightDisabled ?? false);
  // Render a placeholder to preserve layout and keep the center truly centered
  const Left = (
    <TouchableOpacity
      onPress={onLeftPress}
      disabled={isLeftDisabled}
      style={[
        leftComponent ? styles.sideBox : styles.sideEmpty,
        isLeftDisabled && styles.sideDisabled,
      ]}
    >
      {leftComponent ?? <View style={styles.sideFiller} />}
    </TouchableOpacity>
  );
  const Right = (
    <TouchableOpacity
      onPress={onRightPress}
      disabled={isRightDisabled}
      style={[
        rightComponent ? styles.sideBox : styles.sideEmpty,
        isRightDisabled && styles.sideDisabled,
      ]}
    >
      {rightComponent ?? <View style={styles.sideFiller} />}
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        sticky && styles.sticky,
        style,
        { paddingBottom: overlayBottomInset + 5 },
      ]}
    >
      <View style={styles.row}>
        {Left}

        <View style={styles.center}>
          <SwipeableButton
            title={swipeTitle}
            onComplete={onSwipeComplete}
            autoReset={true}
            disabled={disabled}
          />
        </View>

        {Right}
      </View>
    </View>
  );
};
const isSmallScreen = Dimensions.get("window").width < 375;
const SIDE_WIDTH = isSmallScreen ? 44 : 54; //  For small screens, use 44px side width to preserve center alignment

const styles = StyleSheet.create({
  container: {
    backgroundColor: textColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: textColors.grey300,
  },
  sticky: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sideBox: {
    width: SIDE_WIDTH,
    height: 42,
    borderWidth: 1,
    borderColor: textColors.grey300,
    borderRadius: 8,
    backgroundColor: textColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  sideEmpty: {
    width: SIDE_WIDTH,
    height: 42,
    backgroundColor: textColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  sideDisabled: {
    opacity: 0.5,
  },
  sideFiller: {
    width: 1,
    height: 1,
  },
  center: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default RideAction;
