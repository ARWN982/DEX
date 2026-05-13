import { Check } from "phosphor-react";
import React, { useState, useEffect, useRef } from "react";
import { getToolbarColors } from "../../styles/designToolsTokens";
import { useScrambleText } from "../../hooks/useScrambleText";
import { DotLoader } from "./DotLoader";
import { ShimmerText } from "./ShimmerText";

export type StepStatus = "pending" | "active" | "complete";

export interface StepConfig {
  activeLabel: string;
  doneLabel: string;
}

interface CreationStepRowProps {
  status: StepStatus;
  activeLabel: string;
  doneLabel: string;
  colors: ReturnType<typeof getToolbarColors>;
}

export const CreationStepRow: React.FC<CreationStepRowProps> = ({
  status,
  activeLabel,
  doneLabel,
  colors,
}) => {
  const [shouldScramble, setShouldScramble] = useState(false);
  const prevStatusRef = useRef<StepStatus>(status);

  useEffect(() => {
    if (prevStatusRef.current === "active" && status === "complete") {
      setShouldScramble(true);
    }
    prevStatusRef.current = status;
  }, [status]);

  const scrambledText = useScrambleText(doneLabel, shouldScramble);

  const iconContainerStyle: React.CSSProperties = {
    width: 20,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: status === "complete" ? colors.success : colors.textMuted,
    transition: "color 0.3s ease",
  };

  const textStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: "500",
    fontFamily: "monospace",
    letterSpacing: "-0.01em",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 0",
        opacity: status === "pending" ? 0.4 : 1,
        transition: "opacity 0.3s ease",
      }}
    >
      <div style={iconContainerStyle}>
        {status === "complete" ? (
          <Check size={16} weight="bold" />
        ) : (
          <DotLoader size="sm" dimmed={status === "pending"} />
        )}
      </div>
      <div style={textStyle}>
        {status === "active" && <ShimmerText>{activeLabel}</ShimmerText>}
        {status === "complete" && (
          <span style={{ color: colors.textPrimary }}>{scrambledText}</span>
        )}
        {status === "pending" && (
          <span style={{ color: colors.textMuted }}>{activeLabel}</span>
        )}
      </div>
    </div>
  );
};
