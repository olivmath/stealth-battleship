import React, { useEffect, useRef } from 'react';

export function ShipModelViewer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mv = document.createElement('model-viewer');
    mv.setAttribute('src', '/nagato.glb');
    mv.setAttribute('auto-rotate', '');
    mv.setAttribute('auto-rotate-delay', '0');
    mv.setAttribute('rotation-per-second', '12deg');
    mv.setAttribute('camera-orbit', '45deg 70deg 85%');
    mv.setAttribute('min-camera-orbit', 'auto 60deg auto');
    mv.setAttribute('max-camera-orbit', 'auto 85deg auto');
    mv.setAttribute('camera-controls', '');
    mv.setAttribute('disable-zoom', '');
    mv.setAttribute('disable-pan', '');
    mv.setAttribute('interaction-prompt', 'none');
    mv.setAttribute('environment-image', 'neutral');
    mv.setAttribute('shadow-intensity', '0');
    mv.style.width = '100%';
    mv.style.height = '100%';
    mv.style.background = 'transparent';
    mv.style.setProperty('--poster-color', 'transparent');

    container.appendChild(mv);
    return () => { container.removeChild(mv); };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: 280 }} />;
}
