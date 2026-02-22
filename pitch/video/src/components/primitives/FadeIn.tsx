import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface FadeInProps {
  startFrame?: number;
  duration?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const FadeIn: React.FC<FadeInProps> = ({
  startFrame = 0,
  duration = 20,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return <div style={{ opacity, ...style }}>{children}</div>;
};
