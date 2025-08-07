import React from "react";
import { ScrollView, View } from "react-native";

import { Typography } from "../../components/Typography";
import { TYPOGRAPHY_VARIANTS } from "../../constants/typography";

const variantKeys = Object.keys(TYPOGRAPHY_VARIANTS);

export default function TypographyVariantsScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {variantKeys.map((key) => (
        <View key={key} style={{ marginBottom: 16 }}>
          <Typography
            // Required props, but actual style comes from the mapping
            type={"body" as any}
            weight={"Regular" as any}
            style={TYPOGRAPHY_VARIANTS[key]}
          >
            {key}
          </Typography>
        </View>
      ))}
    </ScrollView>
  );
}
