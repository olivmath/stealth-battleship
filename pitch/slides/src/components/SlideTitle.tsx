import React from "react";
import { colors, fonts, shadows } from "../theme";

interface SlideTitleProps {
  label?: string;
  children: React.ReactNode;
  color?: string;
  size?: string;
}

export function SlideTitle({ label, children, color = colors.gold, size = "44px" }: SlideTitleProps) {
  return (
    <div style={{ marginBottom: 32 }}>
      {label && (
        <div style={{
          fontFamily: fonts.mono,
          fontSize: "12px",
          color: colors.teal,
          letterSpacing: "3px",
          textTransform: "uppercase",
          marginBottom: 8,
          opacity: 0.7,
        }}>
          [{label}]
        </div>
      )}
      <h2 style={{
        fontFamily: fonts.title,
        fontSize: size,
        fontWeight: 900,
        color,
        margin: 0,
        textShadow: color === colors.gold ? shadows.textGold : shadows.textTeal,
        lineHeight: 1.1,
      }}>
        {children}
      </h2>
      <div style={{
        width: 80,
        height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        marginTop: 12,
        borderRadius: 1,
      }} />
    </div>
  );
}
