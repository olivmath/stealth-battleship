import React from "react";
import { colors, fonts } from "../theme";

interface HudCardProps {
  children: React.ReactNode;
  borderColor?: string;
  width?: string | number;
  glowing?: boolean;
  label?: string;
}

export function HudCard({
  children,
  borderColor = colors.teal,
  width,
  glowing = false,
  label,
}: HudCardProps) {
  return (
    <div style={{
      position: "relative",
      background: colors.bgCard,
      border: `1px solid ${glowing ? borderColor : colors.border}`,
      padding: "24px 28px",
      width,
      animation: glowing ? "borderGlow 3s ease-in-out infinite" : undefined,
      boxShadow: glowing ? `0 0 20px ${borderColor}33, inset 0 0 20px ${borderColor}08` : undefined,
    }}>
      {/* Corner ticks */}
      <CornerTick position="top-left" color={borderColor} />
      <CornerTick position="top-right" color={borderColor} />
      <CornerTick position="bottom-left" color={borderColor} />
      <CornerTick position="bottom-right" color={borderColor} />

      {label && (
        <div style={{
          position: "absolute",
          top: -10,
          left: 20,
          background: colors.bg,
          padding: "0 8px",
          fontFamily: fonts.mono,
          fontSize: "11px",
          color: borderColor,
          letterSpacing: "2px",
          textTransform: "uppercase",
        }}>
          {label}
        </div>
      )}

      {children}
    </div>
  );
}

function CornerTick({ position, color }: { position: string; color: string }) {
  const size = 8;
  const isTop = position.includes("top");
  const isLeft = position.includes("left");

  return (
    <div style={{
      position: "absolute",
      top: isTop ? -1 : "auto",
      bottom: !isTop ? -1 : "auto",
      left: isLeft ? -1 : "auto",
      right: !isLeft ? -1 : "auto",
      width: size,
      height: size,
      borderTop: isTop ? `2px solid ${color}` : "none",
      borderBottom: !isTop ? `2px solid ${color}` : "none",
      borderLeft: isLeft ? `2px solid ${color}` : "none",
      borderRight: !isLeft ? `2px solid ${color}` : "none",
    }} />
  );
}
