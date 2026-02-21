import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Intro } from "./scenes/Intro";
import { Problem } from "./scenes/Problem";
import { Circuits } from "./scenes/Circuits";
import { Gameplay } from "./scenes/Gameplay";
import { Architecture } from "./scenes/Architecture";
import { Differentials } from "./scenes/Differentials";
import { Closing } from "./scenes/Closing";

// Scene durations in frames (30fps)
const SCENES = {
  intro: { start: 0, duration: 450 },        // 0:00 — 0:15
  problem: { start: 450, duration: 600 },     // 0:15 — 0:35
  circuits: { start: 1050, duration: 900 },   // 0:35 — 1:05
  gameplay: { start: 1950, duration: 750 },   // 1:05 — 1:30
  architecture: { start: 2700, duration: 900 }, // 1:30 — 2:00
  differentials: { start: 3600, duration: 600 }, // 2:00 — 2:20
  closing: { start: 4200, duration: 600 },     // 2:20 — 2:40
};

export const BattleshipZKVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a1628" }}>
      <Sequence from={SCENES.intro.start} durationInFrames={SCENES.intro.duration}>
        <Intro />
      </Sequence>

      <Sequence from={SCENES.problem.start} durationInFrames={SCENES.problem.duration}>
        <Problem />
      </Sequence>

      <Sequence from={SCENES.circuits.start} durationInFrames={SCENES.circuits.duration}>
        <Circuits />
      </Sequence>

      <Sequence from={SCENES.gameplay.start} durationInFrames={SCENES.gameplay.duration}>
        <Gameplay />
      </Sequence>

      <Sequence from={SCENES.architecture.start} durationInFrames={SCENES.architecture.duration}>
        <Architecture />
      </Sequence>

      <Sequence from={SCENES.differentials.start} durationInFrames={SCENES.differentials.duration}>
        <Differentials />
      </Sequence>

      <Sequence from={SCENES.closing.start} durationInFrames={SCENES.closing.duration}>
        <Closing />
      </Sequence>
    </AbsoluteFill>
  );
};
