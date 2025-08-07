import React from "react";
import { ScrollView, View } from "react-native";

import { Typography } from "../../components/typography/index";
import { TYPOGRAPHY_VARIANTS } from "../../components/typography/typography.constant";

const variantKeys = Object.keys(TYPOGRAPHY_VARIANTS);

export default function TypographyVariantsScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {variantKeys.map((key) => (
        <View key={key} style={{ marginBottom: 16 }}>
          <Typography
            // Required props, but actual style comes from the mapping
            type="bodyLarge"
            weight="regular"
            variant="success"
            style={TYPOGRAPHY_VARIANTS[key]}
          >
            {key}
          </Typography>
        </View>
      ))}
    </ScrollView>
  );
}
