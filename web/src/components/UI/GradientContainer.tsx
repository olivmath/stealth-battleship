import React from 'react';
import { GRADIENT } from '../../shared/theme';
import styles from './GradientContainer.module.css';

interface GradientContainerProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function GradientContainer({ children, style }: GradientContainerProps) {
  return (
    <div className={styles.container} style={style}>
      {children}
    </div>
  );
}
