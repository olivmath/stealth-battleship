import React from "react";
import { fonts, colors } from "../../styles";

interface BadgeProps {
  label: string;
  variant?: "private" | "public" | "default";
  style?: React.CSSProperties;
}

const variantColors = {
  private: { bg: colors.navyMid, border: colors.teal, icon: "🔒" },
  public: { bg: colors.navyMid, border: colors.gold, icon: "🌐" },
  default: { bg: colors.navyMid, border: colors.muted, icon: "" },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = "default", style }) => {
  const v = variantColors[variant];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        backgroundColor: v.bg,
        border: `1px solid ${v.border}`,
        borderRadius: 6,
        fontFamily: fonts.rajdhani,
        fontSize: 18,
        color: colors.white,
        ...style,
      }}
    >
      {v.icon && <span>{v.icon}</span>}
      {label}
    </div>
  );
};
