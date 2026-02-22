import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { CONFIG } from "../config";
import { colors, fullScreen, fonts, cardStyle, textGlow } from "../styles";
import { FadeIn } from "../components/primitives/FadeIn";
import { ScaleIn } from "../components/primitives/ScaleIn";
import { PiPFrame } from "../components/ui/PiPFrame";

const B = CONFIG.scenes.architecture.blocks;

/* ── Player node ── */
const PlayerNode: React.FC<{
  label: string;
  emoji: string;
  color: string;
  sublabel?: string;
}> = ({ label, emoji, color, sublabel }) => (
  <div style={{ textAlign: "center" }}>
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        border: `3px solid ${color}`,
        backgroundColor: `${color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 32,
        margin: "0 auto",
      }}
    >
      {emoji}
    </div>
    <p style={{ fontFamily: fonts.orbitron, fontSize: 14, color, margin: "6px 0 0" }}>
      {label}
    </p>
    {sublabel && (
      <p style={{ fontFamily: fonts.rajdhani, fontSize: 12, color: colors.muted, margin: "2px 0 0" }}>
        {sublabel}
      </p>
    )}
  </div>
);

/* ── Linha animada com mensagem ── */
const AnimatedLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active: boolean;
  color: string;
  label?: string;
}> = ({ x1, y1, x2, y2, active, color, label }) => {
  const frame = useCurrentFrame();

  // Dash animado
  const dashOffset = frame * 2;

  return (
    <>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={active ? color : `${colors.muted}30`}
        strokeWidth={active ? 2 : 1}
        strokeDasharray={active ? "8 4" : "4 4"}
        strokeDashoffset={active ? -dashOffset : 0}
      />
      {label && active && (
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 - 8}
          fill={color}
          fontSize={11}
          fontFamily={fonts.rajdhani}
          textAnchor="middle"
        >
          {label}
        </text>
      )}
    </>
  );
};

export const Architecture: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeOut = interpolate(
    frame,
    [B.fadeOut.start, B.fadeOut.start + B.fadeOut.duration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const showMessages = frame >= B.messages.start;
  const showBlockchain = frame >= B.blockchain.start;
  const showProtocol = frame >= B.protocol25.start;

  // Posicoes dos elementos: Alice (esq) — Server (centro) — Bob (dir)
  const aliceX = 260;
  const bobX = 1660;
  const playerY = 420;
  const backendX = 960;
  const backendY = 420;
  const chainX = 960;
  const chainY = 720;

  // Pulse pro Protocol 25
  const p25Pulse = 0.6 + Math.sin(frame * 0.15) * 0.4;

  return (
    <AbsoluteFill style={{ ...fullScreen, opacity: fadeOut }}>
      {/* Title */}
      <div style={{ position: "absolute", top: 40, left: "50%", transform: "translateX(-50%)" }}>
        <FadeIn startFrame={0} duration={15}>
          <h2
            style={{
              fontFamily: fonts.orbitron,
              fontSize: 38,
              color: colors.gold,
              margin: 0,
              textAlign: "center",
              ...textGlow(colors.gold, 10),
            }}
          >
            Architecture
          </h2>
        </FadeIn>
      </div>

      {/* SVG pra linhas */}
      <svg
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        width="100%"
        height="100%"
      >
        {/* Alice → Server */}
        <AnimatedLine
          x1={aliceX + 50}
          y1={playerY}
          x2={backendX - 90}
          y2={backendY}
          active={showMessages}
          color={colors.teal}
          label="turns"
        />

        {/* Server → Bob */}
        <AnimatedLine
          x1={backendX + 90}
          y1={backendY}
          x2={bobX - 50}
          y2={playerY}
          active={showMessages}
          color={colors.gold}
          label="turns"
        />

        {/* Server → Blockchain (vertical pra baixo) */}
        {showBlockchain && (
          <AnimatedLine
            x1={backendX}
            y1={backendY + 90}
            x2={chainX}
            y2={chainY - 70}
            active={showBlockchain}
            color={colors.stellarBlue}
            label="proofs + TX"
          />
        )}
      </svg>

      {/* Alice (esquerda) */}
      <FadeIn startFrame={B.players.start} duration={15}>
        <div style={{ position: "absolute", left: aliceX - 40, top: playerY - 60 }}>
          <PlayerNode label="ALICE" emoji="🧑" color={colors.teal} sublabel="Noir WASM" />
        </div>
      </FadeIn>

      {/* Bob (direita) */}
      <FadeIn startFrame={B.players.start + 5} duration={15}>
        <div style={{ position: "absolute", left: bobX - 40, top: playerY - 60 }}>
          <PlayerNode label="BOB" emoji="🧑" color={colors.gold} sublabel="Noir WASM" />
        </div>
      </FadeIn>

      {/* Server (centro) */}
      <FadeIn startFrame={B.backend.start} duration={15}>
        <div
          style={{
            position: "absolute",
            left: backendX - 85,
            top: backendY - 90,
            ...cardStyle(colors.teal),
            width: 170,
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 36 }}>🖥️</span>
          <p style={{ fontFamily: fonts.orbitron, fontSize: 18, fontWeight: 700, color: colors.teal, margin: "8px 0 0" }}>
            SERVER
          </p>
          <p style={{ fontFamily: fonts.rajdhani, fontSize: 14, color: colors.white, margin: "6px 0 0" }}>
            Matchmaking
          </p>
          <p style={{ fontFamily: fonts.rajdhani, fontSize: 14, color: colors.white, margin: "2px 0" }}>
            Turn relay
          </p>
          <p style={{ fontFamily: fonts.rajdhani, fontSize: 14, color: colors.white, margin: "2px 0" }}>
            Proof verify
          </p>
          <p style={{ fontFamily: fonts.rajdhani, fontSize: 13, color: colors.muted, margin: "6px 0 0" }}>
            ~ms latency
          </p>
        </div>
      </FadeIn>

      {/* Blockchain (abaixo do server) */}
      {showBlockchain && (
        <FadeIn startFrame={B.blockchain.start} duration={15}>
          <div
            style={{
              position: "absolute",
              left: chainX - 110,
              top: chainY - 60,
              ...cardStyle(colors.stellarBlue),
              width: 220,
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 32 }}>⭐</span>
            <p style={{ fontFamily: fonts.orbitron, fontSize: 18, fontWeight: 700, color: "#5b8def", margin: "6px 0 0" }}>
              STELLAR
            </p>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 14, color: colors.white, margin: "6px 0 0" }}>
              TX 1: open_match · TX 2: close_match
            </p>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 14, color: colors.white, margin: "2px 0" }}>
              Escrow lock/release
            </p>

            {/* Protocol 25 */}
            {showProtocol && (
              <FadeIn startFrame={B.protocol25.start} duration={15}>
                <div
                  style={{
                    marginTop: 10,
                    padding: "8px 12px",
                    backgroundColor: `${colors.stellarBlue}40`,
                    border: `2px solid ${colors.gold}`,
                    borderRadius: 6,
                    borderColor: `rgba(201, 166, 52, ${p25Pulse})`,
                  }}
                >
                  <p style={{ fontFamily: fonts.orbitron, fontSize: 12, color: colors.gold, margin: 0 }}>
                    PROTOCOL 25
                  </p>
                  <p style={{ fontFamily: fonts.rajdhani, fontSize: 12, color: colors.teal, margin: "4px 0 0" }}>
                    Native BN254 · Native Poseidon2
                  </p>
                </div>
              </FadeIn>
            )}
          </div>
        </FadeIn>
      )}

      <PiPFrame startFrame={B.players.start + 20} />
    </AbsoluteFill>
  );
};
