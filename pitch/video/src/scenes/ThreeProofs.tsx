import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { CONFIG, s } from "../config";
import { colors, fullScreen, fonts, textGlow, cardStyle } from "../styles";
import { ScaleIn } from "../components/primitives/ScaleIn";
import { FadeIn } from "../components/primitives/FadeIn";
import { SlideIn } from "../components/primitives/SlideIn";
import { TypewriterText } from "../components/primitives/TypewriterText";

import { Badge } from "../components/ui/Badge";

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

/* ── Posicoes dos navios no grid 6x6 ── */
const SHIP_CELLS = [
  { row: 1, col: 2 }, { row: 1, col: 3 },             // Patrol Boat 1
  { row: 3, col: 0 }, { row: 3, col: 1 },             // Patrol Boat 2
  { row: 5, col: 2 }, { row: 5, col: 3 }, { row: 5, col: 4 }, // Destroyer
];

/* ── Matriz 6x6 de 0s e 1s ── */
const BOARD_MATRIX: number[][] = Array.from({ length: 6 }, (_, r) =>
  Array.from({ length: 6 }, (_, c) =>
    SHIP_CELLS.some((s) => s.row === r && s.col === c) ? 1 : 0
  )
);

/* ── SVG bracket for matrix notation (bmatrix style) ── */
const MatrixBracket: React.FC<{
  side: "left" | "right";
  height: number;
  color?: string;
  strokeWidth?: number;
}> = ({ side, height, color = colors.muted, strokeWidth = 2.5 }) => {
  const w = 14;
  const pad = 3;
  const d =
    side === "left"
      ? `M ${w - pad} ${pad} L ${pad} ${pad} L ${pad} ${height - pad} L ${w - pad} ${height - pad}`
      : `M ${pad} ${pad} L ${w - pad} ${pad} L ${w - pad} ${height - pad} L ${pad} ${height - pad}`;

  return (
    <svg width={w} height={height} style={{ flexShrink: 0 }}>
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" />
    </svg>
  );
};

/* ── Componente da matriz numerica ── */
const MatrixView: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const rowHeight = 18 * 1.6;
  const gapSize = 2;
  const matrixHeight = BOARD_MATRIX.length * rowHeight + (BOARD_MATRIX.length - 1) * gapSize;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, ...style }}>
      <MatrixBracket side="left" height={matrixHeight} />
      <div style={{
        display: "flex", flexDirection: "column", gap: gapSize,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 18, lineHeight: 1.6,
      }}>
        {BOARD_MATRIX.map((row, r) => (
          <div key={r} style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {row.map((val, c) => (
              <span key={c} style={{
                color: val === 1 ? colors.fireOrange : `${colors.muted}80`,
                fontWeight: val === 1 ? 700 : 400,
                textShadow: val === 1 ? `0 0 8px ${colors.fireOrange}60` : "none",
              }}>{val}</span>
            ))}
          </div>
        ))}
      </div>
      <MatrixBracket side="right" height={matrixHeight} />
    </div>
  );
};

/* ── Seta animada entre etapas ── */
const Arrow: React.FC<{ startFrame: number; style?: React.CSSProperties }> = ({
  startFrame,
  style,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        opacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: fonts.orbitron,
          fontSize: 28,
          color: colors.teal,
          textShadow: `0 0 10px ${colors.teal}60`,
        }}
      >
        →
      </span>
    </div>
  );
};

