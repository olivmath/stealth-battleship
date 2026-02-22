import React from "react";
import { colors, fonts } from "../theme";

interface StatusItemProps {
  text: string;
  status: "done" | "wip";
}

export function StatusItem({ text, status }: StatusItemProps) {
  const dotColor = status === "done" ? colors.greenSafe : colors.yellowWip;
  const label = status === "done" ? "DONE" : "WIP";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "10px 0",
      borderBottom: `1px solid ${colors.border}`,
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: dotColor,
        boxShadow: `0 0 8px ${dotColor}`,
        animation: status === "wip" ? "statusPulse 2s ease-in-out infinite" : undefined,
        color: dotColor,
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: fonts.body,
        fontSize: "20px",
        color: status === "done" ? colors.white : colors.mutedLight,
        flex: 1,
      }}>
        {text}
      </span>
      <span style={{
        fontFamily: fonts.mono,
        fontSize: "10px",
        color: dotColor,
        border: `1px solid ${dotColor}44`,
        padding: "2px 8px",
        letterSpacing: "1px",
      }}>
        {label}
      </span>
    </div>
  );
}
