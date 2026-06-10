import { useEuiTheme } from "@elastic/eui";
import React from "react";
import { useAppStore } from "../../store/useAppStore";
import { useVersionStore } from "../../store/useVersionStore";
import { getToolbarColors } from "../../styles/designToolsTokens";
import { CreationStepRow } from "./CreationStepRow";

/**
 * Content-only component that renders the creation step rows.
 * Meant to be placed inside a PageShell by the VersionedComponentLoader.
 */
export const CreatingVersionPage: React.FC = () => {
  const { colorMode } = useAppStore();
  const { euiTheme } = useEuiTheme();
  const colors = getToolbarColors(colorMode);

  const creatingVersionId = useVersionStore((s) => s.creatingVersionId);
  const creationSteps = useVersionStore((s) => s.creationSteps);
  const creationStepStatuses = useVersionStore((s) => s.creationStepStatuses);

  const titleStyle: React.CSSProperties = {
    fontSize: "clamp(1.5rem, 4vw, 1.875rem)",
    fontWeight: euiTheme.font.weight.semiBold,
    color: euiTheme.colors.textHeading,
    margin: `0 0 ${euiTheme.size.xl}`,
    lineHeight: 1.25,
    letterSpacing: "-0.02em",
  };

  return (
    <>
      <h1 style={titleStyle}>Setting up v{creatingVersionId}</h1>

      <div
        style={{
          width: "100%",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {creationSteps.map((step, i) => (
          <CreationStepRow
            key={i}
            status={creationStepStatuses[i] || "pending"}
            activeLabel={step.activeLabel}
            doneLabel={step.doneLabel}
            colors={colors}
          />
        ))}
      </div>
    </>
  );
};
