import React from "react";
import { colors } from "../theme";

const gridBg = `
  repeating-linear-gradient(0deg, transparent, transparent 59px, ${colors.gridLine} 59px, ${colors.gridLine} 60px),
  repeating-linear-gradient(90deg, transparent, transparent 59px, ${colors.gridLine} 59px, ${colors.gridLine} 60px)
`;

const scanlinesBg = `repeating-linear-gradient(
  0deg,
  transparent,
  transparent 2px,
  ${colors.scanline} 2px,
  ${colors.scanline} 4px
)`;

interface NavalSlideProps {
  children: React.ReactNode;
  showRadar?: boolean;
  showCoords?: boolean;
}

export function NavalSlide({ children, showRadar = false, showCoords = true }: NavalSlideProps) {
  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      background: colors.bg,
      overflow: "hidden",
    }}>
      {/* Grid overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: gridBg,
        animation: "gridPulse 8s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* Scanlines */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: scanlinesBg,
        pointerEvents: "none",
        zIndex: 1,
      }} />

      {/* Radar sweep */}
      {showRadar && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 600,
          height: 600,
          marginTop: -300,
          marginLeft: -300,
          borderRadius: "50%",
          background: `conic-gradient(from 0deg, transparent 0deg, ${colors.tealGlow} 15deg, transparent 60deg)`,
          animation: "radarSweep 4s linear infinite",
          opacity: 0.12,
          pointerEvents: "none",
        }} />
      )}

      {/* Corner brackets — HUD frame */}
      {showCoords && (
        <>
          <Corner position="top-left" />
          <Corner position="top-right" />
          <Corner position="bottom-left" />
          <Corner position="bottom-right" />
        </>
      )}

      {/* Content */}
      <div style={{
        position: "relative",
        zIndex: 2,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "60px 80px",
      }}>
        {children}
      </div>
    </div>
  );
}

function Corner({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const size = 24;
  const thickness = 2;
  const offset = 16;
  const color = colors.tealDim;

  const isTop = position.includes("top");
  const isLeft = position.includes("left");

  return (
    <div style={{
      position: "absolute",
      top: isTop ? offset : "auto",
      bottom: !isTop ? offset : "auto",
      left: isLeft ? offset : "auto",
      right: !isLeft ? offset : "auto",
      width: size,
      height: size,
      borderTop: isTop ? `${thickness}px solid ${color}` : "none",
      borderBottom: !isTop ? `${thickness}px solid ${color}` : "none",
      borderLeft: isLeft ? `${thickness}px solid ${color}` : "none",
      borderRight: !isLeft ? `${thickness}px solid ${color}` : "none",
      pointerEvents: "none",
      zIndex: 3,
    }} />
  );
}
