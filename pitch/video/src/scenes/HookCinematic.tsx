import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { CONFIG } from "../config";
import { colors, fullScreen, fonts, textGlow } from "../styles";
import { RadarSweep } from "../components/effects/RadarSweep";
import { SonarParticles } from "../components/effects/SonarParticles";
import { GlitchText } from "../components/primitives/GlitchText";
import { ScaleIn } from "../components/primitives/ScaleIn";
import { FadeIn } from "../components/primitives/FadeIn";

const B = CONFIG.scenes.hookCinematic.blocks;

export const HookCinematic: React.FC = () => {
  const frame = useCurrentFrame();

  // Black silence phase
  const blackOpacity = interpolate(frame, [B.blackSilence.start, B.blackSilence.start + B.blackSilence.duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Ocean footage placeholder opacity
  const footageOpacity = interpolate(
    frame,
    [B.oceanFootage.start, B.oceanFootage.start + 15, B.logoReveal.start, B.logoReveal.start + 15],
    [0, 0.5, 0.5, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ ...fullScreen }}>
      <RadarSweep gridOpacity={0.03} showSweep={false} />
      <SonarParticles count={30} color={`${colors.teal}60`} />

      {/* Footage placeholder */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: colors.navyMid,
          opacity: footageOpacity,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: colors.muted, fontSize: 24, fontFamily: fonts.rajdhani }}>
          [ Dark Ocean — Warship Footage ]
        </span>
      </div>

      {/* Quote 1 */}
      {frame >= B.quoteWar.start && frame < B.quoteProve.start && (
        <GlitchText
          text={`"In war, information is power."`}
          startFrame={B.quoteWar.start}
          duration={B.quoteWar.duration}
          fontSize={44}
          color={colors.gold}
        />
      )}

      {/* Quote 2 */}
      {frame >= B.quoteProve.start && frame < B.logoReveal.start && (
        <div style={{ textAlign: "center" }}>
          <GlitchText
            text={`"But what if you could prove..."`}
            startFrame={B.quoteProve.start}
            duration={B.quoteProve.duration}
            fontSize={38}
            color={colors.gold}
          />
          <div style={{ marginTop: 10 }}>
            <GlitchText
              text="without revealing?"
              startFrame={B.quoteProve.start + 15}
              duration={B.quoteProve.duration - 15}
              fontSize={38}
              color={colors.gold}
            />
          </div>
        </div>
      )}

      {/* Logo reveal */}
      {frame >= B.logoReveal.start && (
        <>
          <ScaleIn startFrame={B.logoReveal.start}>
            <h1
              style={{
                fontFamily: fonts.orbitron,
                fontSize: 80,
                fontWeight: 700,
                color: colors.gold,
                margin: 0,
                ...textGlow(colors.gold, 30),
              }}
            >
              BATTLESHIP ZK
            </h1>
          </ScaleIn>
          <FadeIn startFrame={B.logoReveal.start + 15} duration={15}>
            <p
              style={{
                fontFamily: fonts.rajdhani,
                fontSize: 28,
                color: colors.teal,
                marginTop: 10,
              }}
            >
              Trustless Naval Warfare on Stellar
            </p>
          </FadeIn>
        </>
      )}

      {/* Black overlay for initial silence */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#000",
          opacity: blackOpacity,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