/* ── Sub-scene: Board Validity ── */
const BoardValidity: React.FC = () => {
  const frame = useCurrentFrame();
  const A = B.boardValidity.anims;

  return (
    <AbsoluteFill style={{ ...fullScreen, gap: 16 }}>
      {/* Title */}
      <ScaleIn startFrame={A.title.delay}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: fonts.orbitron, fontSize: 24, color: colors.teal, margin: 0 }}>PROOF 1</p>
          <h2 style={{ fontFamily: fonts.orbitron, fontSize: 42, color: colors.gold, margin: 0, ...textGlow(colors.gold, 15) }}>
            Board Validity
          </h2>
          <p style={{ fontFamily: fonts.rajdhani, fontSize: 22, color: colors.teal, margin: 0 }}>
            Prove your board is legal
          </p>
        </div>
      </ScaleIn>

      {/* Pipeline: Grid → Matrix → Equation → Hash */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          marginTop: 16,
        }}
      >
        {/* 1. Grid visual */}
        <FadeIn startFrame={A.grid.delay} duration={15}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 16, color: colors.muted, margin: "0 0 6px" }}>
              board
            </p>
            <Grid6x6 ships={SHIP_CELLS} cellSize={36} />
          </div>
        </FadeIn>

        <Arrow startFrame={A.matrix.delay} />

        {/* 2. Matriz numerica */}
        <FadeIn startFrame={A.matrix.delay} duration={15}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 16, color: colors.muted, margin: "0 0 6px" }}>
              matrix
            </p>
            <MatrixView />
          </div>
        </FadeIn>

        <Arrow startFrame={A.equation.delay} />

        {/* 3. Equacao */}
        <FadeIn startFrame={A.equation.delay} duration={15}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 16, color: colors.muted, margin: "0 0 6px" }}>
              circuit
            </p>
            <div
              style={{
                padding: "16px 20px",
                backgroundColor: `${colors.navyMid}`,
                border: `1px solid ${colors.teal}40`,
                borderRadius: 8,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 15,
                lineHeight: 1.8,
                color: colors.teal,
                textAlign: "left",
              }}
            >
              <div><span style={{ color: colors.muted }}>assert</span> ships == 3</div>
              <div><span style={{ color: colors.muted }}>assert</span> no_overlap</div>
              <div><span style={{ color: colors.muted }}>assert</span> in_bounds</div>
              <div style={{ marginTop: 8, color: colors.gold }}>
                hash = poseidon2(board)
              </div>
            </div>
          </div>
        </FadeIn>

        <Arrow startFrame={A.hash.delay} />

        {/* 4. Hash resultado */}
        <FadeIn startFrame={A.hash.delay} duration={15}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 16, color: colors.muted, margin: "0 0 6px" }}>
              output
            </p>
            <div
              style={{
                padding: "20px 16px",
                backgroundColor: colors.navyMid,
                border: `2px solid ${colors.gold}`,
                borderRadius: 8,
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>🔒</span>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  color: colors.gold,
                  margin: 0,
                  ...textGlow(colors.gold, 8),
                }}
              >
                0x7a3f8b...
              </p>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  color: colors.gold,
                  margin: "2px 0 0",
                  ...textGlow(colors.gold, 8),
                }}
              >
                ...2c1db4e5
              </p>
              <p style={{ fontFamily: fonts.rajdhani, fontSize: 14, color: colors.muted, margin: "8px 0 0" }}>
                Poseidon2 hash
              </p>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Badges: Private / Public */}
      <FadeIn startFrame={A.hash.delay + 15} duration={15}>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12 }}>
          <Badge label="Private: ship positions" variant="private" />
          <Badge label="Public: board_hash only" variant="public" />
        </div>
      </FadeIn>

      {/* Bottom badge */}
      <SlideIn startFrame={A.badge.delay} direction="down" distance={40}>
        <Badge
          label="Verified on-chain via Soroban UltraHonk"
          style={{ fontSize: 20, padding: "12px 24px", marginTop: 8 }}
        />
      </SlideIn>

      <PiPFrame startFrame={A.title.delay + 20} />
    </AbsoluteFill>
  );
};

