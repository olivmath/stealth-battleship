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
