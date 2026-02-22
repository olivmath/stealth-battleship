import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { fonts, colors } from "../../styles";

interface OverlayLabelProps {
  lines: string[];
  startFrame?: number;
  duration?: number;
  accentColor?: string;
  position?: "top" | "bottom";
  style?: React.CSSProperties;
}

export const OverlayLabel: React.FC<OverlayLabelProps> = ({
  lines,
  startFrame = 0,
  duration = 90,
  accentColor = colors.teal,
  position = "top",
  style,
}) => {
  const frame = useCurrentFrame();

  const slideIn = interpolate(frame, [startFrame, startFrame + 15], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const slideOut = interpolate(
    frame,
    [startFrame + duration - 15, startFrame + duration],
    [0, 100],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const offset = frame < startFrame + duration - 15 ? slideIn : slideOut;

  const opacity = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (frame < startFrame || frame > startFrame + duration) return null;

  return (
    <div
      style={{
        position: "absolute",
        [position === "top" ? "top" : "bottom"]: 40,
        right: 40,
        transform: `translateX(${offset}%)`,
        opacity,
        backgroundColor: `${colors.navyDark}cc`,
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: 8,
        padding: "12px 20px",
        maxWidth: 500,
        ...style,
      }}
    >
      {lines.map((line, i) => (
        <p
          key={i}
          style={{
            fontFamily: fonts.rajdhani,
            fontSize: i === 0 ? 22 : 18,
            color: i === 0 ? colors.white : colors.muted,
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {line}
        </p>
      ))}
    </div>
  );
};
