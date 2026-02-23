import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { CONFIG } from "../config";
import { colors, sceneContainer, fonts, textGlow } from "../styles";
import { RadarSweep } from "../components/effects/RadarSweep";
import { ScaleIn } from "../components/primitives/ScaleIn";
import { TypewriterText } from "../components/primitives/TypewriterText";
import { FadeIn } from "../components/primitives/FadeIn";

const B = CONFIG.scenes.closingEpic.blocks;

export const ClosingEpic: React.FC = () => {
  const frame = useCurrentFrame();

  // Footage placeholder fade
  const footageFade = interpolate(frame, [B.footage.start, B.footage.start + B.footage.duration], [0.4, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ ...sceneContainer, justifyContent: "center" }}>
      <RadarSweep gridOpacity={0.04} showSweep={false} />

      {/* Footage placeholder */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: colors.navyMid,
          opacity: footageFade,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: colors.muted, fontSize: 24, fontFamily: fonts.rajdhani }}>
          [ Naval Fleet — Sunset Footage ]
        </span>
      </div>

      {/* Logo */}
      <ScaleIn startFrame={B.logoReveal.start}>
        <h1
          style={{
            fontFamily: fonts.orbitron,
            fontSize: 72,
            fontWeight: 700,
            color: colors.gold,
            margin: 0,
            ...textGlow(colors.gold, 30),
          }}
        >
          BATTLESHIP ZK
        </h1>
      </ScaleIn>

      {/* Tagline */}
      <div style={{ marginTop: 30 }}>
        <TypewriterText
          text="Fair by math. Fun by design."
          startFrame={B.tagline.start}
          charsPerFrame={0.6}
          style={{
            fontFamily: fonts.orbitron,
            fontSize: 32,
            color: colors.white,
          }}
        />
      </div>

      {/* Links */}
      <FadeIn startFrame={B.links.start} duration={20} style={{ marginTop: 50, textAlign: "center" }}>
        <p style={{ fontFamily: fonts.rajdhani, fontSize: 22, color: colors.muted, margin: "4px 0" }}>
          github.com/olivmath/battleship-zk
        </p>
        <p style={{ fontFamily: fonts.rajdhani, fontSize: 18, color: colors.muted, margin: "4px 0" }}>
          Stellar Testnet | Noir + UltraHonk
        </p>
      </FadeIn>

      {/* Partner logos */}
      <FadeIn startFrame={B.partnerLogos.start} duration={20} style={{ marginTop: 30 }}>
        <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
          {["Stellar", "Noir", "Convex"].map((name) => (
            <div
              key={name}
              style={{
                padding: "8px 24px",
                border: `1px solid ${colors.muted}40`,
                borderRadius: 8,
                fontFamily: fonts.rajdhani,
                fontSize: 20,
                color: colors.muted,
              }}
            >
              {name}
            </div>
          ))}
        </div>
        <p style={{ fontFamily: fonts.rajdhani, fontSize: 16, color: colors.muted, marginTop: 20, textAlign: "center" }}>
          Built for Stellar Hacks 2026
        </p>
      </FadeIn>
    </AbsoluteFill>
  );
};
