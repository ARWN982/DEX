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
    "Panel Border": folder({
      borderStyle: {
        value: "shadow",
        options: {
          "Border": "border",
          "Box Shadow": "shadow",
        },
        label: "Style",
      },
      borderRadius: { value: 4, min: 0, max: 20, step: 1, label: "Radius" },
      borderWidth: { 
        value: 1, 
        min: 0, 
        max: 5, 
        step: 1, 
        label: "Border Width",
        render: (get) => get("Panel Border.borderStyle") === "border",
      },
      borderColorKey: {
        value: "borderBasePlain",
        options: {
          "Subdued": "borderBaseSubdued",
          "Plain": "borderBasePlain",
          "Disabled": "borderBaseDisabled",
          "Primary": "borderBasePrimary",
          "Success": "borderBaseSuccess",
          "Warning": "borderBaseWarning",
          "Danger": "borderBaseDanger",
        },
        label: "Border Color",
        render: (get) => get("Panel Border.borderStyle") === "border",
      },
    }),
    Title: folder({
      titleFontSize: { value: 14, min: 10, max: 24, step: 1, label: "Font Size" },
      titleFontWeight: { 
        value: 500, 
        options: { Normal: 400, Medium: 500, Semibold: 600, Bold: 700 },
        label: "Font Weight" 
      },
      "Title Padding": folder({
        titlePaddingTop: { value: 0, min: 0, max: 24, step: 1, label: "Top" },
        titlePaddingRight: { value: 12, min: 0, max: 24, step: 1, label: "Right" },
        titlePaddingBottom: { value: 0, min: 0, max: 24, step: 1, label: "Bottom" },
        titlePaddingLeft: { value: 12, min: 0, max: 24, step: 1, label: "Left" },
      }),
    }),
    "Panel Padding": folder({
      panelPaddingTop: { value: 12, min: 0, max: 24, step: 1, label: "Top" },
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

  return <Leva collapsed={false} titleBar={{ title: "Panel Settings" }} />;
};
