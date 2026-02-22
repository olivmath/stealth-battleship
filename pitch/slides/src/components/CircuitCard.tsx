import React from "react";
import { colors, fonts, shadows } from "../theme";
import { HudCard } from "./HudCard";

interface CircuitCardProps {
  name: string;
  privateInputs: string;
  publicInputs: string;
  constraints: string[];
  footer: string;
  highlight?: string;
  highlightColor?: string;
}

export function CircuitCard({
  name,
  privateInputs,
  publicInputs,
  constraints,
  footer,
  highlight,
  highlightColor = colors.fireOrange,
}: CircuitCardProps) {
  return (
    <div style={{ flex: 1 }}>
      <HudCard borderColor={colors.teal} glowing>
        {/* Private / Public inputs */}
        <div style={{ marginBottom: 20 }}>
          <InputLine icon="PRIV" color={colors.redAlert} value={privateInputs} />
          <InputLine icon="PUB" color={colors.greenSafe} value={publicInputs} />
        </div>

        {/* Constraints */}
        <div style={{
          fontFamily: fonts.mono,
          fontSize: "14px",
          color: colors.mutedLight,
          marginBottom: 6,
          letterSpacing: "1px",
        }}>
          CONSTRAINTS
        </div>
        {constraints.map((c, i) => (
          <div key={i} style={{
            fontFamily: fonts.code,
            fontSize: "15px",
            color: colors.white,
            padding: "4px 0",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ color: colors.teal, fontSize: "12px" }}>{">"}</span>
            {c}
          </div>
        ))}

        {/* Footer */}
        <div style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: `1px solid ${colors.border}`,
          fontFamily: fonts.body,
          fontSize: "15px",
          color: colors.muted,
        }}>
          {footer}
        </div>
      </HudCard>

      {/* Highlight quote */}
      {highlight && (
        <div style={{
          textAlign: "center",
          marginTop: 24,
          fontFamily: fonts.body,
          fontSize: "26px",
          fontWeight: 700,
          color: highlightColor,
          textShadow: highlightColor === colors.fireOrange ? shadows.textFire : shadows.textTeal,
        }}>
          {highlight}
        </div>
      )}
    </div>
  );
}

function InputLine({ icon, color, value }: { icon: string; color: string; value: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "6px 0",
    }}>
      <span style={{
        fontFamily: fonts.mono,
        fontSize: "10px",
        color: colors.bg,
        background: color,
        padding: "2px 6px",
        letterSpacing: "1px",
        fontWeight: 700,
      }}>
        {icon}
      </span>
      <span style={{
        fontFamily: fonts.code,
        fontSize: "15px",
        color: colors.white,
      }}>
        {value}
      </span>
    </div>
  );
}
