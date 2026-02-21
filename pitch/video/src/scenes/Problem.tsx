import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { colors, fullScreen, titleStyle, bodyStyle } from "../styles";

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const leftOpacity = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: "clamp" });
  const rightOpacity = interpolate(frame, [90, 120], [0, 1], { extrapolateRight: "clamp" });
  const quoteOpacity = interpolate(frame, [150, 180], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...fullScreen, padding: 80 }}>
      <h2 style={{ ...titleStyle, fontSize: 48, opacity: titleOpacity, color: colors.redAlert }}>
        The Trust Problem
      </h2>

      <div style={{ display: "flex", gap: 60, marginTop: 40, width: "100%" }}>
        {/* Traditional */}
        <div
          style={{
            flex: 1,
            opacity: leftOpacity,
            backgroundColor: colors.navyMid,
            borderRadius: 12,
            padding: 30,
            border: `2px solid ${colors.redAlert}`,
          }}
        >
          <h3 style={{ ...titleStyle, fontSize: 24, color: colors.redAlert }}>Traditional</h3>
          <p style={{ ...bodyStyle, fontSize: 22, marginTop: 16 }}>Server sees both boards</p>
          <p style={{ ...bodyStyle, fontSize: 22 }}>Commit-reveal? Loser disconnects</p>
          <p style={{ ...bodyStyle, fontSize: 22 }}>On-chain? Mempool front-running</p>
        </div>

        {/* ZK */}
        <div
          style={{
            flex: 1,
            opacity: rightOpacity,
            backgroundColor: colors.navyMid,
            borderRadius: 12,
            padding: 30,
            border: `2px solid ${colors.greenSafe}`,
          }}
        >
          <h3 style={{ ...titleStyle, fontSize: 24, color: colors.greenSafe }}>Battleship ZK</h3>
          <p style={{ ...bodyStyle, fontSize: 22, marginTop: 16 }}>No one sees your board</p>
          <p style={{ ...bodyStyle, fontSize: 22 }}>Every move proven with ZK</p>
          <p style={{ ...bodyStyle, fontSize: 22 }}>Not even after game ends</p>
        </div>
      </div>

      <p
        style={{
          ...titleStyle,
          fontSize: 32,
          color: colors.gold,
          opacity: quoteOpacity,
          marginTop: 40,
          textAlign: "center",
        }}
      >
        "Trust me" is not a game mechanic.
      </p>
    </AbsoluteFill>
  );
};
