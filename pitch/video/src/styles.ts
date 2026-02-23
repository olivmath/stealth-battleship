import { CSSProperties } from "react";
import { loadFont as loadOrbitron } from "@remotion/google-fonts/Orbitron";
import { loadFont as loadRajdhani } from "@remotion/google-fonts/Rajdhani";

const { fontFamily: orbitronFamily } = loadOrbitron();
const { fontFamily: rajdhaniFamily } = loadRajdhani();

export const fonts = {
  orbitron: orbitronFamily,
  rajdhani: rajdhaniFamily,
};

export const colors = {
  navyDark: "#0a1628",
  navyMid: "#1a2a4a",
  gold: "#c9a634",
  fireOrange: "#ff6b35",
  teal: "#00d4aa",
  white: "#e8e8e8",
  redAlert: "#ff3a3a",
  greenSafe: "#4ade80",
  muted: "#6b7280",
  stellarBlue: "#2845a0",
  convexPurple: "#7c3aed",
};

// ── Spacing tokens for consistent hierarchy ──
export const SPACING = {
  sceneTop: 60,
  titleToContent: 40,
  contentToFooter: 28,
  pipelineGap: 28,
  labelGap: 8,
  sceneBottom: 100,
} as const;

// ── Scene layout: title zone → content → footer ──
export const sceneContainer: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: colors.navyDark,
  fontFamily: fonts.rajdhani,
  paddingTop: SPACING.sceneTop,
  paddingBottom: SPACING.sceneBottom,
  boxSizing: "border-box",
};

export const titleBlock: CSSProperties = {
  textAlign: "center",
  marginBottom: SPACING.titleToContent,
  flexShrink: 0,
};

export const contentZone: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  width: "100%",
  paddingLeft: 60,
  paddingRight: 60,
  boxSizing: "border-box",
};

export const footerZone: CSSProperties = {
  marginTop: SPACING.contentToFooter,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
  flexShrink: 0,
};

export const sectionLabel: CSSProperties = {
  fontFamily: fonts.rajdhani,
  fontSize: 16,
  color: colors.muted,
  margin: `0 0 ${SPACING.labelGap}px`,
};

// ── Legacy aliases ──
export const fullScreen: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.navyDark,
  fontFamily: fonts.rajdhani,
};

export const titleStyle: CSSProperties = {
  fontFamily: fonts.orbitron,
  fontWeight: 700,
  color: colors.gold,
  margin: 0,
};

export const subtitleStyle: CSSProperties = {
  fontFamily: fonts.rajdhani,
  fontWeight: 600,
  color: colors.teal,
  margin: 0,
};

export const bodyStyle: CSSProperties = {
  fontFamily: fonts.rajdhani,
  color: colors.white,
  margin: 0,
};

export const codeStyle: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  color: colors.teal,
  fontSize: 20,
};

export const textGlow = (color: string, blur = 20): CSSProperties => ({
  textShadow: `0 0 ${blur}px ${color}, 0 0 ${blur * 2}px ${color}40`,
});

export const cardStyle = (borderColor: string): CSSProperties => ({
  backgroundColor: colors.navyMid,
  borderRadius: 12,
  padding: 30,
  border: `2px solid ${borderColor}`,
});
