import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { CONFIG } from "../config";
import { colors, fullScreen, fonts, cardStyle, codeStyle, textGlow } from "../styles";
import { SlideIn } from "../components/primitives/SlideIn";
import { FadeIn } from "../components/primitives/FadeIn";
import { Badge } from "../components/ui/Badge";
import { PiPFrame } from "../components/ui/PiPFrame";

const B = CONFIG.scenes.architecture.blocks;

export const Architecture: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Protocol 25 highlight pulse
  const p25BorderOpacity = 0.6 + Math.sin(frame * 0.15) * 0.4;

  // Fade out
  const fadeOut = interpolate(
    frame,
    [B.fadeOut.start, B.fadeOut.start + B.fadeOut.duration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ ...fullScreen, padding: 60, opacity: fadeOut }}>
      {/* Device layer */}
      <SlideIn startFrame={B.deviceLayer.start} direction="down" distance={80}>
        <div
          style={{
            ...cardStyle(colors.white),
            textAlign: "center",
            padding: "24px 60px",
          }}
        >
          <p style={{ fontFamily: fonts.orbitron, fontSize: 22, fontWeight: 700, color: colors.gold, margin: 0 }}>
            PLAYER DEVICE
          </p>
          <p style={{ fontFamily: fonts.rajdhani, fontSize: 18, color: colors.white, margin: "6px 0 0" }}>
            Noir Circuits (WASM) + Game Engine + React Native / Expo
          </p>
        </div>
      </SlideIn>

      {/* Arrow labels */}
      <FadeIn startFrame={B.baseLayer.start} duration={15}>
        <div style={{ display: "flex", justifyContent: "center", gap: 200, marginTop: 16 }}>
          <p style={{ ...codeStyle, fontSize: 18, color: colors.teal }}>proofs ↓</p>
          <p style={{ ...codeStyle, fontSize: 18, color: colors.fireOrange }}>↓ real-time turns</p>
        </div>
      </FadeIn>

      {/* Base layer — Stellar + Convex */}
      <div style={{ display: "flex", gap: 40, marginTop: 16 }}>
        <SlideIn startFrame={B.baseLayer.start + 10} direction="up" distance={60}>
          <div style={{ ...cardStyle(colors.stellarBlue), minWidth: 320, position: "relative" }}>
            <p style={{ fontFamily: fonts.orbitron, fontSize: 22, fontWeight: 700, color: "#5b8def", margin: 0 }}>
              STELLAR (Soroban)
            </p>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 18, color: colors.white, margin: "8px 0 2px" }}>
              TX 1: open_match
            </p>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 18, color: colors.white, margin: "2px 0" }}>
              TX 2: close_match
            </p>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 18, color: colors.white, margin: "2px 0" }}>
              Escrow lock/release
            </p>

            {/* Protocol 25 highlight */}
            {frame >= B.protocol25.start && (
              <FadeIn startFrame={B.protocol25.start} duration={15}>
                <div
                  style={{
                    marginTop: 16,
                    padding: "12px 16px",
                    backgroundColor: `${colors.stellarBlue}40`,
                    border: `2px solid ${colors.gold}`,
                    borderRadius: 8,
                    borderColor: `rgba(201, 166, 52, ${p25BorderOpacity})`,
                  }}
                >
                  <p style={{ fontFamily: fonts.orbitron, fontSize: 16, color: colors.gold, margin: 0 }}>
                    PROTOCOL 25 (X-RAY)
                  </p>
                  <p style={{ fontFamily: fonts.rajdhani, fontSize: 15, color: colors.teal, margin: "6px 0 0" }}>
                    → Native BN254 curve operations
                  </p>
                  <p style={{ fontFamily: fonts.rajdhani, fontSize: 15, color: colors.teal, margin: "2px 0" }}>
                    → Native Poseidon2 hash function
                  </p>
                  <p style={{ fontFamily: fonts.rajdhani, fontSize: 14, color: colors.white, margin: "4px 0 0" }}>
                    = The EXACT primitives our circuits use
                  </p>
                </div>
              </FadeIn>
            )}
          </div>
        </SlideIn>

        <SlideIn startFrame={B.baseLayer.start + 10} direction="up" distance={60}>
          <div style={{ ...cardStyle(colors.convexPurple), minWidth: 320 }}>
            <p style={{ fontFamily: fonts.orbitron, fontSize: 22, fontWeight: 700, color: "#a78bfa", margin: 0 }}>
              CONVEX (off-chain)
            </p>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 18, color: colors.white, margin: "8px 0 2px" }}>
              Matchmaking
            </p>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 18, color: colors.white, margin: "2px 0" }}>
              Turn coordination
            </p>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 18, color: colors.white, margin: "2px 0" }}>
              shot_proof verification
            </p>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 16, color: colors.muted, marginTop: 12 }}>
              ~ms latency
            </p>
          </div>
        </SlideIn>
      </div>

      {/* TX Badge */}
      <FadeIn startFrame={B.txBadge.start} duration={20} style={{ marginTop: 24 }}>
        <div
          style={{
            padding: "16px 40px",
            backgroundColor: colors.navyMid,
            border: `2px solid ${colors.teal}`,
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: fonts.orbitron,
              fontSize: 24,
              color: colors.teal,
              margin: 0,
              ...textGlow(colors.teal, 10),
            }}
          >
            Only 2 on-chain transactions per game
          </p>
          <p style={{ fontFamily: fonts.rajdhani, fontSize: 18, color: colors.muted, margin: "8px 0 0" }}>
            open_match() ———— gameplay ———— close()
          </p>
        </div>
      </FadeIn>

      <PiPFrame startFrame={B.deviceLayer.start + 20} />
    </AbsoluteFill>
  );
};
