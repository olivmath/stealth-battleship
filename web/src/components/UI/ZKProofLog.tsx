import React, { useState } from 'react';
import styles from './ZKProofLog.module.css';

export interface ZKLogEntry {
  id: string;
  circuit: string;
  timeMs: number;
  sizeBytes: number;
  status: 'ok' | 'fail';
  timestamp: number;
  label: string;
}

interface Props {
  entries: ZKLogEntry[];
}

export function ZKProofLog({ entries }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) return null;

  return (
    <div className={styles.container}>
      <button className={styles.toggle} onClick={() => setExpanded(!expanded)}>
        ZK [{entries.length}] {expanded ? '▼' : '▲'}
      </button>
      {expanded && (
        <div className={styles.list}>
          {entries.map((e) => (
            <div key={e.id} className={`${styles.entry} ${e.status === 'fail' ? styles.entryFail : ''}`}>
              <span className={styles.circuit}>{e.circuit}</span>
              <span className={styles.time}>{(e.timeMs / 1000).toFixed(1)}s</span>
              <span className={styles.size}>{e.sizeBytes}B</span>
              <span className={e.status === 'ok' ? styles.ok : styles.fail}>
                {e.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
