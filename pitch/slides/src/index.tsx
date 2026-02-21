import React from "react";
import { createRoot } from "react-dom/client";
import {
  Deck,
  Slide,
  Heading,
  Text,
  FlexBox,
  Box,
  CodePane,
  UnorderedList,
  ListItem,
  Appear,
} from "spectacle";
import { colors, fonts } from "./theme";

const deckTheme = {
  colors: {
    primary: colors.white,
    secondary: colors.gold,
    tertiary: colors.navyDark,
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
    <Deck theme={deckTheme}>
      {/* SLIDE 1 — COVER */}
      <Slide backgroundColor={colors.navyDark}>
        <FlexBox flexDirection="column" alignItems="center" justifyContent="center" height="100%">
          <Heading fontSize="72px" color={colors.gold}>
            BATTLESHIP ZK
          </Heading>
          <Text fontSize="28px" color={colors.teal}>
            Trustless Naval Warfare on Stellar
          </Text>
          <Text fontSize="18px" color={colors.muted} margin="40px 0 0 0">
            Stellar Hacks: ZK Gaming 2026 — olivmath
          </Text>
        </FlexBox>
      </Slide>

      {/* SLIDE 2 — THE PROBLEM */}
      <Slide backgroundColor={colors.navyDark}>
        <Heading fontSize="42px" color={colors.redAlert}>
          The Trust Problem
        </Heading>
        <Text color={colors.white}>
          In digital Battleship, someone always sees both boards.
        </Text>
        <FlexBox justifyContent="center" margin="20px 0">
          <Box backgroundColor={colors.navyMid} padding="20px" style={{ borderRadius: 8, border: `2px solid ${colors.redAlert}` }}>
            <Text color={colors.redAlert} fontSize="20px">
              Server sees everything — can cheat
            </Text>
            <Text color={colors.redAlert} fontSize="20px">
              Commit-reveal — loser disconnects
            </Text>
            <Text color={colors.redAlert} fontSize="20px">
              On-chain boards — mempool front-running
            </Text>
          </Box>
        </FlexBox>
        <Appear>
          <Text color={colors.gold} fontSize="32px" style={{ textAlign: "center" }}>
            "Trust me" is not a game mechanic.
          </Text>
        </Appear>
      </Slide>

      {/* SLIDE 3 — THE SOLUTION */}
      <Slide backgroundColor={colors.navyDark}>
        <Heading fontSize="42px" color={colors.teal}>
          Prove-as-You-Go
        </Heading>
        <Text color={colors.white} fontSize="22px">
          No board reveal. Every action generates a ZK proof in real-time.
        </Text>
        <FlexBox justifyContent="space-between" margin="30px 0">
          {[
            { title: "board_validity", desc: "Board is valid", when: "Place ships" },
            { title: "shot_proof", desc: "Hit/miss is honest", when: "Receive shot" },
            { title: "turns_proof", desc: "Winner is proven", when: "Game ends" },
          ].map((c) => (
            <Appear key={c.title}>
              <Box backgroundColor={colors.navyMid} padding="20px" margin="0 10px" style={{ borderRadius: 8, border: `1px solid ${colors.teal}`, width: 280 }}>
                <Text color={colors.gold} fontSize="20px" style={{ fontFamily: fonts.code }}>
                  {c.title}
                </Text>
                <Text color={colors.white} fontSize="18px">{c.when}</Text>
                <Text color={colors.teal} fontSize="16px">{c.desc}</Text>
              </Box>
            </Appear>
          ))}
        </FlexBox>
        <Text color={colors.muted} fontSize="18px" style={{ textAlign: "center" }}>
          Private inputs NEVER leave your device.
        </Text>
      </Slide>

      {/* SLIDE 4 — board_validity */}
      <Slide backgroundColor={colors.navyDark}>
        <Heading fontSize="36px" color={colors.gold}>
          Circuit 1: board_validity
        </Heading>
        <CodePane language="text" theme="vsDark" highlightRanges={[1, 2, [4, 8]]}>
          {`🔒 Private:  board[6][6], nonce
🌐 Public:   board_hash, ship_count, ship_sizes

Constraints:
  ✓ board_hash == Poseidon(board, nonce)
  ✓ Each ship has correct size
  ✓ Ships don't overlap
  ✓ All ships within grid bounds`}
        </CodePane>
        <Text color={colors.muted} fontSize="18px">
          Generated once at placement (~2-5s) — Verified on-chain (Soroban UltraHonk)
        </Text>
      </Slide>

      {/* SLIDE 5 — shot_proof */}
      <Slide backgroundColor={colors.navyDark}>
        <Heading fontSize="36px" color={colors.gold}>
          Circuit 2: shot_proof
        </Heading>
        <CodePane language="text" theme="vsDark">
          {`🔒 Private:  board[6][6], nonce
🌐 Public:   board_hash, row, col, is_hit

Constraints:
  ✓ board_hash matches committed hash
  ✓ is_hit == (board[row][col] == 1)`}
        </CodePane>
        <Text color={colors.muted} fontSize="18px">
          Generated every turn (~1-2s) — Verified off-chain (Convex)
        </Text>
        <Appear>
          <Text color={colors.fireOrange} fontSize="28px" style={{ textAlign: "center" }}>
            Lying is mathematically impossible.
          </Text>
        </Appear>
      </Slide>

      {/* SLIDE 6 — turns_proof */}
      <Slide backgroundColor={colors.navyDark}>
        <Heading fontSize="36px" color={colors.gold}>
          Circuit 3: turns_proof
        </Heading>
        <CodePane language="text" theme="vsDark">
          {`🔒 Private:  both boards, both nonces
🌐 Public:   both hashes, all attacks, winner

Constraints:
  ✓ Both board hashes match
  ✓ Every attack result replayed correctly
  ✓ Winner computed INSIDE the circuit`}
        </CodePane>
        <Appear>
          <Text color={colors.teal} fontSize="28px" style={{ textAlign: "center" }}>
            The circuit IS the referee.
          </Text>
        </Appear>
      </Slide>

      {/* SLIDE 7 — ARCHITECTURE */}
      <Slide backgroundColor={colors.navyDark}>
        <Heading fontSize="36px" color={colors.gold}>
          Architecture
        </Heading>
        <CodePane language="text" theme="vsDark">
          {`PLAYER DEVICE (Noir WASM + Game Engine)
        │               │
   proofs          real-time turns
        │               │
        ▼               ▼
  ┌──────────┐    ┌──────────┐
  │ STELLAR  │    │  CONVEX  │
  │ (Soroban)│    │(off-chain)│
  │          │    │          │
  │ TX1:open │    │matchmake │
  │ TX2:close│    │turns     │
  │ escrow   │    │verify    │
  └──────────┘    └──────────┘`}
        </CodePane>
        <Text color={colors.teal} fontSize="24px" style={{ textAlign: "center" }}>
          Only 2 on-chain transactions per game
        </Text>
      </Slide>

      {/* SLIDE 8 — WHY STELLAR */}
      <Slide backgroundColor={colors.navyDark}>
        <Heading fontSize="36px" color={colors.gold}>
          Why Stellar
        </Heading>
        <UnorderedList>
          <Appear><ListItem><Text color={colors.white} fontSize="22px">Protocol 25 (X-Ray): native BN254 + Poseidon2</Text></ListItem></Appear>
          <Appear><ListItem><Text color={colors.white} fontSize="22px">The EXACT primitives our Noir circuits use</Text></ListItem></Appear>
          <Appear><ListItem><Text color={colors.white} fontSize="22px">Proof verification is native, not emulated</Text></ListItem></Appear>
          <Appear><ListItem><Text color={colors.white} fontSize="22px">Low tx cost → on-chain settlement for every match</Text></ListItem></Appear>
          <Appear><ListItem><Text color={colors.white} fontSize="22px">Game Hub integration: start_game() + end_game()</Text></ListItem></Appear>
        </UnorderedList>
        <Appear>
          <Text color={colors.gold} fontSize="24px" style={{ textAlign: "center" }}>
            Not just "deployed on Stellar" — DESIGNED for Stellar.
          </Text>
        </Appear>
      </Slide>

      {/* SLIDE 9 — TECH STACK */}
      <Slide backgroundColor={colors.navyDark}>
        <Heading fontSize="36px" color={colors.gold}>
          Tech Stack
        </Heading>
        <FlexBox flexDirection="column" alignItems="center">
          {[
            ["ZK Framework", "Noir (Aztec)"],
            ["Proof System", "UltraHonk"],
            ["Hashing", "Poseidon2"],
            ["Proof Gen", "NoirJS + bb.js (client WASM)"],
            ["Contracts", "Soroban (Rust)"],
            ["Backend", "Convex (real-time)"],
            ["Frontend", "React Native / Expo"],
          ].map(([k, v]) => (
            <FlexBox key={k} justifyContent="space-between" width="600px" margin="4px 0">
              <Text color={colors.muted} fontSize="20px">{k}</Text>
              <Text color={colors.white} fontSize="20px">{v}</Text>
            </FlexBox>
          ))}
        </FlexBox>
      </Slide>

      {/* SLIDE 10 — GAMEPLAY FLOW */}
      <Slide backgroundColor={colors.navyDark}>
        <Heading fontSize="36px" color={colors.gold}>
          Gameplay Flow
        </Heading>
        <UnorderedList>
          {[
            "1. Place ships → drag & drop on 6×6 grid",
            "2. ZK commitment → \"Securing your fleet...\" (2-5s)",
            "3. On-chain → Soroban open_match() — TX 1",
            "4. Battle → tap to attack, ZK proves each response",
            "5. Game over → turns_proof → close_match() — TX 2",
            "6. Settlement → winner gets XLM, trustlessly",
          ].map((item) => (
            <Appear key={item}>
              <ListItem>
                <Text color={colors.white} fontSize="22px">{item}</Text>
              </ListItem>
            </Appear>
          ))}
        </UnorderedList>
      </Slide>

      {/* SLIDE 11 — PROJECT STATUS */}
      <Slide backgroundColor={colors.navyDark}>
        <Heading fontSize="36px" color={colors.gold}>
          What's Built
        </Heading>
        <UnorderedList>
          {[
            { text: "3+1 Noir circuits (board, shot, turns, hash)", color: colors.greenSafe },
            { text: "Full mobile game (AI, animations, haptics)", color: colors.greenSafe },
            { text: "Match history + ranking (6 ranks)", color: colors.greenSafe },
            { text: "i18n (EN, PT-BR, ES)", color: colors.greenSafe },
            { text: "ZK Service (WebView proof gen)", color: colors.gold },
            { text: "Soroban contract + Game Hub", color: colors.gold },
          ].map((item) => (
            <ListItem key={item.text}>
              <Text color={item.color} fontSize="20px">{item.text}</Text>
            </ListItem>
          ))}
        </UnorderedList>
      </Slide>

      {/* SLIDE 12 — WHY WE SHOULD WIN */}
      <Slide backgroundColor={colors.navyDark}>
        <Heading fontSize="36px" color={colors.gold}>
          Why This Should Win
        </Heading>
        <UnorderedList>
          <Appear><ListItem><Text color={colors.white} fontSize="22px">ZK IS the game — remove it, nothing works</Text></ListItem></Appear>
          <Appear><ListItem><Text color={colors.white} fontSize="22px">Hardest ZK problem: per-turn proofs + committed state</Text></ListItem></Appear>
          <Appear><ListItem><Text color={colors.white} fontSize="22px">3 specialized circuits (most projects use 1)</Text></ListItem></Appear>
          <Appear><ListItem><Text color={colors.white} fontSize="22px">Production-quality mobile game, not a POC</Text></ListItem></Appear>
          <Appear><ListItem><Text color={colors.white} fontSize="22px">Stellar-native: designed around P25 primitives</Text></ListItem></Appear>
          <Appear><ListItem><Text color={colors.white} fontSize="22px">Prove-as-you-go eliminates commit-reveal</Text></ListItem></Appear>
        </UnorderedList>
      </Slide>

      {/* SLIDE 13 — CLOSING */}
      <Slide backgroundColor={colors.navyDark}>
        <FlexBox flexDirection="column" alignItems="center" justifyContent="center" height="100%">
          <Heading fontSize="56px" color={colors.gold}>
            BATTLESHIP ZK
          </Heading>
          <Text fontSize="32px" color={colors.teal} margin="20px 0">
            "Fair by math. Fun by design."
          </Text>
          <Text fontSize="20px" color={colors.muted}>
            github.com/olivmath/battleship-zk
          </Text>
          <Text fontSize="16px" color={colors.muted} margin="40px 0 0 0">
            Stellar · Noir · Convex · olivmath
          </Text>
        </FlexBox>
      </Slide>
    </Deck>
  );
}

const root = createRoot(document.getElementById("app")!);
root.render(<Presentation />);
