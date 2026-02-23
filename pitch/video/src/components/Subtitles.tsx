import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { FPS, SUBTITLES } from "../config";
import { fonts, colors } from "../styles";

export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const currentSecond = frame / FPS;

  const active = SUBTITLES.find(
    (s) => currentSecond >= s.from && currentSecond < s.to
  );

  if (!active) return null;

  const startFrame = active.from * FPS;
  const endFrame = active.to * FPS;

  // Fade in over 8 frames, fade out over 8 frames
  const fadeIn = interpolate(frame, [startFrame, startFrame + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [endFrame - 8, endFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  // Slight slide up on enter
  const slideY = interpolate(frame, [startFrame, startFrame + 10], [6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 28,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        opacity,
        transform: `translateY(${slideY}px)`,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          padding: "10px 32px",
          borderRadius: 8,
          maxWidth: 1200,
          border: `1px solid ${colors.muted}25`,
        }}
      >
        <p
          style={{
            fontFamily: fonts.rajdhani,
            fontSize: 28,
            fontWeight: 600,
            color: colors.white,
            margin: 0,
            textAlign: "center",
            lineHeight: 1.3,
            letterSpacing: "0.02em",
          }}
        >
          {active.text}
        </p>
      </div>
    </div>
  );
};
