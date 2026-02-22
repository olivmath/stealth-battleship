import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { CONFIG, s } from "../config";
import { colors, fullScreen, fonts, textGlow, cardStyle } from "../styles";
import { ScaleIn } from "../components/primitives/ScaleIn";
import { FadeIn } from "../components/primitives/FadeIn";
import { SlideIn } from "../components/primitives/SlideIn";
import { TypewriterText } from "../components/primitives/TypewriterText";
import { GlitchText } from "../components/primitives/GlitchText";
import { Badge } from "../components/ui/Badge";
import { HashVisualization } from "../components/effects/HashVisualization";
import { PiPFrame } from "../components/ui/PiPFrame";

const B = CONFIG.scenes.threeProofs.blocks;

/* ── Grid component (6x6) ── */
const Grid6x6: React.FC<{
  cellSize?: number;
  ships?: { row: number; col: number }[];
  hits?: { row: number; col: number; isHit: boolean }[];
  crosshair?: { row: number; col: number } | null;
  style?: React.CSSProperties;
}> = ({ cellSize = 40, ships = [], hits = [], crosshair = null, style }) => {
  const gridSize = cellSize * 6 + 7;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(6, ${cellSize}px)`,
        gap: 1,
        backgroundColor: `${colors.teal}30`,
        padding: 1,
        borderRadius: 4,
        ...style,
      }}
    >
      {Array.from({ length: 36 }, (_, idx) => {
        const row = Math.floor(idx / 6);
        const col = idx % 6;
        const isShip = ships.some((s) => s.row === row && s.col === col);
        const hit = hits.find((h) => h.row === row && h.col === col);
        const isCrosshair = crosshair && crosshair.row === row && crosshair.col === col;

        let bg = colors.navyDark;
        if (isShip) bg = `${colors.teal}40`;
        if (hit) bg = hit.isHit ? colors.fireOrange : `${colors.stellarBlue}60`;
        if (isCrosshair) bg = `${colors.gold}50`;

        return (
          <div
            key={idx}
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              position: "relative",
            }}
          >
            {isCrosshair && (
              <span style={{ color: colors.gold, fontSize: 24, fontWeight: 700 }}>+</span>
            )}
            {hit?.isHit && <span style={{ color: colors.white, fontSize: 16 }}>X</span>}
            {hit && !hit.isHit && <span style={{ color: colors.muted, fontSize: 12 }}>o</span>}
          </div>
        );
      })}
    </div>
  );
};

/* ── Sub-scene: Board Validity ── */
const BoardValidity: React.FC = () => {
  const frame = useCurrentFrame();
  const A = B.boardValidity.anims;

  // Ships appear one by one
  const ship1Visible = frame >= A.gridShips.delay + 10;
  const ship2Visible = frame >= A.gridShips.delay + 25;
  const ship3Visible = frame >= A.gridShips.delay + 40;

  const ships = [
    ...(ship1Visible ? [{ row: 1, col: 2 }, { row: 1, col: 3 }] : []),
    ...(ship2Visible ? [{ row: 3, col: 0 }, { row: 3, col: 1 }] : []),
    ...(ship3Visible ? [{ row: 5, col: 2 }, { row: 5, col: 3 }, { row: 5, col: 4 }] : []),
  ];

  return (
    <AbsoluteFill style={{ ...fullScreen, gap: 20 }}>
      {/* Footage placeholder */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: colors.navyMid,
          opacity: 0.15,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: colors.muted, fontSize: 18, fontFamily: fonts.rajdhani }}>
          [ Crew Preparing Ship — Footage ]
        </span>
      </div>

      {/* Title */}
      <ScaleIn startFrame={A.title.delay}>
        <p style={{ fontFamily: fonts.orbitron, fontSize: 24, color: colors.teal, margin: 0 }}>PROOF 1</p>
        <h2 style={{ fontFamily: fonts.orbitron, fontSize: 42, color: colors.gold, margin: 0, ...textGlow(colors.gold, 15) }}>
          Board Validity
        </h2>
        <p style={{ fontFamily: fonts.rajdhani, fontSize: 22, color: colors.teal, margin: 0 }}>
          Prove your board is legal
        </p>
      </ScaleIn>

      {/* Grid + Hash side by side */}
      <div style={{ display: "flex", gap: 60, alignItems: "center", marginTop: 20 }}>
        <FadeIn startFrame={A.gridShips.delay} duration={15}>
          <Grid6x6 ships={ships} cellSize={50} />
        </FadeIn>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {frame >= A.hashFlow.delay && (
            <HashVisualization
              startFrame={A.hashFlow.delay}
              duration={A.hashFlow.duration}
            />
          )}
          <FadeIn startFrame={A.hashFlow.delay + 30} duration={15}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Badge label="Private: ship positions" variant="private" />
              <Badge label="Public: board_hash only" variant="public" />
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Bottom badge */}
      <SlideIn startFrame={A.badge.delay} direction="down" distance={40}>
        <Badge
          label="Verified on-chain via Soroban UltraHonk"
          style={{ fontSize: 20, padding: "12px 24px", marginTop: 10 }}
        />
      </SlideIn>

      <PiPFrame startFrame={A.title.delay + 20} />
    </AbsoluteFill>
  );
};

/* ── Sub-scene: Shot Proof ── */
const ShotProof: React.FC = () => {
  const frame = useCurrentFrame();
  const A = B.shotProof.anims;

  // Crosshair moves to target
  const showCrosshair = frame >= A.crosshair.delay && frame < A.explosion.delay;
  const showExplosion = frame >= A.explosion.delay && frame < A.hitResult.delay;
  const showResult = frame >= A.hitResult.delay;

  const crosshairTarget = showCrosshair ? { row: 3, col: 4 } : null;
  const hitCell = showResult ? [{ row: 3, col: 4, isHit: true as const }] : [];

  // Explosion flash
  const flashOpacity = showExplosion
    ? interpolate(frame, [A.explosion.delay, A.explosion.delay + A.explosion.duration], [0.8, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill style={{ ...fullScreen, gap: 20 }}>
      <ScaleIn startFrame={A.title.delay}>
        <p style={{ fontFamily: fonts.orbitron, fontSize: 24, color: colors.teal, margin: 0 }}>PROOF 2</p>
        <h2 style={{ fontFamily: fonts.orbitron, fontSize: 42, color: colors.gold, margin: 0, ...textGlow(colors.gold, 15) }}>
          Shot Proof
        </h2>
        <p style={{ fontFamily: fonts.rajdhani, fontSize: 22, color: colors.teal, margin: 0 }}>
          Prove every hit/miss is honest
        </p>
      </ScaleIn>

      <FadeIn startFrame={A.crosshair.delay} duration={10}>
        <Grid6x6 crosshair={crosshairTarget} hits={hitCell} cellSize={50} />
      </FadeIn>

      {/* Explosion footage placeholder */}
      {showExplosion && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: colors.fireOrange,
            opacity: flashOpacity,
            pointerEvents: "none",
          }}
        />
      )}

      {/* HIT result */}
      {showResult && (
        <div style={{ textAlign: "center" }}>
          <ScaleIn startFrame={A.hitResult.delay}>
            <h1
              style={{
                fontFamily: fonts.orbitron,
                fontSize: 64,
                color: colors.fireOrange,
                margin: 0,
                ...textGlow(colors.fireOrange, 25),
              }}
            >
              HIT!
            </h1>
          </ScaleIn>
          <FadeIn startFrame={A.hitResult.delay + 15} duration={15}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: colors.teal, margin: "8px 0" }}>
              is_hit == (board[3][4] == 1) ✓
            </p>
            <Badge label="board_hash matches committed hash ✓" variant="public" />
          </FadeIn>
        </div>
      )}

      {/* Closing quote */}
      {frame >= A.closingText.delay && (
        <FadeIn startFrame={A.closingText.delay} duration={15}>
          <GlitchText
            text={`"Lying is mathematically impossible."`}
            startFrame={A.closingText.delay}
            duration={A.closingText.duration}
            fontSize={32}
            color={colors.white}
          />
          <div style={{ marginTop: 8 }}>
            <Badge label="Generated every turn | ~1-2s" />
          </div>
        </FadeIn>
      )}

      <PiPFrame startFrame={A.title.delay + 20} />
    </AbsoluteFill>
  );
};

/* ── Sub-scene: Turns Proof ── */
const TurnsProof: React.FC = () => {
  const frame = useCurrentFrame();
  const A = B.turnsProof.anims;

  // Replay: shots appear one by one
  const replayProgress = interpolate(
    frame,
    [A.replay.delay, A.replay.delay + A.replay.duration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const allShots = [
    { row: 0, col: 1, isHit: false },
    { row: 1, col: 3, isHit: true },
    { row: 2, col: 2, isHit: false },
    { row: 3, col: 4, isHit: true },
    { row: 4, col: 0, isHit: false },
    { row: 5, col: 5, isHit: true },
    { row: 1, col: 2, isHit: true },
    { row: 0, col: 4, isHit: false },
  ];
  const visibleCount = Math.floor(replayProgress * allShots.length);
  const playerAHits = allShots.slice(0, visibleCount).filter((_, i) => i % 2 === 0);
  const playerBHits = allShots.slice(0, visibleCount).filter((_, i) => i % 2 === 1);

  return (
    <AbsoluteFill style={{ ...fullScreen, gap: 20 }}>
      {/* Footage placeholder */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: colors.navyMid,
          opacity: 0.12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: colors.muted, fontSize: 18, fontFamily: fonts.rajdhani }}>
          [ Ship Sinking — Footage ]
        </span>
      </div>

      <ScaleIn startFrame={A.title.delay}>
        <p style={{ fontFamily: fonts.orbitron, fontSize: 24, color: colors.teal, margin: 0 }}>PROOF 3</p>
        <h2 style={{ fontFamily: fonts.orbitron, fontSize: 42, color: colors.gold, margin: 0, ...textGlow(colors.gold, 15) }}>
          Turns Proof
        </h2>
        <p style={{ fontFamily: fonts.rajdhani, fontSize: 22, color: colors.teal, margin: 0 }}>
          Prove the entire game was fair
        </p>
      </ScaleIn>

      {/* Two grids side by side — replay */}
      <FadeIn startFrame={A.replay.delay} duration={10}>
        <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 18, color: colors.muted, margin: "0 0 8px" }}>Player A</p>
            <Grid6x6 hits={playerAHits} cellSize={40} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 18, color: colors.muted, margin: "0 0 8px" }}>Player B</p>
            <Grid6x6 hits={playerBHits} cellSize={40} />
          </div>
        </div>
      </FadeIn>

      {/* Replay label */}
      {replayProgress >= 1 && (
        <FadeIn startFrame={A.replay.delay + A.replay.duration} duration={15}>
          <p style={{ fontFamily: fonts.rajdhani, fontSize: 20, color: colors.white, margin: "8px 0" }}>
            Full game replay — verified inside the circuit
          </p>
        </FadeIn>
      )}

      {/* Trophy */}
      {frame >= A.trophy.delay && (
        <ScaleIn startFrame={A.trophy.delay}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 64 }}>🏆</span>
            <p
              style={{
                fontFamily: fonts.orbitron,
                fontSize: 22,
                color: colors.gold,
                margin: "8px 0 0",
                ...textGlow(colors.gold, 10),
              }}
            >
              Winner computed IN the proof
            </p>
          </div>
        </ScaleIn>
      )}

      {/* Referee badge */}
      {frame >= A.refereeBadge.delay && (
        <SlideIn startFrame={A.refereeBadge.delay} direction="down" distance={40}>
          <div
            style={{
              ...cardStyle(colors.teal),
              textAlign: "center",
              padding: "20px 40px",
              marginTop: 10,
            }}
          >
            <p
              style={{
                fontFamily: fonts.orbitron,
                fontSize: 26,
                color: colors.white,
                margin: 0,
                ...textGlow(colors.teal, 10),
              }}
            >
              "The circuit IS the referee."
            </p>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 18, color: colors.muted, margin: "8px 0 0" }}>
              Settles on-chain → escrow released
            </p>
          </div>
        </SlideIn>
      )}

      <PiPFrame startFrame={A.title.delay + 20} />
    </AbsoluteFill>
  );
};

/* ── Main ThreeProofs scene ── */
export const ThreeProofs: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={B.boardValidity.start} durationInFrames={B.boardValidity.duration}>
        <BoardValidity />
      </Sequence>
      <Sequence from={B.shotProof.start} durationInFrames={B.shotProof.duration}>
        <ShotProof />
      </Sequence>
      <Sequence from={B.turnsProof.start} durationInFrames={B.turnsProof.duration}>
        <TurnsProof />
      </Sequence>
    </AbsoluteFill>
  );
};
