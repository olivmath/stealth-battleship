import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fullScreen, titleStyle, bodyStyle, codeStyle } from "../styles";

export const Architecture: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const deviceY = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 15 } });
  const stellarY = spring({ frame: Math.max(0, frame - 30), fps, config: { damping: 15 } });
  const convexY = spring({ frame: Math.max(0, frame - 30), fps, config: { damping: 15 } });
  const arrowOpacity = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: "clamp" });
  const p25Opacity = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp" });
  const badgeOpacity = interpolate(frame, [90, 110], [0, 1], { extrapolateRight: "clamp" });

  const boxStyle = (color: string, scale: number) => ({
    backgroundColor: colors.navyMid,
    borderRadius: 12,
    padding: 30,
    border: `2px solid ${color}`,
    transform: `scale(${scale})`,
    minWidth: 300,
  });

  return (
    <AbsoluteFill style={{ ...fullScreen, padding: 60 }}>
      <h2 style={{ ...titleStyle, fontSize: 42, opacity: titleOpacity }}>Architecture</h2>

      {/* Device layer */}
      <div style={{ ...boxStyle(colors.white, deviceY), marginTop: 30 }}>
        <p style={{ ...titleStyle, fontSize: 20 }}>PLAYER DEVICE</p>
        <p style={{ ...bodyStyle, fontSize: 16 }}>Noir Circuits (WASM) + Game Engine (TS)</p>
      </div>

      {/* Arrows */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 200,
          marginTop: 10,
          opacity: arrowOpacity,
        }}
      >
        <p style={{ ...codeStyle, fontSize: 16, color: colors.teal }}>proofs ↓</p>
        <p style={{ ...codeStyle, fontSize: 16, color: colors.fireOrange }}>↓ real-time turns</p>
      </div>

      {/* Bottom layer */}
      <div style={{ display: "flex", gap: 40, marginTop: 10 }}>
        <div style={boxStyle("#2845a0", stellarY)}>
          <p style={{ ...titleStyle, fontSize: 20, color: "#5b8def" }}>STELLAR (Soroban)</p>
          <p style={{ ...bodyStyle, fontSize: 16 }}>TX 1: open_match</p>
          <p style={{ ...bodyStyle, fontSize: 16 }}>TX 2: close_match</p>
          <p style={{ ...bodyStyle, fontSize: 16 }}>Escrow lock/release</p>
          <div
            style={{
              opacity: p25Opacity,
              marginTop: 12,
              padding: "6px 12px",
              backgroundColor: "#2845a0",
              borderRadius: 6,
            }}
          >
            <p style={{ ...codeStyle, fontSize: 14, color: colors.gold }}>
              Protocol 25: BN254 + Poseidon2
            </p>
          </div>
        </div>

        <div style={boxStyle("#7c3aed", convexY)}>
          <p style={{ ...titleStyle, fontSize: 20, color: "#a78bfa" }}>CONVEX (off-chain)</p>
          <p style={{ ...bodyStyle, fontSize: 16 }}>Matchmaking</p>
          <p style={{ ...bodyStyle, fontSize: 16 }}>Turn coordination</p>
          <p style={{ ...bodyStyle, fontSize: 16 }}>shot_proof verification</p>
          <p style={{ ...bodyStyle, fontSize: 14, color: colors.muted, marginTop: 12 }}>
            ~ms latency
          </p>
        </div>
      </div>

      <p
        style={{
          ...titleStyle,
          fontSize: 24,
          color: colors.teal,
          opacity: badgeOpacity,
          marginTop: 20,
          textAlign: "center",
        }}
      >
        Only 2 on-chain transactions per game
      </p>
    </AbsoluteFill>
  );
};
