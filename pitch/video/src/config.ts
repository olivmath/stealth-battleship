export const FPS = 30;

/** Convert seconds to frames */
export const s = (seconds: number) => Math.round(seconds * FPS);

// ═══════════════════════════════════════════════════════════════
//  TIMELINE — Edite SOMENTE tempos globais aqui [inicio, fim]
//  Tudo em SEGUNDOS absolutos do vídeo.
// ═══════════════════════════════════════════════════════════════

const TIMELINE = {
  // ▸ CENA 1 — HOOK CINEMATIC
  hookCinematic: {
    at: [0, 20],
    blocks: {
      blackSilence: [0, 3],
      oceanFootage: [3, 8],
      quoteWar: [8, 13],
      quoteProve: [13, 17],
      logoReveal: [17, 20],
    },
  },

  // ▸ CENA 2 — O PROBLEMA
  problemSplit: {
    at: [20, 35],
    blocks: {
      appear: [20, 23],
      aliceToServer: [23, 25],
      serverToBob: [25, 27],
      bobToServer: [27, 29],
      serverToAlice: [29, 31],
      zkExpand: [31, 35],
    },
  },

  // ▸ CENA 3 — THREE PROOFS
  threeProofs: {
    at: [35, 80],
    blocks: {
      boardValidity: {
        at: [35, 50],
        anims: {
          title: [35, 37],
          grid: [37, 39],
          matrix: [39, 41],
          equation: [41, 43],
          hash: [43, 46],
          badge: [46, 50],
        },
      },
      shotProof: {
        at: [50, 65],
        anims: {
          title: [50, 52],
          alice: [52, 54],
          coord: [54, 56],
          matrix: [56, 58],
          outputs: [58, 62],
          badge: [62, 65],
        },
      },
      turnsProof: {
        at: [65, 80],
        anims: {
          title: [65, 67],
          turn1: [67, 69],
          turn2: [69, 71],
          turn3: [71, 73],
          equation: [73, 76],
          hash: [76, 78],
          badge: [78, 80],
        },
      },
    },
  },

  // ▸ CENA 4 — DEMO PVP (video footage from zkbb.mp4 20-60s)
  demoPvp: {
    at: [80, 120],
    blocks: {
      intro: [80, 84],
      demo: [84, 116],
      fadeOut: [116, 120],
    },
  },

  // ▸ CENA 5 — ARQUITETURA + STELLAR
  architecture: {
    at: [120, 140],
    blocks: {
      players: [120, 123],
      backend: [123, 126],
      messages: [126, 130],
      blockchain: [130, 134],
      protocol25: [134, 138],
      fadeOut: [138, 140],
    },
  },

  // ▸ CENA 6 — ENCERRAMENTO (slide cover style)
  closingEpic: {
    at: [140, 160],
    blocks: {
      footage: [140, 145],
      logoReveal: [145, 148],
      tagline: [148, 153],
      links: [153, 156],
      partnerLogos: [156, 160],
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════════
//  SUBTITLES — Narração sincronizada com o vídeo
// ═══════════════════════════════════════════════════════════════

export interface SubtitleEntry {
  text: string;
  from: number; // seconds
  to: number;   // seconds
}

export const SUBTITLES: SubtitleEntry[] = [
  // Scene 1 — Hook
  { text: "Hey! This is Stealth Battleship —", from: 3, to: 7 },
  { text: "a trustless naval warfare game built on Stellar.", from: 7, to: 11 },
  { text: "\"In war, information is power.\"", from: 11, to: 14 },
  { text: "\"But what if you could prove... without revealing?\"", from: 14, to: 19 },

  // Scene 2 — Problem
  { text: "In regular Battleship, someone always sees both boards.", from: 21, to: 26 },
  { text: "A server, a contract, or an end-game reveal.", from: 26, to: 29 },
  { text: "With ZK proofs, no one ever sees your board.", from: 29, to: 33 },
  { text: "Zero Knowledge. Full Privacy.", from: 33, to: 35 },

  // Scene 3A — Board Validity
  { text: "Here's how it works. Three Noir circuits:", from: 36, to: 39 },
  { text: "Board Validity — proves your board is legal", from: 39, to: 43 },
  { text: "without revealing where anything is.", from: 43, to: 46 },
  { text: "The board is Poseidon-hashed and committed on-chain.", from: 46, to: 50 },

  // Scene 3B — Shot Proof
  { text: "Shot Proof — every hit or miss is proven", from: 51, to: 55 },
  { text: "against your committed board hash.", from: 55, to: 58 },
  { text: "Lying is mathematically impossible.", from: 58, to: 64 },

  // Scene 3C — Turns Proof
  { text: "Turns Proof — the full game replayed inside a circuit", from: 66, to: 71 },
  { text: "to compute and prove the winner.", from: 71, to: 75 },
  { text: "The circuit IS the referee.", from: 75, to: 80 },

  // Scene 4 — Demo PvP (video footage 80-120)
  { text: "Let's see real-time PvP in action.", from: 81, to: 87 },
  { text: "Two players, two devices, zero trust.", from: 87, to: 93 },
  { text: "Matchmaking connects both players instantly.", from: 93, to: 99 },
  { text: "Alice attacks — Bob's device generates the proof.", from: 99, to: 107 },
  { text: "Proof verified on-chain. No one can cheat.", from: 107, to: 116 },

  // Scene 5 — Architecture (120-140)
  { text: "The architecture is hybrid: on-chain + off-chain.", from: 121, to: 126 },
  { text: "Two Soroban transactions per game — open and close.", from: 126, to: 131 },
  { text: "Protocol 25 gives us native BN254 and Poseidon2.", from: 131, to: 136 },
  { text: "Proof verification on-chain is efficient, not emulated.", from: 136, to: 140 },

  // Scene 6 — Closing (140-160)
  { text: "ZK isn't a feature — it IS the game.", from: 141, to: 146 },
  { text: "Fair by math. Fun by design.", from: 147, to: 153 },
  { text: "Built for Stellar Hacks 2026. Thanks for watching.", from: 154, to: 159 },
];

// ═══════════════════════════════════════════════════════════════
//  Derivação automática — NÃO EDITE abaixo
// ═══════════════════════════════════════════════════════════════

type Pair = readonly [number, number];

const span = ([from, to]: Pair) => ({ start: s(from), duration: s(to - from) });
const rel = ([from, to]: Pair, parent: number) => ({
  start: s(from - parent),
  duration: s(to - from),
});
const anim = ([from, to]: Pair, parent: number) => ({
  delay: s(from - parent),
  duration: s(to - from),
});

const deriveSimpleBlocks = (
  blocks: Record<string, Pair>,
  sceneStart: number
) => {
  const result: Record<string, { start: number; duration: number }> = {};
  for (const [k, pair] of Object.entries(blocks)) {
    result[k] = rel(pair, sceneStart);
  }
  return result;
};

const deriveProofBlock = (
  block: { at: Pair; anims: Record<string, Pair> },
  sceneStart: number
) => {
  const blockStart = block.at[0];
  const animsResult: Record<string, { delay: number; duration: number }> = {};
  for (const [k, pair] of Object.entries(block.anims)) {
    animsResult[k] = anim(pair, blockStart);
  }
  return {
    ...rel(block.at, sceneStart),
    anims: animsResult,
  };
};

export const CONFIG = {
  fps: FPS,
  width: 1920,
  height: 1080,

  scenes: {
    hookCinematic: {
      ...span(TIMELINE.hookCinematic.at),
      blocks: deriveSimpleBlocks(
        TIMELINE.hookCinematic.blocks,
        TIMELINE.hookCinematic.at[0]
      ),
    },
    problemSplit: {
      ...span(TIMELINE.problemSplit.at),
      blocks: deriveSimpleBlocks(
        TIMELINE.problemSplit.blocks,
        TIMELINE.problemSplit.at[0]
      ),
    },
    threeProofs: {
      ...span(TIMELINE.threeProofs.at),
      blocks: {
        boardValidity: deriveProofBlock(
          TIMELINE.threeProofs.blocks.boardValidity,
          TIMELINE.threeProofs.at[0]
        ),
        shotProof: deriveProofBlock(
          TIMELINE.threeProofs.blocks.shotProof,
          TIMELINE.threeProofs.at[0]
        ),
        turnsProof: deriveProofBlock(
          TIMELINE.threeProofs.blocks.turnsProof,
          TIMELINE.threeProofs.at[0]
        ),
      },
    },
    demoPvp: {
      ...span(TIMELINE.demoPvp.at),
      blocks: deriveSimpleBlocks(
        TIMELINE.demoPvp.blocks,
        TIMELINE.demoPvp.at[0]
      ),
    },
    architecture: {
      ...span(TIMELINE.architecture.at),
      blocks: deriveSimpleBlocks(
        TIMELINE.architecture.blocks,
        TIMELINE.architecture.at[0]
      ),
    },
    closingEpic: {
      ...span(TIMELINE.closingEpic.at),
      blocks: deriveSimpleBlocks(
        TIMELINE.closingEpic.blocks,
        TIMELINE.closingEpic.at[0]
      ),
    },
  },
};

export const SCENE_ORDER = [
  "hookCinematic",
  "problemSplit",
  "threeProofs",
  "demoPvp",
  "architecture",
  "closingEpic",
] as const;

export type SceneName = (typeof SCENE_ORDER)[number];

export const TOTAL_FRAMES = (() => {
  const scenes = CONFIG.scenes;
  let max = 0;
  for (const key of SCENE_ORDER) {
    const scene = scenes[key];
    const end = scene.start + scene.duration;
    if (end > max) max = end;
  }
  return max;
})();

export const getScene = (name: SceneName) => CONFIG.scenes[name];

export const SCENE_COLORS: Record<SceneName, string> = {
  hookCinematic: "#1a2a4a",
  problemSplit: "#ff3a3a",
  threeProofs: "#00d4aa",
  demoPvp: "#ff6b35",
  architecture: "#7c3aed",
  closingEpic: "#1a2a4a",
};
