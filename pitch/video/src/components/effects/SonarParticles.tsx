import React from "react";
import { useCurrentFrame } from "remotion";
import { colors } from "../../styles";

interface SonarParticlesProps {
  count?: number;
  color?: string;
}

// Deterministic particle positions using golden ratio
const generateParticles = (count: number) => {
  const particles = [];
  const phi = 1.618033988749;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: ((i * phi * 137.508) % 100),
      y: ((i * phi * 89.123) % 100),
      size: 2 + (i % 4),
      speed: 0.5 + (i % 3) * 0.3,
      phase: i * 1.7,
    });
  }
  return particles;
};

export const SonarParticles: React.FC<SonarParticlesProps> = ({
  count = 40,
  color = colors.teal,
}) => {
  const frame = useCurrentFrame();
  const particles = React.useMemo(() => generateParticles(count), [count]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p, i) => {
        const x = p.x + Math.sin(frame * 0.02 * p.speed + p.phase) * 3;
        const y = p.y + Math.cos(frame * 0.015 * p.speed + p.phase) * 2;
        const opacity = 0.1 + Math.sin(frame * 0.05 + p.phase) * 0.15 + 0.15;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: color,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
};
