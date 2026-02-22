import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = { mobile: 0, tablet: 768, desktop: 1024 } as const;
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useResponsive() {
  const { width } = useWindowDimensions();
  const breakpoint: Breakpoint =
    width >= BREAKPOINTS.desktop ? 'desktop' :
    width >= BREAKPOINTS.tablet ? 'tablet' :
    'mobile';
  const isMobile = breakpoint === 'mobile';
  const isDesktop = breakpoint === 'desktop';
  return { width, breakpoint, isMobile, isDesktop };
}
