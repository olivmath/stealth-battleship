import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { CONFIG } from "../config";
import { colors, fullScreen, fonts, textGlow } from "../styles";
import { SlideIn } from "../components/primitives/SlideIn";
import { FadeIn } from "../components/primitives/FadeIn";
import { PiPFrame } from "../components/ui/PiPFrame";

const B = CONFIG.scenes.problemSplit.blocks;

const PanelSide: React.FC<{
  title: string;
  icon: string;
  label: string;
  borderColor: string;
  boardLabel: string;
}> = ({ title, icon, label, borderColor, boardLabel }) => (
  <div
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
      padding: 40,
      border: `3px solid ${borderColor}`,
      borderRadius: 16,
      margin: 10,
    }}
  >
    <h3 style={{ fontFamily: fonts.orbitron, fontSize: 26, color: colors.white, margin: 0 }}>
      {title}
    </h3>
    <span style={{ fontSize: 48 }}>{icon}</span>
    <div style={{ display: "flex", gap: 20 }}>
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            width: 100,
            height: 80,
            border: `2px solid ${borderColor}40`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonts.rajdhani,
            fontSize: 16,
            color: colors.muted,
          }}
        >
          {boardLabel}
        </div>
      ))}
    </div>
    <p style={{ fontFamily: fonts.rajdhani, fontSize: 20, color: colors.white, margin: 0 }}>
      {label}
    </p>
  </div>
);

export const ProblemSplit: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Explosion: left side shrinks to 0
  const explosionScale = interpolate(
    frame,
    [B.explosion.start, B.explosion.start + B.explosion.duration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Right side expands
  const expandProgress = spring({
    frame: Math.max(0, frame - B.zkExpand.start),
    fps,
    config: { damping: 15 },
  });

  const showSplit = frame < B.zkExpand.start + 15;
  const showZkText = frame >= B.zkExpand.start;

  return (
    <AbsoluteFill style={{ ...fullScreen, padding: 60 }}>
      {showSplit && (
        <div style={{ display: "flex", width: "100%", maxWidth: 1200, gap: 0 }}>
          {/* Left: Traditional */}
          <SlideIn startFrame={0} direction="left" distance={200}>
            <div style={{ transform: `scale(${explosionScale})`, opacity: explosionScale }}>
              <PanelSide
                title="TRADITIONAL BATTLESHIP"
                icon="👁"
                label={`"Server sees everything"`}
                borderColor={colors.redAlert}
                boardLabel="BOARD"
              />
            </div>
          </SlideIn>

          {/* Right: ZK */}
          <SlideIn startFrame={0} direction="right" distance={200}>
            <PanelSide
              title="BATTLESHIP ZK"
              icon="🔒"
              label={`"No one sees your board"`}
              borderColor={colors.greenSafe}
              boardLabel="???"
            />
          </SlideIn>
        </div>
      )}

      {/* ZK expand text */}
      {showZkText && (
        <FadeIn startFrame={B.zkExpand.start + 5} duration={20}>
          <h2
            style={{
              fontFamily: fonts.orbitron,
              fontSize: 52,
              color: colors.teal,
              margin: 0,
              textAlign: "center",
              ...textGlow(colors.teal, 20),
            }}
          >
            Zero Knowledge. Full Privacy.
          </h2>
        </FadeIn>
      )}

      <PiPFrame startFrame={B.splitAppear.start + 30} />
    </AbsoluteFill>
  );
};
