import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";

interface ScaleInProps {
  startFrame?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const ScaleIn: React.FC<ScaleInProps> = ({ startFrame = 0, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  return (
    <div style={{ transform: `scale(${scale})`, ...style }}>
      {children}
    </div>
  );
};
