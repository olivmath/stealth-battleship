import React from "react";
import { createRoot } from "react-dom/client";
import { Deck, Slide, Appear } from "spectacle";
import { colors, fonts, shadows } from "./theme";
import {
  NavalSlide,
  SlideTitle,
  HudCard,
  CircuitCard,
  ProofCard,
  StatusItem,
  TechRow,
  GlowQuote,
  FlowStep,
  ArchNode,
  WinPoint,
} from "./components";

const deckTheme = {
  colors: {
    primary: colors.white,
    secondary: colors.gold,
    tertiary: colors.bg,
    quaternary: colors.teal,
  },
  fonts: {
    header: fonts.title,
    text: fonts.body,
    monospace: fonts.code,
  },
  fontSizes: {
    header: "48px",
    text: "24px",
    monospace: "20px",
  },
};

function Presentation() {
  return (
    <Deck theme={deckTheme} template={() => <div />}>
      {/* ═══════════════════════════════════════════
          SLIDE 1 — COVER
          ═══════════════════════════════════════════ */}
      <Slide backgroundColor="transparent" padding={0}>
        <NavalSlide showRadar showCoords>
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}>
            {/* Main title */}
            <div style={{
              fontFamily: fonts.title,
              fontSize: "72px",
              fontWeight: 900,
              color: colors.gold,
              textShadow: shadows.textGold,
              letterSpacing: "6px",
              lineHeight: 1,
            }}>
              STEALTH BATTLESHIP
            </div>

            {/* Divider line */}
            <div style={{
              width: 200,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${colors.teal}, transparent)`,
              margin: "20px 0",
            }} />

            {/* Tagline */}
            <div style={{
              fontFamily: fonts.body,
              fontSize: "26px",
              color: colors.teal,
              fontWeight: 600,
              letterSpacing: "2px",
              textShadow: shadows.textTeal,
            }}>
              Trustless Naval Warfare on Stellar
            </div>

            {/* Logos placeholder */}
            <div style={{
              display: "flex",
              gap: 40,
              marginTop: 48,
              alignItems: "center",
            }}>
              {["STELLAR", "NOIR"].map((name) => (
                <div key={name} style={{
                  fontFamily: fonts.mono,
                  fontSize: "12px",
                  color: colors.muted,
                  border: `1px solid ${colors.border}`,
                  padding: "8px 20px",
                  letterSpacing: "2px",
                }}>
                  {name}
                </div>
              ))}
            </div>

            {/* Event + author */}
            <div style={{
              marginTop: 48,
              fontFamily: fonts.mono,
              fontSize: "14px",
              color: colors.muted,
              letterSpacing: "1px",
            }}>
              Stellar Hacks: ZK Gaming 2026
            </div>
            <div style={{
              fontFamily: fonts.body,
              fontSize: "18px",
              color: colors.mutedLight,
              marginTop: 4,
            }}>
              olivmath
            </div>
          </div>
        </NavalSlide>
      </Slide>

      {/* ═══════════════════════════════════════════
          SLIDE 2 — THE PROBLEM
          ═══════════════════════════════════════════ */}
      <Slide backgroundColor="transparent" padding={0}>
        <NavalSlide>
          <SlideTitle label="Problem" color={colors.redAlert}>
            The Trust Problem
          </SlideTitle>

          <div style={{
            fontFamily: fonts.body,
            fontSize: "24px",
            color: colors.white,
            marginBottom: 28,
          }}>
            In digital Battleship, someone always sees both boards.
          </div>

          {/* Diagram */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            marginBottom: 32,
          }}>
            <HudCard borderColor={colors.mutedLight} width={180}>
              <div style={{ fontFamily: fonts.code, fontSize: "15px", color: colors.white, textAlign: "center" }}>
                Player A<br />
                <span style={{ color: colors.muted, fontSize: "13px" }}>board</span>
              </div>
            </HudCard>

            <div style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: fonts.mono,
                fontSize: "28px",
                color: colors.redAlert,
                textShadow: shadows.textRed,
              }}>
                SERVER
              </div>
              <div style={{ fontFamily: fonts.mono, fontSize: "12px", color: colors.muted }}>
                sees everything
              </div>
            </div>

            <HudCard borderColor={colors.mutedLight} width={180}>
              <div style={{ fontFamily: fonts.code, fontSize: "15px", color: colors.white, textAlign: "center" }}>
                Player B<br />
                <span style={{ color: colors.muted, fontSize: "13px" }}>board</span>
              </div>
            </HudCard>
          </div>

          {/* Problems list */}
          <HudCard borderColor={colors.redAlert} label="VULNERABILITIES">
            <div style={{ display: "flex", gap: 40 }}>
              {[
                "Server can cheat",
                "Commit-reveal? Loser disconnects",
                "On-chain boards? Mempool front-running",
              ].map((t) => (
                <div key={t} style={{
                  fontFamily: fonts.body,
                  fontSize: "17px",
                  color: colors.redAlert,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <span style={{ fontSize: "10px" }}>&#x2716;</span> {t}
                </div>
              ))}
            </div>
          </HudCard>

          <Appear>
            <GlowQuote color={colors.gold} size="28px">
              "Trust me" is not a game mechanic.
            </GlowQuote>
          </Appear>
        </NavalSlide>
      </Slide>

      {/* ═══════════════════════════════════════════
          SLIDE 3 — THE SOLUTION
          ═══════════════════════════════════════════ */}
      <Slide backgroundColor="transparent" padding={0}>
        <NavalSlide>
          <SlideTitle label="Solution" color={colors.teal}>
            Prove-as-You-Go
          </SlideTitle>

          <div style={{
            fontFamily: fonts.body,
            fontSize: "22px",
            color: colors.white,
            marginBottom: 36,
          }}>
            No board reveal. No commit-reveal. Every action generates a ZK proof in real-time.
          </div>

          {/* 3 proof cards */}
          <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
            {[
              { circuit: "board_validity", trigger: "Place ships", desc: '"Board is valid"' },
              { circuit: "shot_proof", trigger: "Receive shot", desc: '"Hit/miss is honest"' },
              { circuit: "turns_proof", trigger: "Game ends", desc: '"Winner is proven"' },
            ].map((p, i) => (
              <Appear key={p.circuit}>
                <ProofCard circuitName={p.circuit} trigger={p.trigger} description={p.desc} index={i} />
              </Appear>
            ))}
          </div>

          <div style={{
            marginTop: 32,
            fontFamily: fonts.mono,
            fontSize: "15px",
            color: colors.teal,
            textAlign: "center",
            textShadow: shadows.textTeal,
            letterSpacing: "1px",
          }}>
            Private inputs NEVER leave your device.
          </div>
        </NavalSlide>
      </Slide>

      {/* ═══════════════════════════════════════════
          SLIDE 4 — board_validity
          ═══════════════════════════════════════════ */}
      <Slide backgroundColor="transparent" padding={0}>
        <NavalSlide>
          <SlideTitle label="Circuit 01">
            board_validity
          </SlideTitle>

          <CircuitCard
            name="board_validity"
            privateInputs="board[6][6], nonce"
            publicInputs="board_hash, ship_count, ship_sizes"
            constraints={[
              "board_hash == Poseidon(board, nonce)",
              "Each ship has correct size",
              "Ships don't overlap",
              "All ships within grid bounds",
            ]}
            footer="Generated once at placement (~2-5s) — Verified on-chain (Soroban UltraHonk)"
          />
        </NavalSlide>
      </Slide>

      {/* ═══════════════════════════════════════════
          SLIDE 5 — shot_proof
          ═══════════════════════════════════════════ */}
      <Slide backgroundColor="transparent" padding={0}>
        <NavalSlide>
          <SlideTitle label="Circuit 02">
            shot_proof
          </SlideTitle>

          <CircuitCard
            name="shot_proof"
            privateInputs="board[6][6], nonce"
            publicInputs="board_hash, row, col, is_hit"
            constraints={[
              "board_hash matches committed hash",
              "is_hit == (board[row][col] == 1)",
            ]}
            footer="Generated every turn (~1-2s) — Verified off-chain (Express + Socket.io) for real-time play"
            highlight="Lying is mathematically impossible."
            highlightColor={colors.fireOrange}
          />
        </NavalSlide>
      </Slide>

      {/* ═══════════════════════════════════════════
          SLIDE 6 — turns_proof
          ═══════════════════════════════════════════ */}
      <Slide backgroundColor="transparent" padding={0}>
        <NavalSlide>
          <SlideTitle label="Circuit 03">
            turns_proof
          </SlideTitle>

          <CircuitCard
            name="turns_proof"
            privateInputs="both boards, both nonces"
            publicInputs="both hashes, all attacks, winner"
            constraints={[
              "Both board hashes match",
              "Every attack result replayed correctly",
              "Winner computed INSIDE the circuit",
            ]}
            footer="Generated at game end — Settled on-chain → BATTLE token clawback to winner"
            highlight="The circuit IS the referee."
            highlightColor={colors.teal}
          />
        </NavalSlide>
      </Slide>

      {/* ═══════════════════════════════════════════
          SLIDE 7 — ARCHITECTURE
          ═══════════════════════════════════════════ */}
      <Slide backgroundColor="transparent" padding={0}>
        <NavalSlide>
          <SlideTitle label="System Design">
            Architecture
          </SlideTitle>

          <div style={{
            fontFamily: fonts.body,
            fontSize: "18px",
            color: colors.mutedLight,
            marginBottom: 32,
          }}>
            Hybrid On-Chain / Off-Chain — 3 blockchain moments per game
          </div>

          {/* Device node */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <ArchNode
              title="PLAYER DEVICE"
              subtitle="CLIENT"
              items={["Noir Circuits (WASM)", "Game Engine (TypeScript)", "Proof Generation"]}
              color={colors.white}
              width={400}
            />

            {/* Connection lines */}
            <div style={{ display: "flex", gap: 120, alignItems: "flex-start" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 1,
                  height: 32,
                  background: `linear-gradient(180deg, ${colors.white}44, ${colors.teal}44)`,
                  margin: "0 auto",
                }} />
                <div style={{
                  fontFamily: fonts.mono,
                  fontSize: "10px",
                  color: colors.muted,
                  letterSpacing: "1px",
                  margin: "4px 0",
                }}>
                  PROOFS
                </div>
                <div style={{
                  width: 1,
                  height: 16,
                  background: `${colors.teal}44`,
                  margin: "0 auto",
                }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 1,
                  height: 32,
                  background: `linear-gradient(180deg, ${colors.white}44, #8b5cf644)`,
                  margin: "0 auto",
                }} />
                <div style={{
                  fontFamily: fonts.mono,
                  fontSize: "10px",
                  color: colors.muted,
                  letterSpacing: "1px",
                  margin: "4px 0",
                }}>
                  REAL-TIME
                </div>
                <div style={{
                  width: 1,
                  height: 16,
                  background: `#8b5cf644`,
                  margin: "0 auto",
                }} />
              </div>
            </div>

            {/* Bottom nodes */}
            <div style={{ display: "flex", gap: 40 }}>
              <ArchNode
                title="STELLAR"
                subtitle="SOROBAN"
                items={["TX1: Payment (XLM + BATTLE)", "TX2: board proofs anchored", "TX3: turns_proof anchored"]}
                color={colors.teal}
              />
              <ArchNode
                title="BACKEND"
                subtitle="EXPRESS + SOCKET.IO + SUPABASE"
                items={["Matchmaking", "Shot verification", "Persistence (Supabase)"]}
                color="#8b5cf6"
              />
            </div>
          </div>
        </NavalSlide>
      </Slide>

      {/* ═══════════════════════════════════════════
          SLIDE 8 — WHY STELLAR
          ═══════════════════════════════════════════ */}
      <Slide backgroundColor="transparent" padding={0}>
        <NavalSlide>
          <SlideTitle label="Blockchain">
            Why Stellar
          </SlideTitle>

          <HudCard borderColor={colors.teal} glowing label="PROTOCOL 25 (X-RAY)">
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
              {[
                { left: "Noir Circuit", arrow: "Poseidon2 hash", desc: "Native hash function" },
                { left: "UltraHonk proof", arrow: "BN254 verify", desc: "Native curve operations" },
                { left: "Soroban contract", arrow: "Native, efficient", desc: "No emulation overhead" },
              ].map((row) => (
                <div key={row.left} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}>
                  <span style={{ fontFamily: fonts.code, fontSize: "15px", color: colors.mutedLight, width: 180 }}>
                    {row.left}
                  </span>
                  <span style={{ color: colors.teal, fontFamily: fonts.mono, fontSize: "14px" }}>&#x2192;</span>
                  <span style={{ fontFamily: fonts.code, fontSize: "15px", color: colors.gold, width: 180 }}>
                    {row.arrow}
                  </span>
                  <span style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.muted }}>
                    {row.desc}
                  </span>
                </div>
              ))}
            </div>
          </HudCard>

          <div style={{ marginTop: 28 }}>
            <GlowQuote color={colors.gold} size="24px">
              Not just "deployed on Stellar" — DESIGNED for Stellar's primitives.
            </GlowQuote>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 32,
            marginTop: 16,
          }}>
            {[
              { label: "GAME HUB", value: "start_game() + end_game()" },
              { label: "CONTRACT", value: "CB4VZAT2...EMYG" },
            ].map((item) => (
              <div key={item.label} style={{
                fontFamily: fonts.mono,
                fontSize: "13px",
                color: colors.muted,
                textAlign: "center",
              }}>
                <span style={{ color: colors.teal, fontSize: "10px", letterSpacing: "2px" }}>{item.label}</span>
                <br />
                <span style={{ color: colors.mutedLight }}>{item.value}</span>
              </div>
            ))}
          </div>
        </NavalSlide>
      </Slide>

      {/* ═══════════════════════════════════════════
          SLIDE 9 — TECH STACK
          ═══════════════════════════════════════════ */}
      <Slide backgroundColor="transparent" padding={0}>
        <NavalSlide>
          <SlideTitle label="Stack">
            Tech Stack
          </SlideTitle>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <TechRow label="ZK Framework" value="Noir (Aztec)" />
            <TechRow label="Proof System" value="UltraHonk" />
            <TechRow label="Hashing" value="Poseidon2" accent={colors.gold} />
            <TechRow label="Proof Gen" value="NoirJS + bb.js (client WASM)" />
            <TechRow label="Contracts" value="Soroban (Rust)" accent={colors.gold} />
            <TechRow label="Real-time" value="Express + Socket.io" accent="#8b5cf6" />
            <TechRow label="Persistence" value="Supabase" accent="#8b5cf6" />
            <TechRow label="Frontend" value="React Native / Expo" />
            <TechRow label="Languages" value="TypeScript, Rust, Noir" accent={colors.gold} />
          </div>
        </NavalSlide>
      </Slide>

      {/* ═══════════════════════════════════════════
          SLIDE 10 — GAMEPLAY FLOW
          ═══════════════════════════════════════════ */}
      <Slide backgroundColor="transparent" padding={0}>
        <NavalSlide>
          <SlideTitle label="Demo">
            Gameplay Flow
          </SlideTitle>

          <div style={{ display: "flex", gap: 60 }}>
            {/* Timeline */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: fonts.mono,
                fontSize: "12px",
                color: colors.teal,
                letterSpacing: "2px",
                marginBottom: 8,
              }}>
                ARCADE — fully local ZK, no backend
              </div>
              {[
                { title: "Place ships", detail: "drag & drop on grid" },
                { title: "ZK commitment", detail: '"Securing your fleet..." (2-5s)' },
                { title: "Battle", detail: "tap to attack, fully local ZK proofs" },
                { title: "Game over", detail: "turns_proof computed locally" },
              ].map((step, i, arr) => (
                <FlowStep
                  key={`arcade-${i}`}
                  step={i + 1}
                  title={step.title}
                  detail={step.detail}
                  isLast={i === arr.length - 1}
                />
              ))}

              <div style={{
                fontFamily: fonts.mono,
                fontSize: "12px",
                color: colors.gold,
                letterSpacing: "2px",
                marginTop: 20,
                marginBottom: 8,
              }}>
                PVP — real-time, ZK-verified on backend + blockchain
              </div>
              {[
                { title: "Payment", detail: "XLM + BATTLE token — TX 1" },
                { title: "BATTLE token", detail: "issued → matchmaking begins" },
                { title: "Placement", detail: "board_validity proof verified server-side" },
                { title: "On-chain", detail: "board proofs anchored — TX 2" },
                { title: "Battle", detail: "shot proofs verified synchronously; invalid = lose" },
                { title: "Reveal", detail: "game over → turns_proof generated" },
                { title: "Settlement", detail: "turns_proof anchored — TX 3 → BATTLE token clawback" },
              ].map((step, i, arr) => (
                <FlowStep
                  key={`pvp-${i}`}
                  step={i + 1}
                  title={step.title}
                  detail={step.detail}
                  isLast={i === arr.length - 1}
                />
              ))}
            </div>

            {/* Screenshot placeholder */}
            <div style={{
              width: 300,
              height: 400,
              border: `1px dashed ${colors.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 8,
            }}>
              <div style={{
                fontFamily: fonts.mono,
                fontSize: "12px",
                color: colors.muted,
                letterSpacing: "2px",
              }}>
                [APP SCREENSHOT]
              </div>
              <div style={{
                fontFamily: fonts.mono,
                fontSize: "10px",
                color: colors.muted,
                opacity: 0.5,
              }}>
                or live demo
              </div>
            </div>
          </div>
        </NavalSlide>
      </Slide>

      {/* ═══════════════════════════════════════════
          SLIDE 11 — PROJECT STATUS
          ═══════════════════════════════════════════ */}
      <Slide backgroundColor="transparent" padding={0}>
        <NavalSlide>
          <SlideTitle label="Progress">
            What's Built
          </SlideTitle>

          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <StatusItem text="3+1 Noir circuits (board, shot, turns, hash_helper)" status="done" />
            <StatusItem text="Full mobile game (AI + Arcade mode, animations, haptics)" status="done" />
            <StatusItem text="Match history + ranking system (6 ranks)" status="done" />
            <StatusItem text="i18n (English, Portuguese, Spanish)" status="done" />
            <StatusItem text="Settings (grid size, battle view mode)" status="done" />
            <StatusItem text="PvP screens + payment flow (UI complete)" status="done" />
            <StatusItem text="ZK Service (WebView proof generation)" status="wip" />
            <StatusItem text="Express + Socket.io backend (PvP real-time)" status="wip" />
            <StatusItem text="Supabase integration (persistence)" status="wip" />
            <StatusItem text="Soroban contract + Game Hub" status="wip" />
            <StatusItem text="Web client for judges" status="wip" />
          </div>
        </NavalSlide>
      </Slide>

      {/* ═══════════════════════════════════════════
          SLIDE 12 — WHY WE SHOULD WIN
          ═══════════════════════════════════════════ */}
      <Slide backgroundColor="transparent" padding={0}>
        <NavalSlide>
          <SlideTitle label="Conclusion">
            Why This Should Win
          </SlideTitle>

          <div style={{ maxWidth: 700 }}>
            <WinPoint number={1} text="ZK IS the game — remove it and nothing works" />
            <WinPoint number={2} text="Hardest ZK gaming problem — per-turn proofs, committed state, interactive verification" />
            <WinPoint number={3} text="3 specialized circuits (most projects use 1)" />
            <WinPoint number={4} text="Production-quality mobile game, not a POC" />
            <WinPoint number={5} text="Stellar-native design using Protocol 25 primitives" />
            <WinPoint number={6} text="Prove-as-you-go eliminates commit-reveal entirely" />
          </div>

          <GlowQuote color={colors.gold} size="28px">
            "Fair by math. Fun by design."
          </GlowQuote>
        </NavalSlide>
      </Slide>

      {/* ═══════════════════════════════════════════
          SLIDE 13 — CLOSING
          ═══════════════════════════════════════════ */}
      <Slide backgroundColor="transparent" padding={0}>
        <NavalSlide showRadar showCoords>
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}>
            <div style={{
              fontFamily: fonts.title,
              fontSize: "60px",
              fontWeight: 900,
              color: colors.gold,
              textShadow: shadows.textGold,
              letterSpacing: "4px",
            }}>
              STEALTH BATTLESHIP
            </div>

            <div style={{
              width: 160,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${colors.teal}, transparent)`,
              margin: "24px 0",
            }} />

            <div style={{
              fontFamily: fonts.body,
              fontSize: "28px",
              fontWeight: 700,
              color: colors.teal,
              textShadow: shadows.textTeal,
              marginBottom: 32,
            }}>
              "Fair by math. Fun by design."
            </div>

            <div style={{
              fontFamily: fonts.code,
              fontSize: "16px",
              color: colors.mutedLight,
              marginBottom: 40,
            }}>
              github.com/olivmath/battleship-zk
            </div>

            {/* Partner logos */}
            <div style={{ display: "flex", gap: 24 }}>
              {["STELLAR", "NOIR", "SUPABASE"].map((name) => (
                <div key={name} style={{
                  fontFamily: fonts.mono,
                  fontSize: "11px",
                  color: colors.muted,
                  border: `1px solid ${colors.border}`,
                  padding: "6px 16px",
                  letterSpacing: "2px",
                }}>
                  {name}
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 40,
              fontFamily: fonts.mono,
              fontSize: "14px",
              color: colors.muted,
            }}>
              olivmath — Stellar Hacks: ZK Gaming 2026
            </div>
          </div>
        </NavalSlide>
      </Slide>
    </Deck>
  );
}

const root = createRoot(document.getElementById("app")!);
root.render(<Presentation />);
