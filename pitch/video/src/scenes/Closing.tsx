import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fullScreen, titleStyle, subtitleStyle } from "../styles";

export const Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12 } });
  const taglineOpacity = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: "clamp" });
  const linksOpacity = interpolate(frame, [50, 80], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={fullScreen}>
      {/* Radar sweep background */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: 0.05,
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
          fontSize: 72,
          transform: `scale(${logoScale})`,
          textShadow: `0 0 60px ${colors.gold}40`,
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
        "Fair by math. Fun by design."
      </p>

      <div style={{ opacity: linksOpacity, marginTop: 60, textAlign: "center" }}>
        <p style={{ color: colors.muted, fontSize: 22, fontFamily: "'Rajdhani', sans-serif" }}>
          github.com/olivmath/battleship-zk
        </p>
        <p
          style={{
            color: colors.muted,
            fontSize: 16,
            fontFamily: "'Rajdhani', sans-serif",
            marginTop: 40,
          }}
        >
          Stellar · Noir · Convex · olivmath
        </p>
        <p
          style={{
            color: colors.muted,
            fontSize: 14,
            fontFamily: "'Rajdhani', sans-serif",
            marginTop: 8,
          }}
        >
          Built for Stellar Hacks: ZK Gaming 2026
        </p>
      </div>
    </AbsoluteFill>
  );
};
