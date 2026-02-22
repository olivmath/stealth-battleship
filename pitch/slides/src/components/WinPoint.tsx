import React from "react";
import { colors, fonts, shadows } from "../theme";

interface WinPointProps {
  number: number;
  text: string;
}

export function WinPoint({ number, text }: WinPointProps) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 20,
      padding: "12px 0",
      borderBottom: `1px solid ${colors.border}`,
    }}>
      <span style={{
        fontFamily: fonts.title,
        fontSize: "32px",
        fontWeight: 900,
        color: colors.gold,
        textShadow: shadows.textGold,
        lineHeight: 1,
        minWidth: 48,
        textAlign: "right",
      }}>
        {number}
      </span>
      <span style={{
        fontFamily: fonts.body,
        fontSize: "21px",
        color: colors.white,
        lineHeight: 1.4,
        paddingTop: 4,
      }}>
        {text}
      </span>
    </div>
  );
}
