import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";

export type HeaderProps = {
  /** Title text shown in the center */
  title: string;
  /** Hide the back icon when true */
  hideBackIcon?: boolean;
  /** Callback when back icon is pressed */
  onBackPress?: () => void;
};

const ICON_TOUCH_SIZE = 44;

export const Header: React.FC<HeaderProps> = ({
  title,
  hideBackIcon = false,
  onBackPress,
}) => {
  const screenHeight = Dimensions.get("window").height;
  const verticalPadding = Math.max(12, Math.round(screenHeight * 0.05));

  return (
    <View
      style={[
        styles.container,
        {
          paddingVertical: verticalPadding,
          borderBottomColor: textColors.grey100,
        },
      ]}
    >
      {/* Back icon on the left side */}
      <View style={styles.sideSpacer}>
        {!hideBackIcon ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBackPress}
            hitSlop={8}
            style={styles.iconButton}
          >
            <Image
              source={require("@/assets/images/back-arrow.png")}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.titleWrap}>
        <Typography type="headingSmall" weight="medium" style={styles.title}>
          {title}
        </Typography>
      </View>

      {/* Right spacer to keep title centered */}
      <View style={styles.sideSpacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingBottom: 12,
  },
  sideSpacer: {
    width: ICON_TOUCH_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    width: ICON_TOUCH_SIZE,
    // height: ICON_TOUCH_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: textColors.black,
  },
});

export default Header;
