import Examples from "@/components/Examples";
import Header from "@/components/Header";
import React from "react";
import { ScrollView, View } from "react-native";

export default function ExamplesTab() {
  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        backgroundColor: "white",
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header title="Examples" hideBackIcon />
        <Examples />
      </ScrollView>
    </View>
  );
}
