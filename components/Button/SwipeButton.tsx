import { textColors } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import SwipeButton from "rn-swipe-button";
interface SwipeableButtonProps {
  title: string;
  onComplete: () => void;
  completionThreshold?: number;
  autoReset?: boolean;
  disabled?: boolean;
}

/** Space reserved for side buttons, thumb, and padding so title can wrap within remaining width */
const TITLE_HORIZONTAL_RESERVED = 130;

export function SwipeableButton({
  title,
  onComplete,
  completionThreshold = 400,
  autoReset = false,
  disabled = false,
}: SwipeableButtonProps) {
   const { width: windowWidth } = useWindowDimensions();
  const maxTitleWidth = Math.max(120, windowWidth - TITLE_HORIZONTAL_RESERVED);

  let forceResetLastButton: any = null;
  let forceCompleteCallback: any = null;
  const [finishSwipeAnimDuration, setFinishSwipeAnimDuration] =
    useState(completionThreshold);

  const handleSwipeSuccess = useCallback(() => {
    onComplete();

    if (autoReset) {
      // Reset the button after a short delay to allow completion animation
      setTimeout(() => {
        forceResetLastButton();
        setFinishSwipeAnimDuration(completionThreshold);
      }, 1000);
    }
  }, [onComplete, autoReset, completionThreshold]);

  const titleComponent = useCallback(
    () => (
      <View style={[styles.titleWrapper, { maxWidth: maxTitleWidth }]}>
        <Text
          numberOfLines={3}
          style={[
            styles.titleText,
            disabled ? styles.disabledTitle : styles.activeTitle,
          ]}
        >
          {title}
        </Text>
      </View>
    ),
    [title, disabled, maxTitleWidth]
  );

  return (
    <View style={{ position: "relative" }}>
      {!disabled && (
        <LinearGradient
          colors={[textColors.teal400, textColors.teal850]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientRail}
        />
      )}
      <SwipeButton
        disabled={disabled}
        disableResetOnTap
        forceReset={(reset: any) => {
          forceResetLastButton = reset;
        }}
        finishRemainingSwipeAnimationDuration={finishSwipeAnimDuration}
        forceCompleteSwipe={(forceComplete: any) => {
          forceCompleteCallback = forceComplete;
        }}
        onSwipeSuccess={handleSwipeSuccess}
        railBorderColor="transparent"
        railBackgroundColor={disabled ? textColors.grey250 : "transparent"}
        containerStyles={
          disabled ? styles.disabledContainer : styles.activeContainer
        }
        railStyles={disabled ? styles.disabledRail : styles.activeRail}
        thumbIconBackgroundColor={textColors.white}
        thumbIconStyles={
          disabled ? styles.disabledThumbIcon : styles.activeThumbIcon
        }
        title={title}
        titleComponent={titleComponent}
        thumbIconComponent={() => (
          <Image
            source={require("../../assets/images/arrow-right.png")}
            style={{ width: 20, height: 20 }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  disabledRail: {
    backgroundColor: textColors.white,
    borderColor: textColors.white,
    opacity: 0.5,
  },
  disabledTitle: {
    color: textColors.black,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    opacity: 0.5,
  },
  disabledContainer: {
    backgroundColor: textColors.grey250,
    borderWidth: 1,
    borderColor: textColors.grey250,
    opacity: 0.5,
  },
  activeContainer: {
    backgroundColor: textColors.teal900,
    borderWidth: 1,
    borderColor: textColors.teal900,
  },
  activeRail: {
    backgroundColor: textColors.teal700,
    borderColor: textColors.teal700,
  },
  gradientRail: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: 100,
  },
  titleWrapper: {
    marginLeft: 42,
    alignSelf: "center",
  },
  titleText: {
    textAlign: "center",
  },
  activeTitle: {
    color: textColors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  disabledThumbIcon: {
    opacity: 0.5,
  },
  activeThumbIcon: {
    opacity: 1,
    borderWidth: 0,
  },
});
