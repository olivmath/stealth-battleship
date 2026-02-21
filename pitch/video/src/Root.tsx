import React from "react";
import { Composition } from "remotion";
import { BattleshipZKVideo } from "./Video";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BattleshipZKDemo"
        component={BattleshipZKVideo}
        durationInFrames={30 * 160} // ~2:40 at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
