import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fullScreen, titleStyle, bodyStyle } from "../styles";

const items = [
  "ZK IS the game — remove it, nothing works",
  "3 specialized Noir circuits",
  "Prove-as-you-go (no commit-reveal)",
  "Stellar Protocol 25 native primitives",
  "Production-quality mobile game",
  "Real-time gameplay + on-chain settlement",
];

export const Differentials: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...fullScreen, padding: 80 }}>
      <h2 style={{ ...titleStyle, fontSize: 42, opacity: titleOpacity }}>
        Why This Should Win
      </h2>

      <div style={{ marginTop: 40, width: "100%", maxWidth: 800 }}>
        {items.map((item, i) => {
          const itemScale = spring({
            frame: Math.max(0, frame - (i * 8 + 20)),
            fps,
            config: { damping: 12 },
          });
          const checkOpacity = interpolate(
            frame,
            [i * 8 + 25, i * 8 + 35],
            [0, 1],
            { extrapolateRight: "clamp" }
          );

          return (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 16,
                transform: `scale(${itemScale})`,
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  color: colors.gold,
                  opacity: checkOpacity,
                  minWidth: 36,
                }}
              >
                ✓
              </span>
              <p style={{ ...bodyStyle, fontSize: 24, margin: 0 }}>{item}</p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
