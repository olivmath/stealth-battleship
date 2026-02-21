import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fullScreen, titleStyle, subtitleStyle } from "../styles";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 12 } });
  const taglineOpacity = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: "clamp" });
  const creditOpacity = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={fullScreen}>
      {/* Radar grid background */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: 0.1,
          backgroundImage: `
            linear-gradient(${colors.teal} 1px, transparent 1px),
            linear-gradient(90deg, ${colors.teal} 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <h1
        style={{
          ...titleStyle,
          fontSize: 80,
          transform: `scale(${titleScale})`,
          textShadow: `0 0 40px ${colors.gold}40`,
        }}
      >
        BATTLESHIP ZK
      </h1>

      <p
        style={{
          ...subtitleStyle,
          fontSize: 36,
          opacity: taglineOpacity,
          marginTop: 20,
        }}
      >
        Trustless Naval Warfare on Stellar
      </p>

      <p
        style={{
          color: colors.muted,
          fontSize: 20,
          opacity: creditOpacity,
          marginTop: 60,
          fontFamily: "'Rajdhani', sans-serif",
        }}
      >
        Stellar Hacks: ZK Gaming 2026 — olivmath
      </p>
    </AbsoluteFill>
  );
};
