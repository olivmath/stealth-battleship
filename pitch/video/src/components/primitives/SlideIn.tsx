import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

type Direction = "left" | "right" | "up" | "down";

interface SlideInProps {
  startFrame?: number;
  direction?: Direction;
  distance?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const getTransform = (direction: Direction, distance: number, progress: number) => {
  const offset = (1 - progress) * distance;
  switch (direction) {
    case "left":
      return `translateX(${-offset}px)`;
    case "right":
      return `translateX(${offset}px)`;
    case "up":
      return `translateY(${-offset}px)`;
    case "down":
      return `translateY(${offset}px)`;
  }
};

export const SlideIn: React.FC<SlideInProps> = ({
  startFrame = 0,
  direction = "left",
  distance = 100,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const opacity = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ opacity, transform: getTransform(direction, distance, progress), ...style }}>
      {children}
    </div>
  );
};
