import React from "react";
import { Composition, registerRoot } from "remotion";
import { BattleshipZKVideo } from "./Video";
import { CONFIG, TOTAL_FRAMES, getScene } from "./config";
import { HookCinematic } from "./scenes/HookCinematic";
import { ProblemSplit } from "./scenes/ProblemSplit";
import { ThreeProofs } from "./scenes/ThreeProofs";
import { DemoPvp } from "./scenes/DemoPvp";
import { Architecture } from "./scenes/Architecture";
import { ClosingEpic } from "./scenes/ClosingEpic";

const { fps, width, height } = CONFIG;

const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Trailer completo */}
      <Composition
        id="0-Trailer-Completo"
        component={BattleshipZKVideo}
        durationInFrames={TOTAL_FRAMES}
        fps={fps}
        width={width}
        height={height}
      />

      {/* Cenas individuais */}
      <Composition
        id="1-Hook-Cinematico"
        component={HookCinematic}
        durationInFrames={getScene("hookCinematic").duration}
        fps={fps}
        width={width}
        height={height}
      />
      <Composition
        id="2-O-Problema"
        component={ProblemSplit}
        durationInFrames={getScene("problemSplit").duration}
        fps={fps}
        width={width}
        height={height}
      />
      <Composition
        id="3-Three-Proofs"
        component={ThreeProofs}
        durationInFrames={getScene("threeProofs").duration}
        fps={fps}
        width={width}
        height={height}
      />
      <Composition
        id="4-Demo-PvP"
        component={DemoPvp}
        durationInFrames={getScene("demoPvp").duration}
        fps={fps}
        width={width}
        height={height}
      />
      <Composition
        id="5-Arquitetura"
        component={Architecture}
        durationInFrames={getScene("architecture").duration}
        fps={fps}
        width={width}
        height={height}
      />
      <Composition
        id="6-Encerramento"
        component={ClosingEpic}
        durationInFrames={getScene("closingEpic").duration}
        fps={fps}
        width={width}
        height={height}
      />
    </>
  );
};

registerRoot(RemotionRoot);
