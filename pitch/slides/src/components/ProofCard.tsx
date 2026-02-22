import React from "react";
import { colors, fonts, shadows } from "../theme";

interface ProofCardProps {
  circuitName: string;
  trigger: string;
  description: string;
  index: number;
}

export function ProofCard({ circuitName, trigger, description, index }: ProofCardProps) {
  return (
    <div style={{
      position: "relative",
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
      padding: "28px 24px",
      width: 280,
      transition: "border-color 0.3s",
    }}>
      {/* Step number */}
      <div style={{
        position: "absolute",
        top: -14,
        left: 20,
        fontFamily: fonts.title,
        fontSize: "28px",
        fontWeight: 900,
        color: colors.teal,
        textShadow: shadows.textTeal,
        lineHeight: 1,
      }}>
        {String(index + 1).padStart(2, "0")}
      </div>

      {/* Circuit name */}
      <div style={{
        fontFamily: fonts.code,
        fontSize: "16px",
        color: colors.gold,
        marginBottom: 8,
        marginTop: 4,
      }}>
        {circuitName}
      </div>

      {/* Trigger */}
      <div style={{
        fontFamily: fonts.body,
        fontSize: "20px",
        color: colors.whiteBright,
        fontWeight: 600,
        marginBottom: 6,
      }}>
        {trigger}
      </div>

      {/* Description */}
      <div style={{
        fontFamily: fonts.body,
        fontSize: "16px",
        color: colors.mutedLight,
      }}>
        {description}
      </div>

      {/* Bottom accent line */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        background: `linear-gradient(90deg, ${colors.teal}, transparent)`,
      }} />
    </div>
  );
}
