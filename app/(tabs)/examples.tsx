import Examples from "@/components/Examples";
import Header from "@/components/Header";
import React from "react";
import { SafeAreaView, ScrollView, View } from "react-native";

export default function ExamplesTab() {
  return (
    <SafeAreaView
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
    </SafeAreaView>
  );
}
