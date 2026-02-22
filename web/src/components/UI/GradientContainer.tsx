import React, { ReactNode } from 'react';
import styles from './GradientContainer.module.css';

interface Props {
  children: ReactNode;
  style?: React.CSSProperties;
}

export function GradientContainer({ children, style }: Props) {
  return (
    <div className={styles.container} style={style}>
      {children}
    </div>
  );
}
