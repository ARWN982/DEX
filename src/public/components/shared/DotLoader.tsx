import React from "react";

const DELAYS = [0, 0.3, 0.15, 0.45, 0.08, 0.6, 0.22, 0.52, 0.38];
const DURATIONS = [1.4, 1.1, 1.6, 1.3, 1.8, 1.0, 1.5, 1.2, 1.7];

const keyframesInjected = { current: false };

function injectKeyframes() {
  if (keyframesInjected.current) return;
  keyframesInjected.current = true;
  const style = document.createElement("style");
  style.textContent = `@keyframes braille-pulse{0%,100%{opacity:.15}50%{opacity:1}}`;
  document.head.appendChild(style);
}

interface DotLoaderProps {
  size?: "sm" | "md";
  dimmed?: boolean;
}

export const DotLoader: React.FC<DotLoaderProps> = ({
  size = "sm",
  dimmed = false,
}) => {
  React.useEffect(() => {
    injectKeyframes();
  }, []);

  const dotSize = size === "sm" ? 3 : 4;
  const gap = size === "sm" ? 2 : 3;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, auto)",
        gap,
        opacity: dimmed ? 0.3 : 1,
        transition: "opacity 0.3s ease",
      }}
    >
      {DELAYS.map((delay, i) => (
        <div
          key={i}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            backgroundColor: "currentColor",
            opacity: 0.15,
            animation: dimmed
              ? "none"
              : `braille-pulse ${DURATIONS[i]}s ease-in-out infinite`,
            animationDelay: dimmed ? undefined : `${delay}s`,
          }}
        />
      ))}
    </div>
  );
};
