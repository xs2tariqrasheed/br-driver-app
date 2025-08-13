import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { colors } from "@/constants/colors";
import React, { useState } from "react";
import Accordion from ".";

const AccordionExamples: React.FC = () => {
  const [controlledMultiKeys, setControlledMultiKeys] = useState<string[]>([
    "1",
  ]);
  const [controlledAccordionKey, setControlledAccordionKey] = useState<
    string | string[]
  >("2");

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
            extra: <ThemedText>extra</ThemedText>,
            children: (
              <>
                <ThemedText>Line A</ThemedText>
                <ThemedText>Line B</ThemedText>
              </>
            ),
          },
          {
            key: "2",
            label: "Panel 2",
            children: (
              <>
                <ThemedText>Line A</ThemedText>
                <ThemedText>Line B</ThemedText>
              </>
            ),
          },
          {
            key: "3",
            label: "Disabled item",
            disabled: true,
            children: <ThemedText>Disabled content</ThemedText>,
          },
        ]}
        defaultActiveKey={["1"]}
      />

      <ThemedText type="subtitle">Accordion mode (single open)</ThemedText>
      <Accordion
        accordion
        items={[
          { key: "1", label: "First", children: <ThemedText>One</ThemedText> },
          { key: "2", label: "Second", children: <ThemedText>Two</ThemedText> },
          {
            key: "3",
            label: "Third",
            children: <ThemedText>Three</ThemedText>,
          },
        ]}
        defaultActiveKey="2"
      />

      <ThemedText type="subtitle">Controlled (multiple)</ThemedText>
      <Accordion
        items={[
          {
            key: "1",
            label: "A",
            children: <ThemedText>A content</ThemedText>,
          },
          {
            key: "2",
            label: "B",
            children: <ThemedText>B content</ThemedText>,
          },
          {
            key: "3",
            label: "C",
            children: <ThemedText>C content</ThemedText>,
          },
        ]}
        activeKey={controlledMultiKeys}
        onChange={(k) => {
          if (Array.isArray(k)) setControlledMultiKeys(k);
        }}
      />

      <ThemedText type="subtitle">Controlled (accordion)</ThemedText>
      <Accordion
        accordion
        items={[
          { key: "1", label: "One", children: <ThemedText>One</ThemedText> },
          { key: "2", label: "Two", children: <ThemedText>Two</ThemedText> },
          {
            key: "3",
            label: "Three",
            children: <ThemedText>Three</ThemedText>,
          },
        ]}
        activeKey={controlledAccordionKey}
        onChange={(k) => setControlledAccordionKey(k)}
      />

      <ThemedText type="subtitle">Destroy inactive panels</ThemedText>
      <Accordion
        destroyInactivePanel
        items={[
          {
            key: "1",
            label: "One",
            children: <ThemedText>Unmounts when closed</ThemedText>,
          },
          {
            key: "2",
            label: "Two",
            children: <ThemedText>Unmounts when closed</ThemedText>,
          },
        ]}
        defaultActiveKey="1"
      />

      <ThemedText type="subtitle">Expand icon on left</ThemedText>
      <Accordion
        expandIconPosition="left"
        items={[
          {
            key: "1",
            label: "Left icon 1",
            children: <ThemedText>Content</ThemedText>,
          },
          {
            key: "2",
            label: "Left icon 2",
            children: <ThemedText>Content</ThemedText>,
          },
        ]}
      />

      <ThemedText type="subtitle">Collapsible: header only</ThemedText>
      <Accordion
        collapsible="header"
        items={[
          {
            key: "1",
            label: "Tap header to toggle",
            children: <ThemedText>Content</ThemedText>,
          },
        ]}
      />

      <ThemedText type="subtitle">Collapsible: icon only</ThemedText>
      <Accordion
        collapsible="icon"
        items={[
          {
            key: "1",
            label: "Tap chevron to toggle",
            children: <ThemedText>Content</ThemedText>,
          },
        ]}
      />

      <ThemedText type="subtitle">Group disabled</ThemedText>
      <Accordion
        disabled
        items={[
          {
            key: "1",
            label: "Disabled group item",
            children: <ThemedText>Cannot open</ThemedText>,
          },
        ]}
      />

      <ThemedText type="subtitle">Per-item overrides</ThemedText>
      <Accordion
        collapsible="header"
        items={[
          {
            key: "1",
            label: "Header only (group default)",
            children: <ThemedText>Content</ThemedText>,
          },
          {
            key: "2",
            label: "Icon only (override)",
            collapsible: "icon",
            children: <ThemedText>Content</ThemedText>,
          },
        ]}
      />

      <ThemedText type="subtitle">
        Single panel (backwards compatible)
      </ThemedText>
      <Accordion
        title="Single panel title"
        icon={
          <IconSymbol
            name="chevron.right"
            size={18}
            weight="medium"
            color={colors.icon}
          />
        }
      >
        <ThemedText>Single panel content</ThemedText>
      </Accordion>
    </>
  );
};

export default AccordionExamples;
