import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { fonts, colors } from "../../styles";

interface HashVisualizationProps {
  startFrame?: number;
  duration?: number;
  hash?: string;
}

const HEX_CHARS = "0123456789abcdef";

// Deterministic hex char from frame and index
const getHexChar = (frame: number, index: number) => {
  const val = Math.abs(Math.sin(frame * 0.3 + index * 7.13)) * 16;
  return HEX_CHARS[Math.floor(val) % 16];
};

export const HashVisualization: React.FC<HashVisualizationProps> = ({
  startFrame = 0,
  duration = 90,
  hash = "0x7a3f8b2c1d4e5f6a9b0c7d8e3f2a1b4c",
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);

  // Phase 1: scatter (0-33%)
  // Phase 2: converge (33-66%)
  // Phase 3: reveal hash (66-100%)
  const phase = elapsed / duration;

  const scatterOpacity = interpolate(phase, [0, 0.1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const convergeProgress = interpolate(phase, [0.33, 0.66], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const revealProgress = interpolate(phase, [0.66, 0.9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (elapsed < 0) return null;

  // Generate 24 floating hex digits
  const digits = Array.from({ length: 24 }, (_, i) => {
    const scatterX = Math.sin(i * 2.7 + elapsed * 0.1) * (1 - convergeProgress) * 200;
    const scatterY = Math.cos(i * 3.1 + elapsed * 0.08) * (1 - convergeProgress) * 100;
    const char = phase > 0.66 ? hash[i + 2] || getHexChar(frame, i) : getHexChar(frame, i);

    return (
      <span
        key={i}
        style={{
          position: "absolute",
          left: `${50 + scatterX}%`,
          top: `${50 + scatterY}%`,
          transform: "translate(-50%, -50%)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 20,
          color: phase > 0.66 ? colors.teal : colors.gold,
          opacity: scatterOpacity * (0.3 + Math.sin(elapsed * 0.1 + i) * 0.3 + 0.3),
          transition: "color 0.3s",
        }}
      >
        {char}
      </span>
    );
  });

  return (
    <div style={{ position: "relative", width: "100%", height: 200 }}>
      {digits}
      {/* Final hash display */}
      {revealProgress > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            opacity: revealProgress,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 24,
            color: colors.teal,
            textShadow: `0 0 20px ${colors.teal}60`,
            whiteSpace: "nowrap",
          }}
        >
          {hash.slice(0, 2 + Math.floor(revealProgress * (hash.length - 2)))}
        </div>
      )}
    </div>
  );
};
