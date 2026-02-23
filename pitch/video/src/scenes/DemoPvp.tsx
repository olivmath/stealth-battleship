import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { CONFIG } from "../config";
import { colors, fonts, textGlow, sceneContainer, titleBlock, contentZone, footerZone } from "../styles";
import { TypewriterText } from "../components/primitives/TypewriterText";
import { FadeIn } from "../components/primitives/FadeIn";
import { ScaleIn } from "../components/primitives/ScaleIn";
import { SlideIn } from "../components/primitives/SlideIn";
import { Badge } from "../components/ui/Badge";
import { OverlayLabel } from "../components/ui/OverlayLabel";

const B = CONFIG.scenes.demoPvp.blocks;

/* ── Phone mockup ── */
const PhoneMockup: React.FC<{
  label: string;
  color: string;
  screenLabel: string;
  side: "left" | "right";
}> = ({ label, color, screenLabel, side }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
    }}
  >
    <p
      style={{
        fontFamily: fonts.orbitron,
        fontSize: 18,
        fontWeight: 700,
        color,
        margin: 0,
        ...textGlow(color, 8),
      }}
    >
      {label}
    </p>
    <div
      style={{
        width: 320,
        height: 560,
        border: `3px solid ${color}40`,
        borderRadius: 36,
        backgroundColor: colors.navyMid,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 0 40px ${color}15, inset 0 0 60px ${colors.navyDark}80`,
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 100,
          height: 20,
          backgroundColor: colors.navyDark,
          borderRadius: "0 0 12px 12px",
        }}
      />
      {/* Status bar indicator */}
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 20,
          right: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontFamily: fonts.rajdhani, fontSize: 11, color: colors.muted }}>
          {side === "left" ? "9:41" : "9:41"}
        </span>
        <span style={{ fontFamily: fonts.rajdhani, fontSize: 11, color }}>
          {label}
        </span>
      </div>
      <span style={{ color: colors.muted, fontSize: 16, fontFamily: fonts.rajdhani }}>
        {screenLabel}
      </span>
    </div>
  </div>
);

/* ── Animated connection line between phones ── */
const ConnectionPulse: React.FC<{ active: boolean }> = ({ active }) => {
  const frame = useCurrentFrame();
  const pulse = 0.4 + Math.sin(frame * 0.15) * 0.3;

  if (!active) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        width: 160,
      }}
    >
      {/* Connection line with pulse */}
      <div
        style={{
          width: "100%",
          height: 2,
          backgroundColor: `${colors.teal}${Math.round(pulse * 255).toString(16).padStart(2, "0")}`,
          boxShadow: `0 0 12px ${colors.teal}60`,
          position: "relative",
        }}
      >
        {/* Traveling dot */}
        <div
          style={{
            position: "absolute",
            top: -4,
            left: `${((frame * 3) % 160)}px`,
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: colors.teal,
            boxShadow: `0 0 8px ${colors.teal}`,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: fonts.rajdhani,
          fontSize: 14,
          color: colors.teal,
          opacity: pulse + 0.3,
        }}
      >
        Socket.io
      </span>
    </div>
  );
};

export const DemoPvp: React.FC = () => {
  const frame = useCurrentFrame();

  const showPhones = frame >= B.bothPhones.start;
  const showConnection = frame >= B.matchmaking.start;

  // Zoom out at end
  const zoomScale = interpolate(
    frame,
    [B.zoomOut.start, B.zoomOut.start + B.zoomOut.duration],
    [1, 0.65],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const zoomOpacity = interpolate(
    frame,
    [B.zoomOut.start, B.zoomOut.start + B.zoomOut.duration],
    [1, 0.3],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Screen labels change with phase
  let aliceScreen = "[ Screen Recording ]";
  let bobScreen = "[ Screen Recording ]";
  if (frame >= B.aliceAttacks.start) {
    aliceScreen = "[ Attacking... ]";
    bobScreen = "[ Generating proof... ]";
  }
  if (frame >= B.bobResponds.start) {
    aliceScreen = "[ Waiting result... ]";
    bobScreen = "[ Proof sent ]";
  }
  if (frame >= B.proofVerify.start) {
    aliceScreen = "[ HIT! ]";
    bobScreen = "[ Verified on-chain ]";
  }

  return (
    <AbsoluteFill style={sceneContainer}>
      {/* Intro text */}
      {frame < B.bothPhones.start && (
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <TypewriterText
            text="Now let's see real-time PvP."
            startFrame={B.intro.start}
            charsPerFrame={0.8}
            style={{
              fontFamily: fonts.orbitron,
              fontSize: 44,
              color: colors.fireOrange,
              ...textGlow(colors.fireOrange, 15),
            }}
          />
        </div>
      )}

      {/* Title */}
      {showPhones && (
        <FadeIn startFrame={B.bothPhones.start} duration={15}>
          <div style={titleBlock}>
            <p style={{ fontFamily: fonts.orbitron, fontSize: 20, color: colors.fireOrange, margin: 0 }}>
              PVP MODE
            </p>
            <h2
              style={{
                fontFamily: fonts.orbitron,
                fontSize: 36,
                color: colors.gold,
                margin: "4px 0 0",
                ...textGlow(colors.gold, 12),
              }}
            >
              Real-Time Multiplayer
            </h2>
          </div>
        </FadeIn>
      )}

      {/* Two phones side by side */}
      {showPhones && (
        <div
          style={{
            ...contentZone,
            gap: 0,
            transform: `scale(${zoomScale})`,
            opacity: zoomOpacity,
          }}
        >
          <SlideIn startFrame={B.bothPhones.start} direction="left" distance={80}>
            <PhoneMockup
              label="ALICE"
              color={colors.teal}
              screenLabel={aliceScreen}
              side="left"
            />
          </SlideIn>

          <div style={{ display: "flex", alignItems: "center", padding: "0 20px" }}>
            <ConnectionPulse active={showConnection} />
          </div>

          <SlideIn startFrame={B.bothPhones.start + 5} direction="right" distance={80}>
            <PhoneMockup
              label="BOB"
              color={colors.gold}
              screenLabel={bobScreen}
              side="right"
            />
          </SlideIn>
        </div>
      )}

      {/* Footer badge */}
      {frame >= B.proofVerify.start && frame < B.zoomOut.start && (
        <div style={footerZone}>
          <ScaleIn startFrame={B.proofVerify.start}>
            <Badge
              label="Two devices, zero trust, pure math"
              style={{ fontSize: 20, padding: "12px 28px" }}
            />
          </ScaleIn>
        </div>
      )}

      {/* Overlay labels */}
      <OverlayLabel
        lines={["Matchmaking via join code"]}
        startFrame={B.matchmaking.start}
        duration={B.matchmaking.duration}
        accentColor={colors.teal}
      />
      <OverlayLabel
        lines={["Alice attacks — tap to fire"]}
        startFrame={B.aliceAttacks.start}
        duration={B.aliceAttacks.duration}
        accentColor={colors.fireOrange}
      />
      <OverlayLabel
        lines={["Bob generates shot_proof", "Result verified against board hash"]}
        startFrame={B.bobResponds.start}
        duration={B.bobResponds.duration}
        accentColor={colors.gold}
      />
      <OverlayLabel
        lines={["Proof verified — result honest", "No one can cheat"]}
        startFrame={B.proofVerify.start}
        duration={B.proofVerify.duration}
        accentColor={colors.greenSafe}
      />
    </AbsoluteFill>
  );
};
