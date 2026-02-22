import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { CONFIG } from "../config";
import { colors, fullScreen, fonts, textGlow } from "../styles";
import { FadeIn } from "../components/primitives/FadeIn";
import { ScaleIn } from "../components/primitives/ScaleIn";

const B = CONFIG.scenes.problemSplit.blocks;

/* ── Entidade (Alice / Server / Bob) ── */
const Entity: React.FC<{
  label: string;
  icon: string;
  sublabel?: string;
  borderColor: string;
  style?: React.CSSProperties;
}> = ({ label, icon, sublabel, borderColor, style }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      ...style,
    }}
  >
    <div
      style={{
        width: 120,
        height: 120,
        borderRadius: "50%",
        border: `3px solid ${borderColor}`,
        backgroundColor: `${borderColor}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 48,
      }}
    >
      {icon}
    </div>
    <p style={{ fontFamily: fonts.orbitron, fontSize: 22, fontWeight: 700, color: colors.white, margin: 0 }}>
      {label}
    </p>
    {sublabel && (
      <p style={{ fontFamily: fonts.rajdhani, fontSize: 16, color: colors.muted, margin: 0 }}>
        {sublabel}
      </p>
    )}
  </div>
);

/* ── Pacote animado ── */
const Packet: React.FC<{
  fromX: number;
  toX: number;
  y: number;
  startFrame: number;
  duration: number;
  color: string;
}> = ({ fromX, toX, y, startFrame, duration, color }) => {
  const frame = useCurrentFrame();
  if (frame < startFrame || frame > startFrame + duration) return null;

  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = fromX + (toX - fromX) * progress;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Envelope */}
      <div
        style={{
          width: 40,
          height: 28,
          backgroundColor: color,
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 16px ${color}80`,
        }}
      >
        <span style={{ fontSize: 16 }}>📦</span>
      </div>
    </div>
  );
};

/* ── Lupa do servidor ── */
const ServerSpy: React.FC<{ startFrame: number; duration: number }> = ({
  startFrame,
  duration,
}) => {
  const frame = useCurrentFrame();
  if (frame < startFrame || frame > startFrame + duration) return null;

  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 10],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Lupa balanca suavemente
  const wobble = Math.sin(frame * 0.3) * 5;

  return (
    <div
      style={{
        position: "absolute",
        top: 200,
        left: "50%",
        transform: `translate(-50%, 0) rotate(${wobble}deg)`,
        opacity,
        fontSize: 64,
        filter: "drop-shadow(0 0 12px rgba(255, 58, 58, 0.6))",
      }}
    >
      🔍
    </div>
  );
};

/* ── Linha de conexao ── */
const ConnectionLine: React.FC<{
  x1: number;
  x2: number;
  y: number;
  active: boolean;
  color: string;
}> = ({ x1, x2, y, active, color }) => (
  <div
    style={{
      position: "absolute",
      left: Math.min(x1, x2),
      top: y,
      width: Math.abs(x2 - x1),
      height: 2,
      backgroundColor: active ? color : `${colors.muted}30`,
      boxShadow: active ? `0 0 8px ${color}60` : "none",
      transition: "background-color 0.1s",
    }}
  />
);

/* ── Texto "Server sees data" ── */
const SpyLabel: React.FC<{ startFrame: number; duration: number }> = ({
  startFrame,
  duration,
}) => {
  const frame = useCurrentFrame();
  if (frame < startFrame || frame > startFrame + duration) return null;

  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 10],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 280,
        left: "50%",
        transform: "translateX(-50%)",
        opacity,
        padding: "8px 20px",
        backgroundColor: `${colors.redAlert}20`,
        border: `1px solid ${colors.redAlert}60`,
        borderRadius: 8,
      }}
    >
      <p style={{ fontFamily: fonts.rajdhani, fontSize: 20, color: colors.redAlert, margin: 0 }}>
        Server reads your data
      </p>
    </div>
  );
};