/* ── Matriz com celula circulada ── */
const MatrixWithCircle: React.FC<{
  targetRow: number;
  targetCol: number;
  showCircle: boolean;
  style?: React.CSSProperties;
}> = ({ targetRow, targetCol, showCircle, style }) => {
  const frame = useCurrentFrame();
  const circlePulse = showCircle ? 0.7 + Math.sin(frame * 0.2) * 0.3 : 0;
  const rowHeight = 20 * 1.7;
  const gapSize = 2;
  const matrixHeight = BOARD_MATRIX.length * rowHeight + (BOARD_MATRIX.length - 1) * gapSize;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, ...style }}>
      <MatrixBracket side="left" height={matrixHeight} />
      <div style={{
        display: "flex", flexDirection: "column", gap: gapSize,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 20, lineHeight: 1.7,
      }}>
        {BOARD_MATRIX.map((row, r) => (
          <div key={r} style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            {row.map((val, c) => {
              const isTarget = r === targetRow && c === targetCol;
              return (
                <span
                  key={c}
                  style={{
                    position: "relative",
                    color: val === 1 ? colors.fireOrange : `${colors.muted}80`,
                    fontWeight: val === 1 ? 700 : 400,
                    width: 18,
                    textAlign: "center",
                  }}
                >
                  {val}
                  {isTarget && showCircle && (
                    <span
                      style={{
                        position: "absolute",
                        inset: -6,
                        border: `2px solid ${colors.gold}`,
                        borderRadius: "50%",
                        opacity: circlePulse,
                        boxShadow: `0 0 8px ${colors.gold}60`,
                      }}
                    />
                  )}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <MatrixBracket side="right" height={matrixHeight} />
    </div>
  );
};

/* ── Sub-scene: Shot Proof ── */
const ShotProof: React.FC = () => {
  const frame = useCurrentFrame();
  const A = B.shotProof.anims;

  // Alice ataca a coordenada (3, 4) — na nossa matriz board[3][4] == 0 (miss)
  const shotRow = 3;
  const shotCol = 4;
  const isHit = BOARD_MATRIX[shotRow][shotCol] === 1;
  const resultLabel = isHit ? "HIT" : "MISS";
  const resultColor = isHit ? colors.fireOrange : colors.stellarBlue;

  return (
    <AbsoluteFill style={{ ...fullScreen, gap: 16 }}>
      {/* Title */}
      <ScaleIn startFrame={A.title.delay}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: fonts.orbitron, fontSize: 24, color: colors.teal, margin: 0 }}>PROOF 2</p>
          <h2 style={{ fontFamily: fonts.orbitron, fontSize: 42, color: colors.gold, margin: 0, ...textGlow(colors.gold, 15) }}>
            Shot Proof
          </h2>
          <p style={{ fontFamily: fonts.rajdhani, fontSize: 22, color: colors.teal, margin: 0 }}>
            Prove every hit/miss is honest
          </p>
        </div>
      </ScaleIn>

      {/* Pipeline: Alice → a(i,j) → Matrix[circulado] → result + m */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          marginTop: 16,
        }}
      >
        {/* 1. Alice (bonequinho) */}
        <FadeIn startFrame={A.alice.delay} duration={15}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: `3px solid ${colors.teal}`,
                backgroundColor: `${colors.teal}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                margin: "0 auto",
              }}
            >
              🧑
            </div>
            <p style={{ fontFamily: fonts.orbitron, fontSize: 18, color: colors.teal, margin: "8px 0 0" }}>
              ALICE
            </p>
          </div>
        </FadeIn>

        <Arrow startFrame={A.coord.delay} />

        {/* 2. Coordenada a(i,j) */}
        <FadeIn startFrame={A.coord.delay} duration={15}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 16, color: colors.muted, margin: "0 0 6px" }}>
              attack
            </p>
            <div
              style={{
                padding: "16px 24px",
                backgroundColor: colors.navyMid,
                border: `2px solid ${colors.gold}`,
                borderRadius: 8,
              }}
            >
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 28,
                  color: colors.gold,
                  margin: 0,
                  ...textGlow(colors.gold, 10),
                }}
              >
                a({shotRow},{shotCol})
              </p>
            </div>
          </div>
        </FadeIn>

        <Arrow startFrame={A.matrix.delay} />

        {/* 3. Matriz com circulo na celula atacada */}
        <FadeIn startFrame={A.matrix.delay} duration={15}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 16, color: colors.muted, margin: "0 0 6px" }}>
              board[{shotRow}][{shotCol}]
            </p>
            <MatrixWithCircle
              targetRow={shotRow}
              targetCol={shotCol}
              showCircle={frame >= A.matrix.delay + 15}
            />
          </div>
        </FadeIn>

        {/* 4. Duas setas saindo da matriz → result e m */}
        <FadeIn startFrame={A.outputs.delay} duration={15}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-start" }}>
            {/* Seta + Result */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontFamily: fonts.orbitron,
                  fontSize: 28,
                  color: colors.teal,
                  textShadow: `0 0 10px ${colors.teal}60`,
                }}
              >
                →
              </span>
              <div
                style={{
                  padding: "12px 20px",
                  backgroundColor: `${resultColor}20`,
                  border: `2px solid ${resultColor}`,
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                <p style={{ fontFamily: fonts.rajdhani, fontSize: 14, color: colors.muted, margin: "0 0 4px" }}>
                  result
                </p>
                <p
                  style={{
                    fontFamily: fonts.orbitron,
                    fontSize: 24,
                    fontWeight: 700,
                    color: resultColor,
                    margin: 0,
                    ...textGlow(resultColor, 10),
                  }}
                >
                  {resultLabel}
                </p>
              </div>
            </div>

            {/* Seta + m (merkle / commitment) */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontFamily: fonts.orbitron,
                  fontSize: 28,
                  color: colors.teal,
                  textShadow: `0 0 10px ${colors.teal}60`,
                }}
              >
                →
              </span>
              <div
                style={{
                  padding: "12px 20px",
                  backgroundColor: `${colors.navyMid}`,
                  border: `2px solid ${colors.gold}`,
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                <p style={{ fontFamily: fonts.rajdhani, fontSize: 14, color: colors.muted, margin: "0 0 4px" }}>
                  commitment
                </p>
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 18,
                    color: colors.gold,
                    margin: 0,
                    ...textGlow(colors.gold, 8),
                  }}
                >
                  m = hash(board)
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Bottom badge */}
      <SlideIn startFrame={A.badge.delay} direction="down" distance={40}>
        <Badge
          label="Lying is mathematically impossible"
          style={{ fontSize: 20, padding: "12px 24px", marginTop: 12 }}
        />
      </SlideIn>

      <PiPFrame startFrame={A.title.delay + 20} />
    </AbsoluteFill>
  );
};

/* ── Dados dos turnos ── */
const TURNS = [
  { from: "alice", coord: "a(2,3)", result: "MISS", color: colors.stellarBlue },
  { from: "bob", coord: "b(1,2)", result: "HIT", color: colors.fireOrange },
  { from: "alice", coord: "a(5,3)", result: "HIT", color: colors.fireOrange },
  { from: "bob", coord: "b(3,0)", result: "HIT", color: colors.fireOrange },
  { from: "alice", coord: "a(0,1)", result: "MISS", color: colors.stellarBlue },
  { from: "bob", coord: "b(5,4)", result: "HIT", color: colors.fireOrange },
];

/* ── Mensagem animada entre Alice e Bob ── */
const TurnMessage: React.FC<{
  from: "alice" | "bob";
  startFrame: number;
  duration: number;
}> = ({ from, startFrame, duration }) => {
  const frame = useCurrentFrame();
  if (frame < startFrame || frame > startFrame + duration) return null;

  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isDown = from === "alice";
  const fromY = isDown ? 0 : 100;
  const toY = isDown ? 100 : 0;
  const y = fromY + (toY - fromY) * progress;
  const msgColor = isDown ? colors.teal : colors.gold;

  return (
    <div
      style={{
        position: "absolute",
        left: 52,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        width: 24,
        height: 16,
        backgroundColor: msgColor,
        borderRadius: 3,
        boxShadow: `0 0 10px ${msgColor}80`,
      }}
    />
  );
};

/* ── Coluna de turno na tabela ── */
const TurnColumn: React.FC<{
  aliceResult: string;
  aliceColor: string;
  bobResult: string;
  bobColor: string;
  visible: boolean;
}> = ({ aliceResult, aliceColor, bobResult, bobColor, visible }) => {
  if (!visible) return null;

  const cellStyle = (color: string): React.CSSProperties => ({
    width: 48,
    height: 32,
    backgroundColor: `${color}30`,
    border: `2px solid ${color}`,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    fontWeight: 700,
    color,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={cellStyle(aliceColor)}>{aliceResult}</div>
      <div style={cellStyle(bobColor)}>{bobResult}</div>
    </div>
  );
};

/* ── Sub-scene: Turns Proof ── */
const TurnsProof: React.FC = () => {
  const frame = useCurrentFrame();
  const A = B.turnsProof.anims;

  const turnAnims = [A.turn1, A.turn2, A.turn3];
  const visibleTurns = turnAnims.filter((t) => frame >= t.delay).length;

  return (
    <AbsoluteFill style={{ ...fullScreen, gap: 16 }}>
      {/* Title */}
      <ScaleIn startFrame={A.title.delay}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: fonts.orbitron, fontSize: 24, color: colors.teal, margin: 0 }}>PROOF 3</p>
          <h2 style={{ fontFamily: fonts.orbitron, fontSize: 42, color: colors.gold, margin: 0, ...textGlow(colors.gold, 15) }}>
            Turns Proof
          </h2>
          <p style={{ fontFamily: fonts.rajdhani, fontSize: 22, color: colors.teal, margin: 0 }}>
            Prove the entire game was fair
          </p>
        </div>
      </ScaleIn>

      {/* Pipeline: Players ↔ mensagens | Tabela de turnos → Equacao → Hash */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          marginTop: 16,
        }}
      >
        {/* 1. Alice e Bob (bonequinhos empilhados + mensagens) */}
        <FadeIn startFrame={A.turn1.delay} duration={15}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              position: "relative",
              height: 240,
              width: 110,
            }}
          >
            {/* Alice */}
            <div style={{ textAlign: "center", zIndex: 1 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  border: `3px solid ${colors.teal}`,
                  backgroundColor: `${colors.teal}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  margin: "0 auto",
                }}
              >
                🧑
              </div>
              <p style={{ fontFamily: fonts.orbitron, fontSize: 14, color: colors.teal, margin: "4px 0 0" }}>
                ALICE
              </p>
            </div>

            {/* Linha de conexao vertical */}
            <div
              style={{
                width: 2,
                flex: 1,
                backgroundColor: `${colors.muted}40`,
                position: "relative",
              }}
            >
              {/* Mensagens animadas */}
              {turnAnims.map((t, i) => (
                <React.Fragment key={i}>
                  <TurnMessage
                    from="alice"
                    startFrame={t.delay}
                    duration={Math.floor(t.duration * 0.45)}
                  />
                  <TurnMessage
                    from="bob"
                    startFrame={t.delay + Math.floor(t.duration * 0.5)}
                    duration={Math.floor(t.duration * 0.45)}
                  />
                </React.Fragment>
              ))}
            </div>

            {/* Bob */}
            <div style={{ textAlign: "center", zIndex: 1 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  border: `3px solid ${colors.gold}`,
                  backgroundColor: `${colors.gold}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  margin: "0 auto",
                }}
              >
                🧑
              </div>
              <p style={{ fontFamily: fonts.orbitron, fontSize: 14, color: colors.gold, margin: "4px 0 0" }}>
                BOB
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Seta → Tabela */}
        <Arrow startFrame={A.turn1.delay + 10} />

        {/* 2. Tabela de turnos (colunas aparecem conforme mensagens) */}
        <FadeIn startFrame={A.turn1.delay + 10} duration={15}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 16, color: colors.muted, margin: "0 0 6px" }}>
              turns log
            </p>
            <div
              style={{
                padding: "16px 20px",
                backgroundColor: colors.navyMid,
                border: `1px solid ${colors.teal}40`,
                borderRadius: 8,
              }}
            >
              {/* Labels */}
              <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                <div style={{ width: 60 }} />
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    style={{
                      width: 48,
                      textAlign: "center",
                      fontFamily: fonts.rajdhani,
                      fontSize: 12,
                      color: colors.muted,
                      opacity: visibleTurns >= n ? 1 : 0.2,
                    }}
                  >
                    T{n}
                  </div>
                ))}
              </div>

              {/* Rows: Alice + Bob labels + colunas */}
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <div style={{ width: 60, textAlign: "right", paddingRight: 8 }}>
                  <p style={{ fontFamily: fonts.rajdhani, fontSize: 13, color: colors.teal, margin: 0 }}>Alice →</p>
                  <p style={{ fontFamily: fonts.rajdhani, fontSize: 13, color: colors.gold, margin: "4px 0 0" }}>Bob →</p>
                </div>

                {/* Turn columns */}
                <TurnColumn
                  aliceResult={TURNS[0].result}
                  aliceColor={TURNS[0].color}
                  bobResult={TURNS[1].result}
                  bobColor={TURNS[1].color}
                  visible={visibleTurns >= 1}
                />
                <TurnColumn
                  aliceResult={TURNS[2].result}
                  aliceColor={TURNS[2].color}
                  bobResult={TURNS[3].result}
                  bobColor={TURNS[3].color}
                  visible={visibleTurns >= 2}
                />
                <TurnColumn
                  aliceResult={TURNS[4].result}
                  aliceColor={TURNS[4].color}
                  bobResult={TURNS[5].result}
                  bobColor={TURNS[5].color}
                  visible={visibleTurns >= 3}
                />
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Seta → Equacao */}
        <Arrow startFrame={A.equation.delay} />

        {/* 3. Equacao */}
        <FadeIn startFrame={A.equation.delay} duration={15}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 16, color: colors.muted, margin: "0 0 6px" }}>
              circuit
            </p>
            <div
              style={{
                padding: "16px 20px",
                backgroundColor: colors.navyMid,
                border: `1px solid ${colors.teal}40`,
                borderRadius: 8,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                lineHeight: 1.8,
                color: colors.teal,
                textAlign: "left",
              }}
            >
              <div><span style={{ color: colors.muted }}>for</span> t <span style={{ color: colors.muted }}>in</span> turns:</div>
              <div style={{ paddingLeft: 16 }}><span style={{ color: colors.muted }}>assert</span> valid_shot(t)</div>
              <div style={{ paddingLeft: 16 }}><span style={{ color: colors.muted }}>assert</span> hash_matches(t)</div>
              <div style={{ marginTop: 8, color: colors.gold }}>
                winner = compute(turns)
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Seta → Hash */}
        <Arrow startFrame={A.hash.delay} />

        {/* 4. Hash resultado */}
        <FadeIn startFrame={A.hash.delay} duration={15}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: fonts.rajdhani, fontSize: 16, color: colors.muted, margin: "0 0 6px" }}>
              output
            </p>
            <div
              style={{
                padding: "20px 16px",
                backgroundColor: colors.navyMid,
                border: `2px solid ${colors.gold}`,
                borderRadius: 8,
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>🏆</span>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  color: colors.gold,
                  margin: 0,
                  ...textGlow(colors.gold, 8),
                }}
              >
                winner: Alice
              </p>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: colors.muted,
                  margin: "6px 0 0",
                }}
              >
                0x9c2d...f7a1
              </p>
              <p style={{ fontFamily: fonts.rajdhani, fontSize: 13, color: colors.muted, margin: "4px 0 0" }}>
                proof hash
              </p>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Bottom badge */}
      <SlideIn startFrame={A.badge.delay} direction="down" distance={40}>
        <Badge
          label="The circuit IS the referee"
          style={{ fontSize: 20, padding: "12px 24px", marginTop: 12 }}
        />
      </SlideIn>

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
