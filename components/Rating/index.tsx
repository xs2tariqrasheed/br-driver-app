import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { Image } from "expo-image";
import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type RatingProps = {
  /** Current rating value (0-5) */
  rating: number;
  /** Callback when rating changes */
  onRatingChange: (rating: number) => void;
  /** Maximum rating value (default: 5) */
  maxRating?: number;
  /** Size of the stars in pixels (default: 48) */
  size?: number;
  /** Whether the rating is disabled */
  disabled?: boolean;
  /** Optional style override for the container */
  style?: StyleProp<ViewStyle>;
  /** Whether to show the rating value as text */
  showValue?: boolean;
};

const Rating: React.FC<RatingProps> = ({
  rating,
  onRatingChange,
  maxRating = 5,
  size = 48,
  disabled = false,
  style,
  showValue = false,
}) => {
  const handleStarPress = (starIndex: number) => {
    if (disabled) return;
    onRatingChange(starIndex + 1);
  };

  const renderStar = (index: number) => {
    const isFilled = index < rating;
    const starSource = isFilled
      ? require("@/assets/images/rating-start-filled.png")
      : require("@/assets/images/rating-start.png");

    return (
      <Pressable
        key={index}
        onPress={() => handleStarPress(index)}
        disabled={disabled}
        style={[styles.starContainer, { width: size, height: size }]}
        accessibilityRole="button"
        accessibilityLabel={`Rate ${index + 1} out of ${maxRating} stars`}
        accessibilityState={{ disabled }}
      >
        <Image
          source={starSource}
          style={[styles.star, { width: size, height: size }]}
          resizeMode="contain"
        />
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsContainer}>
        {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
      </View>
      {showValue && (
        <View style={styles.valueContainer}>
          <Typography
            type="bodyMedium"
            weight="medium"
            style={styles.valueText}
          >
            {rating} / {maxRating}
          </Typography>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  starContainer: {
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  star: {
    resizeMode: "contain",
  },
  valueContainer: {
    marginTop: 8,
  },
  valueText: {
    color: textColors.grey700,
    textAlign: "center",
  },
});

export default Rating;
