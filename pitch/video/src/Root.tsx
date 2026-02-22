import React from "react";
import { Composition, registerRoot } from "remotion";
import { BattleshipZKVideo } from "./Video";
import { CONFIG, TOTAL_FRAMES } from "./config";

const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BattleshipZKTrailer"
      component={BattleshipZKVideo}
      durationInFrames={TOTAL_FRAMES}
      fps={CONFIG.fps}
      width={CONFIG.width}
      height={CONFIG.height}
    />
  );
};

registerRoot(RemotionRoot);