/* ── Cena principal ── */
export const ProblemSplit: React.FC = () => {
  const frame = useCurrentFrame();

  const showEntities = frame < B.zkExpand.start;
  const showZkText = frame >= B.zkExpand.start;

  // Posicoes X das entidades
  const aliceX = 360;
  const serverX = 960;
  const bobX = 1560;
  const lineY = 460;

  // Qual trecho esta ativo
  const aliceToServerActive = frame >= B.aliceToServer.start && frame < B.serverToBob.start + B.serverToBob.duration;
  const serverToBobActive = frame >= B.serverToBob.start && frame < B.bobToServer.start;
  const bobToServerActive = frame >= B.bobToServer.start && frame < B.serverToAlice.start + B.serverToAlice.duration;
  const serverToAliceActive = frame >= B.serverToAlice.start && frame < B.zkExpand.start;

  // Lupa aparece quando o server recebe a primeira msg e fica ate o fim
  const spyStart = B.aliceToServer.start + B.aliceToServer.duration - 10;
  const spyEnd = B.zkExpand.start;

  // Fade out das entidades antes do texto ZK
  const entitiesOpacity = interpolate(
    frame,
    [B.zkExpand.start - 15, B.zkExpand.start],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ ...fullScreen }}>
      {/* Titulo */}
      <FadeIn startFrame={0} duration={15}>
        <h2
          style={{
            fontFamily: fonts.orbitron,
            fontSize: 38,
            color: colors.redAlert,
            margin: 0,
            position: "absolute",
            top: 60,
            left: "50%",
            transform: "translateX(-50%)",
            ...textGlow(colors.redAlert, 10),
          }}
        >
          The Trust Problem
        </h2>
      </FadeIn>

      {/* Entidades + animacoes */}
      {showEntities && (
        <div style={{ position: "absolute", inset: 0, opacity: entitiesOpacity }}>
          {/* Linhas de conexao */}
          <ConnectionLine
            x1={aliceX + 60}
            x2={serverX - 60}
            y={lineY}
            active={aliceToServerActive || serverToAliceActive}
            color={aliceToServerActive ? colors.teal : colors.fireOrange}
          />
          <ConnectionLine
            x1={serverX + 60}
            x2={bobX - 60}
            y={lineY}
            active={serverToBobActive || bobToServerActive}
            color={serverToBobActive ? colors.teal : colors.fireOrange}
          />

          {/* Alice */}
          <div style={{ position: "absolute", left: aliceX, top: 340, transform: "translateX(-50%)" }}>
            <FadeIn startFrame={B.appear.start} duration={B.appear.duration}>
              <Entity
                label="ALICE"
                icon="🚢"
                sublabel="Player 1"
                borderColor={colors.teal}
              />
            </FadeIn>
          </div>

          {/* Server */}
          <div style={{ position: "absolute", left: serverX, top: 340, transform: "translateX(-50%)" }}>
            <FadeIn startFrame={B.appear.start + 5} duration={B.appear.duration}>
              <Entity
                label="SERVER"
                icon="🖥️"
                sublabel="Trusted third party"
                borderColor={colors.redAlert}
              />
            </FadeIn>
          </div>

          {/* Bob */}
          <div style={{ position: "absolute", left: bobX, top: 340, transform: "translateX(-50%)" }}>
            <FadeIn startFrame={B.appear.start + 10} duration={B.appear.duration}>
              <Entity
                label="BOB"
                icon="🚢"
                sublabel="Player 2"
                borderColor={colors.gold}
              />
            </FadeIn>
          </div>

          {/* Pacote: Alice → Server */}
          <Packet
            fromX={aliceX + 80}
            toX={serverX - 80}
            y={lineY}
            startFrame={B.aliceToServer.start}
            duration={B.aliceToServer.duration}
            color={colors.teal}
          />

          {/* Pacote: Server → Bob */}
          <Packet
            fromX={serverX + 80}
            toX={bobX - 80}
            y={lineY}
            startFrame={B.serverToBob.start}
            duration={B.serverToBob.duration}
            color={colors.teal}
          />

          {/* Pacote: Bob → Server */}
          <Packet
            fromX={bobX - 80}
            toX={serverX + 80}
            y={lineY}
            startFrame={B.bobToServer.start}
            duration={B.bobToServer.duration}
            color={colors.fireOrange}
          />

          {/* Pacote: Server → Alice */}
          <Packet
            fromX={serverX - 80}
            toX={aliceX + 80}
            y={lineY}
            startFrame={B.serverToAlice.start}
            duration={B.serverToAlice.duration}
            color={colors.fireOrange}
          />

          {/* Lupa + label: aparece na primeira msg e fica ate o fim */}
          <ServerSpy startFrame={spyStart} duration={spyEnd - spyStart} />
          <SpyLabel startFrame={spyStart} duration={spyEnd - spyStart} />
        </div>
      )}

      {/* Texto ZK final */}
      {showZkText && (
        <ScaleIn startFrame={B.zkExpand.start}>
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
        </ScaleIn>
      )}
    </AbsoluteFill>
  );
};
