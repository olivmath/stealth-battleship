import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fullScreen, titleStyle, bodyStyle, codeStyle } from "../styles";

const circuits = [
  {
    name: "board_validity",
    subtitle: "Prove your board is legal",
    details: ["Valid sizes", "No overlaps", "Within bounds"],
    badge: "Generated once (~2-5s)",
    delay: 0,
  },
  {
    name: "shot_proof",
    subtitle: "Prove every hit/miss is honest",
    details: ["Hash matches", "Result matches cell"],
    badge: "Generated per turn (~1-2s)",
    delay: 300,
  },
  {
    name: "turns_proof",
    subtitle: "Prove the entire game was fair",
    details: ["Full replay", "Winner in-circuit"],
    badge: "Settles on-chain",
    delay: 600,
  },
];

export const Circuits: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...fullScreen, padding: 60 }}>
      <h2 style={{ ...titleStyle, fontSize: 42, opacity: titleOpacity, color: colors.teal }}>
        3 Noir Circuits
      </h2>

      <div style={{ display: "flex", gap: 30, marginTop: 40 }}>
        {circuits.map((c, i) => {
          const cardScale = spring({
            frame: Math.max(0, frame - (i * 10 + 15)),
            fps,
            config: { damping: 12 },
          });
          return (
            <div
              key={c.name}
              style={{
                flex: 1,
                backgroundColor: colors.navyMid,
                borderRadius: 12,
                padding: 30,
                border: `1px solid ${colors.teal}`,
                transform: `scale(${cardScale})`,
              }}
            >
              <p style={{ ...codeStyle, fontSize: 22, color: colors.gold }}>{c.name}</p>
              <p style={{ ...bodyStyle, fontSize: 20, color: colors.teal, marginTop: 8 }}>
                {c.subtitle}
              </p>
              <div style={{ marginTop: 16 }}>
                {c.details.map((d) => (
                  <p key={d} style={{ ...bodyStyle, fontSize: 18, margin: "4px 0" }}>
                    {d}
                  </p>
                ))}
              </div>
              <p
                style={{
                  ...bodyStyle,
                  fontSize: 14,
                  color: colors.muted,
                  marginTop: 16,
                  padding: "4px 8px",
                  backgroundColor: `${colors.navyDark}`,
                  borderRadius: 4,
                  display: "inline-block",
                }}
              >
                {c.badge}
              </p>
            </div>
          );
        })}
      </div>

      <p
        style={{
          ...bodyStyle,
          fontSize: 20,
          color: colors.muted,
          marginTop: 30,
          textAlign: "center",
          opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        Private inputs NEVER leave the device.
      </p>
    </AbsoluteFill>
  );
};
