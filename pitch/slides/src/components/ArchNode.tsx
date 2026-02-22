import React from "react";
import { colors, fonts, shadows } from "../theme";

interface ArchNodeProps {
  title: string;
  subtitle: string;
  items: string[];
  color: string;
  width?: number;
}

export function ArchNode({ title, subtitle, items, color, width = 220 }: ArchNodeProps) {
  return (
    <div style={{
      background: colors.bgCard,
      border: `1px solid ${color}33`,
      padding: "20px",
      width,
      position: "relative",
    }}>
      {/* Top accent */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: color,
        boxShadow: `0 0 10px ${color}66`,
      }} />

      <div style={{
        fontFamily: fonts.title,
        fontSize: "14px",
        fontWeight: 700,
        color,
        marginBottom: 2,
        textShadow: `0 0 8px ${color}44`,
      }}>
        {title}
      </div>
      <div style={{
        fontFamily: fonts.mono,
        fontSize: "11px",
        color: colors.muted,
        marginBottom: 12,
        letterSpacing: "1px",
      }}>
        {subtitle}
      </div>
      {items.map((item, i) => (
        <div key={i} style={{
          fontFamily: fonts.code,
          fontSize: "13px",
          color: colors.mutedLight,
          padding: "3px 0",
        }}>
          {item}
        </div>
      ))}
    </div>
  );
}
