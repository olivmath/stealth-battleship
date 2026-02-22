import React from "react";
import { colors, fonts, shadows } from "../theme";

interface FlowStepProps {
  step: number;
  title: string;
  detail: string;
  isLast?: boolean;
}

export function FlowStep({ step, title, detail, isLast = false }: FlowStepProps) {
  return (
    <div style={{ display: "flex", gap: 20 }}>
      {/* Timeline line + dot */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 32,
        flexShrink: 0,
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: `2px solid ${colors.teal}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.title,
          fontSize: "12px",
          fontWeight: 700,
          color: colors.teal,
          textShadow: shadows.textTeal,
          background: colors.bg,
          flexShrink: 0,
        }}>
          {step}
        </div>
        {!isLast && (
          <div style={{
            width: 1,
            flex: 1,
            background: `linear-gradient(180deg, ${colors.teal}44, transparent)`,
            minHeight: 20,
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ paddingBottom: isLast ? 0 : 12 }}>
        <div style={{
          fontFamily: fonts.body,
          fontSize: "20px",
          fontWeight: 700,
          color: colors.whiteBright,
          lineHeight: 1.3,
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: fonts.mono,
          fontSize: "13px",
          color: colors.mutedLight,
          marginTop: 2,
        }}>
          {detail}
        </div>
      </div>
    </div>
  );
}
