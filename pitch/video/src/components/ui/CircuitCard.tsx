import React from "react";
import { fonts, colors, cardStyle, textGlow } from "../../styles";
import { Badge } from "./Badge";

interface CircuitCardProps {
  name: string;
  subtitle: string;
  details: string[];
  badgeLabel: string;
  badgeVariant?: "private" | "public" | "default";
  style?: React.CSSProperties;
}

export const CircuitCard: React.FC<CircuitCardProps> = ({
  name,
  subtitle,
  details,
  badgeLabel,
  badgeVariant = "default",
  style,
}) => {
  return (
    <div style={{ ...cardStyle(colors.teal), minWidth: 280, ...style }}>
      <p
        style={{
          fontFamily: fonts.orbitron,
          fontSize: 22,
          fontWeight: 700,
          color: colors.gold,
          margin: 0,
          ...textGlow(colors.gold, 10),
        }}
      >
        {name}
      </p>
      <p
        style={{
          fontFamily: fonts.rajdhani,
          fontSize: 18,
          color: colors.teal,
          margin: "6px 0 12px",
        }}
      >
        {subtitle}
      </p>
      {details.map((d, i) => (
        <p
          key={i}
          style={{
            fontFamily: fonts.rajdhani,
            fontSize: 16,
            color: colors.white,
            margin: "2px 0",
          }}
        >
          {d}
        </p>
      ))}
      <div style={{ marginTop: 12 }}>
        <Badge label={badgeLabel} variant={badgeVariant} />
      </div>
    </div>
  );
};
