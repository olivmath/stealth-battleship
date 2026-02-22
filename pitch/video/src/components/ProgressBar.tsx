import React from "react";
import { useCurrentFrame } from "remotion";
import { CONFIG, SCENE_ORDER, SCENE_COLORS, TOTAL_FRAMES, getScene } from "../config";
import { colors } from "../styles";

export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = frame / TOTAL_FRAMES;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: 4,
        backgroundColor: `${colors.navyMid}80`,
      }}
    >
      {/* Scene segments */}
      {SCENE_ORDER.map((name) => {
        const scene = getScene(name);
        const left = (scene.start / TOTAL_FRAMES) * 100;
        const width = (scene.duration / TOTAL_FRAMES) * 100;
        const isCurrent = frame >= scene.start && frame < scene.start + scene.duration;

        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: `${left}%`,
              width: `${width}%`,
              height: "100%",
              backgroundColor: isCurrent ? SCENE_COLORS[name] : `${SCENE_COLORS[name]}40`,
              borderRight: `1px solid ${colors.navyDark}`,
            }}
          />
        );
      })}

      {/* Progress indicator */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: `${progress * 100}%`,
          height: "100%",
          backgroundColor: `${colors.white}30`,
        }}
      />

      {/* Playhead */}
      <div
        style={{
          position: "absolute",
          left: `${progress * 100}%`,
          top: -2,
          width: 2,
          height: 8,
          backgroundColor: colors.white,
          transform: "translateX(-50%)",
        }}
      />
    </div>
  );
};
