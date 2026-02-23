import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, OffthreadVideo, staticFile } from "remotion";
import { CONFIG, s } from "../config";
import { colors, fonts, textGlow, sceneContainer, titleBlock, footerZone } from "../styles";
import { TypewriterText } from "../components/primitives/TypewriterText";
import { FadeIn } from "../components/primitives/FadeIn";
import { ScaleIn } from "../components/primitives/ScaleIn";
import { Badge } from "../components/ui/Badge";

const B = CONFIG.scenes.demoPvp.blocks;

export const DemoPvp: React.FC = () => {
  const frame = useCurrentFrame();

  const showDemo = frame >= B.demo.start;

  // Fade in video
  const videoOpacity = interpolate(
    frame,
    [B.demo.start, B.demo.start + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [B.fadeOut.start, B.fadeOut.start + B.fadeOut.duration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Title opacity — visible during intro, fades when demo starts
  const titleOpacity = interpolate(
    frame,
    [B.demo.start, B.demo.start + 15],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ ...sceneContainer, opacity: fadeOut }}>
      {/* Intro typewriter text */}
      {frame < B.demo.start && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <TypewriterText
            text="Now let's see real-time PvP."
            startFrame={B.intro.start}
            charsPerFrame={0.8}
            style={{
              fontFamily: fonts.orbitron,
              fontSize: 44,
              color: colors.fireOrange,
              ...textGlow(colors.fireOrange, 15),
            }}
          />
        </div>
      )}

      {/* Title overlay (fades out as video takes over) */}
      {showDemo && (
        <div
          style={{
            position: "absolute",
            top: 40,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            opacity: titleOpacity,
            textAlign: "center",
          }}
        >
          <p style={{ fontFamily: fonts.orbitron, fontSize: 20, color: colors.fireOrange, margin: 0 }}>
            PVP MODE
          </p>
          <h2
            style={{
              fontFamily: fonts.orbitron,
              fontSize: 36,
              color: colors.gold,
              margin: "4px 0 0",
              ...textGlow(colors.gold, 12),
            }}
          >
            Real-Time Multiplayer
          </h2>
        </div>
      )}

      {/* Fullscreen video footage from zkbb.mp4 (20-60s) */}
      {showDemo && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: videoOpacity,
            overflow: "hidden",
          }}
        >
          <OffthreadVideo
            src={staticFile("zkbb.mp4")}
            startFrom={s(20)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      )}

      {/* Footer badge — appears in last portion */}
      {frame >= B.demo.start + s(25) && frame < B.fadeOut.start && (
        <div style={{ ...footerZone, zIndex: 2 }}>
          <ScaleIn startFrame={B.demo.start + s(25)}>
            <Badge
              label="Two devices, zero trust, pure math"
              style={{ fontSize: 20, padding: "12px 28px" }}
            />
          </ScaleIn>
        </div>
      )}
    </AbsoluteFill>
  );
};
