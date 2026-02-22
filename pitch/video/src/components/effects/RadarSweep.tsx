import React from "react";
import { useCurrentFrame } from "remotion";
import { colors } from "../../styles";

interface RadarSweepProps {
  gridSpacing?: number;
  gridColor?: string;
  gridOpacity?: number;
  showSweep?: boolean;
  sweepColor?: string;
}

export const RadarSweep: React.FC<RadarSweepProps> = ({
  gridSpacing = 60,
  gridColor = colors.teal,
  gridOpacity = 0.05,
  showSweep = true,
  sweepColor = colors.teal,
}) => {
  const frame = useCurrentFrame();
  const angle = (frame * 3) % 360;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Grid lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${gridColor}${Math.round(gridOpacity * 255).toString(16).padStart(2, "0")} 1px, transparent 1px),
            linear-gradient(90deg, ${gridColor}${Math.round(gridOpacity * 255).toString(16).padStart(2, "0")} 1px, transparent 1px)
          `,
          backgroundSize: `${gridSpacing}px ${gridSpacing}px`,
        }}
      />

      {/* Sweep line */}
      {showSweep && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "150%",
            height: 2,
            background: `linear-gradient(90deg, transparent, ${sweepColor}60, ${sweepColor}, ${sweepColor}60, transparent)`,
            transformOrigin: "0 50%",
            transform: `rotate(${angle}deg)`,
          }}
        />
      )}

      {/* Center dot */}
      {showSweep && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: sweepColor,
            transform: "translate(-50%, -50%)",
            boxShadow: `0 0 10px ${sweepColor}`,
          }}
        />
      )}
    </div>
  );
};
