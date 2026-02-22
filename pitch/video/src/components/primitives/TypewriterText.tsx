import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface TypewriterTextProps {
  text: string;
  startFrame?: number;
  charsPerFrame?: number;
  showCursor?: boolean;
  style?: React.CSSProperties;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startFrame = 0,
  charsPerFrame = 0.5,
  showCursor = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const totalFrames = text.length / charsPerFrame;

  const charCount = Math.min(text.length, Math.floor(elapsed * charsPerFrame));
  const displayed = text.slice(0, charCount);

  const cursorVisible = showCursor && elapsed > 0 && Math.floor(elapsed / 15) % 2 === 0;
  const typingDone = charCount >= text.length;

  const opacity = interpolate(frame, [startFrame, startFrame + 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <span style={{ opacity, ...style }}>
      {displayed}
      {showCursor && (typingDone ? (cursorVisible ? "█" : "\u00A0") : "█")}
    </span>
  );
};
