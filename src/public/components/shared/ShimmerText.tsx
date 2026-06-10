import React from "react";
import { useAppStore } from "../../store/useAppStore";
import { getToolbarColors } from "../../styles/designToolsTokens";

const keyframesInjected = { current: false };

function injectKeyframes() {
  if (keyframesInjected.current) return;
  keyframesInjected.current = true;
  const style = document.createElement("style");
  style.textContent = `@keyframes shimmer-sweep{0%{background-position:-100% 0}50%{background-position:0 0}100%{background-position:100% 0}}`;
  document.head.appendChild(style);
}

interface ShimmerTextProps {
  children: string;
  style?: React.CSSProperties;
}

export const ShimmerText: React.FC<ShimmerTextProps> = ({
  children,
  style,
}) => {
  const { colorMode } = useAppStore();
  const colors = getToolbarColors(colorMode);

  React.useEffect(() => {
    injectKeyframes();
  }, []);

  return (
    <span
      style={{
        background: `linear-gradient(90deg, ${colors.textMuted} 0%, ${colors.textSecondary} 50%, ${colors.textMuted} 100%)`,
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        animation: "shimmer-sweep 3s ease-in-out infinite",
        ...style,
      }}
    >
      {children}
    </span>
  );
};
