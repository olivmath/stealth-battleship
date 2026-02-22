import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { fonts, colors } from "../../styles";

interface GlitchTextProps {
  text: string;
  startFrame?: number;
  duration?: number;
  fontSize?: number;
  color?: string;
  style?: React.CSSProperties;
}

export const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  startFrame = 0,
  duration = 30,
  fontSize = 48,
  color = colors.gold,
  style,
}) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startFrame;

  const opacity = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Deterministic jitter using sin — decays over time
  const jitterIntensity = interpolate(elapsed, [0, duration], [6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const redX = Math.sin(elapsed * 7.3) * jitterIntensity;
  const redY = Math.sin(elapsed * 5.1) * jitterIntensity * 0.5;
  const blueX = Math.sin(elapsed * 9.7) * jitterIntensity;
  const blueY = Math.sin(elapsed * 4.3) * jitterIntensity * 0.5;

  const baseStyle: React.CSSProperties = {
    fontFamily: fonts.orbitron,
    fontWeight: 700,
    fontSize,
    color,
    position: "relative",
    ...style,
  };

  const layerStyle = (x: number, y: number, layerColor: string): React.CSSProperties => ({
    position: "absolute",
    top: 0,
    left: 0,
    fontFamily: fonts.orbitron,
    fontWeight: 700,
    fontSize,
    color: layerColor,
    transform: `translate(${x}px, ${y}px)`,
    opacity: 0.5,
    mixBlendMode: "screen",
  });

  return (
    <div style={{ opacity, position: "relative", display: "inline-block" }}>
      <span style={baseStyle}>{text}</span>
      {jitterIntensity > 0.5 && (
        <>
          <span style={layerStyle(redX, redY, "#ff000080")}>{text}</span>
          <span style={layerStyle(blueX, blueY, "#0066ff80")}>{text}</span>
        </>
      )}
    </div>
  );
};
