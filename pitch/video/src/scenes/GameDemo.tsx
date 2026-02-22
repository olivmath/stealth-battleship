import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { CONFIG } from "../config";
import { colors, fullScreen, fonts, textGlow } from "../styles";
import { TypewriterText } from "../components/primitives/TypewriterText";
import { OverlayLabel } from "../components/ui/OverlayLabel";
import { PiPFrame } from "../components/ui/PiPFrame";
import { FadeIn } from "../components/primitives/FadeIn";

const B = CONFIG.scenes.gameDemo.blocks;

export const GameDemo: React.FC = () => {
  const frame = useCurrentFrame();

  // Phone frame zoom out at end
  const zoomScale = interpolate(
    frame,
    [B.zoomOut.start, B.zoomOut.start + B.zoomOut.duration],
    [1, 0.6],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const zoomOpacity = interpolate(
    frame,
    [B.zoomOut.start, B.zoomOut.start + B.zoomOut.duration],
    [1, 0.3],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ ...fullScreen }}>
      {/* "Let me show you" intro text */}
      {frame < B.placement.start && (
        <TypewriterText
          text="Let me show you."
          startFrame={B.letMeShow.start}
          charsPerFrame={0.8}
          style={{
            fontFamily: fonts.orbitron,
            fontSize: 48,
            color: colors.gold,
            ...textGlow(colors.gold, 15),
          }}
        />
      )}

      {/* Phone frame placeholder */}
      {frame >= B.placement.start && (
        <div
          style={{
            transform: `scale(${zoomScale})`,
            opacity: zoomOpacity,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 400,
              height: 700,
              border: `3px solid ${colors.muted}40`,
              borderRadius: 40,
              backgroundColor: colors.navyMid,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Notch */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 120,
                height: 24,
                backgroundColor: colors.navyDark,
                borderRadius: "0 0 16px 16px",
              }}
            />
            <span style={{ color: colors.muted, fontSize: 18, fontFamily: fonts.rajdhani }}>
              [ Screen Recording ]
            </span>
          </div>
        </div>
      )}

      {/* Overlay labels for each demo phase */}
      <OverlayLabel
        lines={["Ship Placement — drag & drop"]}
        startFrame={B.placement.start}
        duration={B.placement.duration}
        accentColor={colors.teal}
      />
      <OverlayLabel
        lines={["board_validity proof generating", "NoirJS + bb.js (client-side WASM)"]}
        startFrame={B.readyProof.start}
        duration={B.readyProof.duration}
        accentColor={colors.gold}
      />
      <OverlayLabel
        lines={["Soroban TX 1: open_match()", "Board hash committed on Stellar"]}
        startFrame={B.deployTx.start}
        duration={B.deployTx.duration}
        accentColor={colors.stellarBlue}
      />
      <OverlayLabel
        lines={["Player attacks — opponent proves response"]}
        startFrame={B.battle.start}
        duration={B.battle.duration}
        accentColor={colors.fireOrange}
      />
      <OverlayLabel
        lines={["shot_proof verified — result honest"]}
        startFrame={B.hitResult.start}
        duration={B.hitResult.duration}
        accentColor={colors.greenSafe}
      />
      <OverlayLabel
        lines={["turns_proof — Soroban TX 2: close()", "Winner settled. Escrow released."]}
        startFrame={B.gameOver.start}
        duration={B.gameOver.duration}
        accentColor={colors.gold}
      />

      <PiPFrame startFrame={B.placement.start + 15} />
    </AbsoluteFill>
  );
};
