import React from 'react';
import { MetricBlock, type MetricBlockLevel } from '@/components/madar/MetricBlock';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info';
type Tier = 'primary' | 'secondary';

type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
  tier?: Tier;
  icon?: React.ReactNode;
};

/**
 * Legacy adapter → MetricBlock (neutral surface, cue only).
 * Prefer importing MetricBlock directly in new code.
 */
export function AppStatCard({ label, value, hint, tone = 'primary', tier = 'primary' }: Props) {
  const level: MetricBlockLevel = tier === 'primary' ? 'B' : 'C';
  const mapped =
    tone === 'success' ? 'positive'
      : tone === 'danger' ? 'negative'
        : tone === 'warning' ? 'warning'
          : tone === 'info' ? 'info'
            : 'neutral';

  return (
    <MetricBlock
      label={label}
      value={value}
      hint={hint}
      level={level}
      tone={mapped}
      style={{ flex: 1, minWidth: 140 }}
    />
  );
}
