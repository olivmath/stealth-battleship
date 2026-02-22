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
      splitAppear: [20, 28],
      explosion: [28, 30],
      zkExpand: [30, 35],
    },
  },

  // ▸ CENA 3 — THREE PROOFS
  threeProofs: {
    at: [35, 80],
    blocks: {
      // ▸ 3A — Board Validity
      boardValidity: {
        at: [35, 50],
        anims: {
          title: [35, 37],
          gridShips: [37, 40],
          hashFlow: [40, 45],
          badge: [45, 50],
        },
      },
      // ▸ 3B — Shot Proof
      shotProof: {
        at: [50, 65],
        anims: {
          title: [50, 52],
          crosshair: [52, 56],
          explosion: [56, 58],
          hitResult: [58, 62],
          closingText: [62, 65],
        },
      },
      // ▸ 3C — Turns Proof
      turnsProof: {
        at: [65, 80],
        anims: {
          title: [65, 67],
          replay: [67, 71],
          trophy: [71, 75],
          refereeBadge: [75, 80],
        },
      },
    },
  },

  // ▸ CENA 4 — DEMO DO JOGO
  gameDemo: {
    at: [80, 110],
    blocks: {
      letMeShow: [80, 82],
      placement: [82, 87],
      readyProof: [87, 91],
      deployTx: [91, 94],
      battle: [94, 99],
      hitResult: [99, 103],
      gameOver: [103, 108],
      zoomOut: [108, 110],
    },
  },

  // ▸ CENA 5 — ARQUITETURA + STELLAR
  architecture: {
    at: [110, 130],
    blocks: {
      deviceLayer: [110, 114],
      baseLayer: [114, 118],
      protocol25: [118, 123],
      txBadge: [123, 128],
      fadeOut: [128, 130],
    },
  },

  // ▸ CENA 6 — ENCERRAMENTO
  closingEpic: {
    at: [130, 150],
    blocks: {
      footage: [130, 135],
      logoReveal: [135, 138],
      tagline: [138, 143],
      links: [143, 147],
      partnerLogos: [147, 150],
    },
  },
} as const;

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
    gameDemo: {
      ...span(TIMELINE.gameDemo.at),
      blocks: deriveSimpleBlocks(
        TIMELINE.gameDemo.blocks,
        TIMELINE.gameDemo.at[0]
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
  "gameDemo",
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
  gameDemo: "#c9a634",
  architecture: "#7c3aed",
  closingEpic: "#1a2a4a",
};
