import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { colors, fullScreen, titleStyle, bodyStyle } from "../styles";

const steps = [
  { time: "0s", label: "Ship Placement", detail: "Drag & drop on 6x6 grid", icon: "🚢" },
  { time: "5s", label: "Securing Fleet", detail: "board_validity proof (NoirJS/WASM)", icon: "🔒" },
  { time: "10s", label: "On-Chain", detail: "Soroban open_match() — TX 1", icon: "⛓" },
  { time: "12s", label: "Battle", detail: "Tap to attack → shot_proof per turn", icon: "💥" },
  { time: "18s", label: "Game Over", detail: "turns_proof → close_match() — TX 2", icon: "🏆" },
];

export const Gameplay: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...fullScreen, padding: 80 }}>
      <h2 style={{ ...titleStyle, fontSize: 42, opacity: titleOpacity, color: colors.gold }}>
        Gameplay Flow
      </h2>

      {/* TODO: Replace with actual screen recording StaticFile */}
      <div
        style={{
          display: "flex",
          gap: 40,
          marginTop: 40,
          width: "100%",
        }}
      >
        {/* Screen recording placeholder */}
        <div
          style={{
            flex: 1,
            backgroundColor: colors.navyMid,
            borderRadius: 16,
            border: `2px solid ${colors.gold}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 500,
          }}
        >
          <p style={{ ...bodyStyle, fontSize: 24, color: colors.muted }}>
            [ Screen Recording Here ]
          </p>
        </div>

        {/* Timeline */}
        <div style={{ flex: 1 }}>
          {steps.map((step, i) => {
            const stepOpacity = interpolate(
              frame,
              [20 + i * 12, 32 + i * 12],
              [0, 1],
              { extrapolateRight: "clamp" }
            );
            return (
              <div
                key={step.label}
                style={{
                  opacity: stepOpacity,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 20,
                  padding: "12px 20px",
                  backgroundColor: colors.navyMid,
                  borderRadius: 8,
                  borderLeft: `3px solid ${colors.teal}`,
                }}
              >
                <span style={{ fontSize: 32 }}>{step.icon}</span>
                <div>
                  <p style={{ ...titleStyle, fontSize: 20, color: colors.gold }}>{step.label}</p>
                  <p style={{ ...bodyStyle, fontSize: 16, color: colors.muted }}>{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
