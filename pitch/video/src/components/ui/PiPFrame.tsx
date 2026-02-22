import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "../../styles";

interface PiPFrameProps {
  startFrame?: number;
  size?: number;
  children?: React.ReactNode;
}

export const PiPFrame: React.FC<PiPFrameProps> = ({
  startFrame = 0,
  size = 200,
  children,
}) => {
  const frame = useCurrentFrame();

  const slideIn = interpolate(frame, [startFrame, startFrame + 20], [size + 40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (frame < startFrame) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        right: 40,
        width: size,
        height: size,
        borderRadius: 12,
        border: `2px solid ${colors.muted}40`,
        backgroundColor: colors.navyMid,
        overflow: "hidden",
        transform: `translateX(${slideIn}px)`,
        boxShadow: `0 4px 20px ${colors.navyDark}80`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children || (
        <span style={{ color: colors.muted, fontSize: 14 }}>PiP</span>
      )}
    </div>
  );
};
