import React from "react";
import { colors, fonts } from "../theme";

interface TechRowProps {
  label: string;
  value: string;
  accent?: string;
}

export function TechRow({ label, value, accent = colors.teal }: TechRowProps) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 0",
      borderBottom: `1px solid ${colors.border}`,
      width: "100%",
      maxWidth: 600,
    }}>
      <span style={{
        fontFamily: fonts.mono,
        fontSize: "14px",
        color: colors.muted,
        letterSpacing: "1px",
        textTransform: "uppercase",
      }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 4,
          height: 4,
          background: accent,
          borderRadius: "50%",
          boxShadow: `0 0 6px ${accent}`,
        }} />
        <span style={{
          fontFamily: fonts.body,
          fontSize: "20px",
          color: colors.whiteBright,
          fontWeight: 600,
        }}>
          {value}
        </span>
      </div>
    </div>
  );
}
