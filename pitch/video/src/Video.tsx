import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { CONFIG, SCENE_ORDER, getScene } from "./config";
import { colors } from "./styles";
import { ProgressBar } from "./components/ProgressBar";
import { Subtitles } from "./components/Subtitles";
import { HookCinematic } from "./scenes/HookCinematic";
import { ProblemSplit } from "./scenes/ProblemSplit";
import { ThreeProofs } from "./scenes/ThreeProofs";
import { DemoPvp } from "./scenes/DemoPvp";
import { Architecture } from "./scenes/Architecture";
import { ClosingEpic } from "./scenes/ClosingEpic";

const SCENE_COMPONENTS: Record<(typeof SCENE_ORDER)[number], React.FC> = {
  hookCinematic: HookCinematic,
  problemSplit: ProblemSplit,
  threeProofs: ThreeProofs,
  demoPvp: DemoPvp,
  architecture: Architecture,
  closingEpic: ClosingEpic,
};

export const BattleshipZKVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.navyDark }}>
      {SCENE_ORDER.map((name) => {
        const scene = getScene(name);
        const Component = SCENE_COMPONENTS[name];
        return (
          <Sequence key={name} from={scene.start} durationInFrames={scene.duration}>
            <Component />
          </Sequence>
        );
      })}
      <Subtitles />
      <ProgressBar />
    </AbsoluteFill>
  );
};
