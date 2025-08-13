import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { colors } from "@/constants/colors";
import React, { useState } from "react";
import Accordion from ".";

const AccordionExamples: React.FC = () => {
  const [controlledMultiKeys, setControlledMultiKeys] = useState<string[]>([
    "1",
  ]);

  return (
    <>
      <ThemedText type="subtitle">
        Basic (uncontrolled, multiple open)
      </ThemedText>
      <Accordion
        items={[
          {
            key: "1",
            label: "Panel 1",
            icon: (
              <IconSymbol
                name="chevron.right"
                size={18}
                weight="medium"
                color={colors.icon}
              />
            ),
            children: (
              <>
                <ThemedText>Line A</ThemedText>
                <ThemedText>Line B</ThemedText>
              </>
            ),
          },
          {
            key: "2",
            icon: (
              <IconSymbol
                name="chevron.right"
                size={18}
                weight="medium"
                color={colors.icon}
              />
            ),
            label: "Panel 2",
            children: (
              <>
                <ThemedText>Line A</ThemedText>
                <ThemedText>Line B</ThemedText>
              </>
            ),
          },
        ]}
        defaultActiveKey={["1"]}
      />

      <ThemedText type="subtitle">Controlled (multiple)</ThemedText>
      <Accordion
        items={[
          {
            key: "1",
            icon: (
              <IconSymbol
                name="chevron.right"
                size={18}
                weight="medium"
                color={colors.icon}
              />
            ),
            label: "A",
            children: <ThemedText>A content</ThemedText>,
          },
          {
            key: "2",
            icon: (
              <IconSymbol
                name="chevron.right"
                size={18}
                weight="medium"
                color={colors.icon}
              />
            ),
            label: "B",
            children: <ThemedText>B content</ThemedText>,
          },
          {
            key: "3",
            icon: (
              <IconSymbol
                name="chevron.right"
                size={18}
                weight="medium"
                color={colors.icon}
              />
            ),
            label: "C",
            children: <ThemedText>C content</ThemedText>,
          },
        ]}
        activeKey={controlledMultiKeys}
        onChange={(k) => {
          if (Array.isArray(k)) setControlledMultiKeys(k);
        }}
      />
    </>
  );
};

export default AccordionExamples;
