import { useState, useEffect } from 'react';

export const BREAKPOINTS = { mobile: 0, tablet: 768, desktop: 1024 } as const;
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useResponsive() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const breakpoint: Breakpoint =
    width >= BREAKPOINTS.desktop ? 'desktop' :
    width >= BREAKPOINTS.tablet ? 'tablet' :
    'mobile';
  const isMobile = breakpoint === 'mobile';
  const isDesktop = breakpoint === 'desktop';
  return { width, breakpoint, isMobile, isDesktop };
}
