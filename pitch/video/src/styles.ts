import { CSSProperties } from "react";

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
};

export const fullScreen: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.navyDark,
  fontFamily: "'Rajdhani', sans-serif",
};

export const titleStyle: CSSProperties = {
  fontFamily: "'Orbitron', monospace",
  fontWeight: 700,
  color: colors.gold,
  margin: 0,
};

export const subtitleStyle: CSSProperties = {
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 600,
  color: colors.teal,
  margin: 0,
};

export const bodyStyle: CSSProperties = {
  fontFamily: "'Rajdhani', sans-serif",
  color: colors.white,
  margin: 0,
};

export const codeStyle: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  color: colors.teal,
  fontSize: 20,
};
