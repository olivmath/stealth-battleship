import React from "react";
import { colors, fonts, shadows } from "../theme";

interface GlowQuoteProps {
  children: React.ReactNode;
  color?: string;
  size?: string;
}

export function GlowQuote({ children, color = colors.gold, size = "30px" }: GlowQuoteProps) {
  const shadow =
    color === colors.gold ? shadows.textGold :
    color === colors.teal ? shadows.textTeal :
    color === colors.fireOrange ? shadows.textFire :
    color === colors.redAlert ? shadows.textRed :
    shadows.textTeal;

  return (
    <div style={{
      textAlign: "center",
      fontFamily: fonts.body,
      fontSize: size,
      fontWeight: 700,
      color,
      textShadow: shadow,
      padding: "16px 0",
      position: "relative",
    }}>
      <span style={{
        fontFamily: fonts.mono,
        fontSize: "18px",
        opacity: 0.3,
        marginRight: 8,
      }}>&gt;</span>
      {children}
    </div>
  );
}
