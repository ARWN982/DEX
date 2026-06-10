import React, { useEffect } from "react";
import { useControls, folder, Leva, button } from "leva";
import { useDashboardPanelSettings, BorderColorKey, BorderStyleType } from "../../store/useDashboardPanelSettings";

export const DashboardLevaPanel: React.FC = () => {
  const { setSettings } = useDashboardPanelSettings();

  const values = useControls({
    "Grid": folder({
      gridGap: {
        value: 8,
        options: {
          "8px": 8,
          "12px": 12,
          "16px": 16,
        },
        label: "Gap",
      },
    }),
    "Panel border": folder({
      borderStyle: {
        value: "border",
        options: {
          Border: "border",
          "Box shadow": "shadow",
        },
        label: "Style",
      },
      borderRadius: { value: 4, min: 0, max: 20, step: 1, label: "Radius" },
      borderWidth: { 
        value: 1, 
        min: 0, 
        max: 5, 
        step: 1, 
        label: "Border width",
        render: (get) => get("Panel border.borderStyle") === "border",
      },
      borderColorKey: {
        value: "borderBaseSubdued",
        options: {
          "Subdued": "borderBaseSubdued",
          "Plain": "borderBasePlain",
          "Disabled": "borderBaseDisabled",
          "Primary": "borderBasePrimary",
          "Success": "borderBaseSuccess",
          "Warning": "borderBaseWarning",
          "Danger": "borderBaseDanger",
        },
        label: "Border color",
        render: (get) => get("Panel border.borderStyle") === "border",
      },
    }),
    Title: folder({
      titleFontSize: { value: 14, min: 10, max: 24, step: 1, label: "Font size" },
      titleFontWeight: { 
        value: 500, 
        options: { Normal: 400, Medium: 500, Semibold: 600, Bold: 700 },
        label: "Font weight" 
      },
      titleHeight: {
        value: 40,
        options: {
          "24px": 24,
          "32px": 32,
          "40px": 40,
        },
        label: "Height",
      },
      "Title padding": folder({
        titlePaddingTop: { value: 0, min: 0, max: 24, step: 1, label: "Top" },
        titlePaddingRight: { value: 12, min: 0, max: 24, step: 1, label: "Right" },
        titlePaddingBottom: { value: 0, min: 0, max: 24, step: 1, label: "Bottom" },
        titlePaddingLeft: { value: 16, min: 0, max: 24, step: 1, label: "Left" },
      }),
    }),
    "Panel body padding": folder({
      panelPaddingTop: { value: 0, min: 0, max: 24, step: 1, label: "Top" },
      panelPaddingRight: { value: 16, min: 0, max: 24, step: 1, label: "Right" },
      panelPaddingBottom: { value: 12, min: 0, max: 24, step: 1, label: "Bottom" },
      panelPaddingLeft: { value: 16, min: 0, max: 24, step: 1, label: "Left" },
    }),
  });

  // Sync Leva values with the store
  useEffect(() => {
    setSettings({
      ...values,
      borderStyle: values.borderStyle as BorderStyleType,
      borderColorKey: values.borderColorKey as BorderColorKey,
    });
  }, [values, setSettings]);

  return <Leva collapsed={false} titleBar={{ title: "Panel settings" }} />;
};
