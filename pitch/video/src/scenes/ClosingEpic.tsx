import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { CONFIG } from "../config";
import { colors, sceneContainer, fonts, textGlow } from "../styles";
import { RadarSweep } from "../components/effects/RadarSweep";
import { SonarParticles } from "../components/effects/SonarParticles";
import { ScaleIn } from "../components/primitives/ScaleIn";
import { FadeIn } from "../components/primitives/FadeIn";
import { TypewriterText } from "../components/primitives/TypewriterText";

const B = CONFIG.scenes.closingEpic.blocks;

/** Corner bracket — HUD frame element (from slides NavalSlide) */
const Corner: React.FC<{
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  opacity: number;
}> = ({ position, opacity }) => {
  const size = 28;
  const thickness = 2;
  const offset = 20;
  const color = "rgba(0, 212, 170, 0.25)";

  const isTop = position.includes("top");
  const isLeft = position.includes("left");

  return (
    <div
      style={{
        position: "absolute",
        top: isTop ? offset : "auto",
        bottom: !isTop ? offset : "auto",
        left: isLeft ? offset : "auto",
        right: !isLeft ? offset : "auto",
        width: size,
        height: size,
        borderTop: isTop ? `${thickness}px solid ${color}` : "none",
        borderBottom: !isTop ? `${thickness}px solid ${color}` : "none",
        borderLeft: isLeft ? `${thickness}px solid ${color}` : "none",
        borderRight: !isLeft ? `${thickness}px solid ${color}` : "none",
        pointerEvents: "none",
        opacity,
        zIndex: 3,
      }}
    />
  );
};

export const ClosingEpic: React.FC = () => {
  const frame = useCurrentFrame();

  // Footage placeholder fade (first block)
  const footageFade = interpolate(
    frame,
    [B.footage.start, B.footage.start + B.footage.duration],
    [0.4, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Scanlines fade in from logo reveal
  const scanlinesOpacity = interpolate(
    frame,
    [B.logoReveal.start, B.logoReveal.start + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Radar sweep (conic gradient)
  const radarOpacity = interpolate(
    frame,
    [B.logoReveal.start, B.logoReveal.start + 15],
    [0, 0.12],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const radarAngle =
    frame >= B.logoReveal.start
      ? ((frame - B.logoReveal.start) * 4) % 360
      : 0;

  // Corner brackets
  const cornersOpacity = interpolate(
    frame,
    [B.logoReveal.start + 5, B.logoReveal.start + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Teal divider line width
  const dividerWidth = interpolate(
    frame,
    [B.tagline.start, B.tagline.start + 15],
    [0, 200],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Badges opacity
  const badgesOpacity = interpolate(
    frame,
    [B.links.start, B.links.start + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Event info
  const eventOpacity = interpolate(
    frame,
    [B.partnerLogos.start, B.partnerLogos.start + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ ...sceneContainer, justifyContent: "center" }}>
      <RadarSweep gridOpacity={0.04} showSweep={false} />
      <SonarParticles count={25} color={`${colors.teal}50`} />

      {/* Scanlines overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 212, 170, 0.015) 2px,
            rgba(0, 212, 170, 0.015) 4px
          )`,
          opacity: scanlinesOpacity,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Radar sweep (conic gradient) */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 700,
          height: 700,
          marginTop: -350,
          marginLeft: -350,
          borderRadius: "50%",
          background: `conic-gradient(from ${radarAngle}deg, transparent 0deg, rgba(0, 212, 170, 0.4) 15deg, transparent 60deg)`,
          opacity: radarOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Corner brackets HUD frame */}
      <Corner position="top-left" opacity={cornersOpacity} />
      <Corner position="top-right" opacity={cornersOpacity} />
      <Corner position="bottom-left" opacity={cornersOpacity} />
      <Corner position="bottom-right" opacity={cornersOpacity} />

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
        <span
          style={{
            color: colors.muted,
            fontSize: 24,
            fontFamily: fonts.rajdhani,
          }}
        >
          [ Naval Fleet — Sunset Footage ]
        </span>
      </div>

      {/* ═══ Slide Cover Content ═══ */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          zIndex: 2,
        }}
      >
        {/* Main title */}
        <ScaleIn startFrame={B.logoReveal.start}>
          <h1
            style={{
              fontFamily: fonts.orbitron,
              fontSize: 80,
              fontWeight: 700,
              color: colors.gold,
              margin: 0,
              letterSpacing: 6,
              ...textGlow(colors.gold, 30),
            }}
          >
            STEALTH BATTLESHIP
          </h1>
        </ScaleIn>

        {/* Teal divider line */}
        <div
          style={{
            width: dividerWidth,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${colors.teal}, transparent)`,
            margin: "20px 0",
          }}
        />

        {/* Tagline (typewriter) */}
        <TypewriterText
          text="Fair by math. Fun by design."
          startFrame={B.tagline.start}
          charsPerFrame={0.6}
          style={{
            fontFamily: fonts.orbitron,
            fontSize: 32,
            color: colors.white,
            letterSpacing: 2,
            textShadow: `0 0 10px rgba(0, 212, 170, 0.5), 0 0 30px rgba(0, 212, 170, 0.2)`,
          }}
        />

        {/* GitHub link */}
        <FadeIn
          startFrame={B.links.start}
          duration={20}
          style={{ marginTop: 32 }}
        >
          <p
            style={{
              fontFamily: fonts.rajdhani,
              fontSize: 20,
              color: "#6b7fa0",
              margin: 0,
            }}
          >
            github.com/olivmath/battleship-zk
          </p>
        </FadeIn>

        {/* Partner badges */}
        <div
          style={{
            display: "flex",
            gap: 40,
            marginTop: 36,
            alignItems: "center",
            opacity: badgesOpacity,
          }}
        >
          {["STELLAR", "NOIR", "SUPABASE"].map((name) => (
            <div
              key={name}
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 13,
                color: colors.muted,
                border: "1px solid rgba(0, 212, 170, 0.12)",
                padding: "8px 22px",
                letterSpacing: 2,
              }}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Event + author */}
        <div
          style={{
            marginTop: 40,
            opacity: eventOpacity,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 14,
              color: colors.muted,
              letterSpacing: 1,
            }}
          >
            Stellar Hacks: ZK Gaming 2026
          </span>
          <span
            style={{
              fontFamily: fonts.rajdhani,
              fontSize: 18,
              color: "#6b7fa0",
            }}
          >
            olivmath
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
