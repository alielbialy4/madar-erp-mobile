import React from 'react';
import { MetricBlock } from '@/components/madar/MetricBlock';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info';

type Props = {
  label: string;
  value: string;
  subtitle?: string;
  tone?: Tone;
  icon?: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
};

/** Legacy adapter → MetricBlock. Prefer MetricBlock in new screens. */
export function MetricCard({ label, value, subtitle, tone = 'primary', trend, trendUp }: Props) {
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
      hint={subtitle}
      delta={trend}
      deltaUp={trendUp}
      level="B"
      tone={mapped}
      style={{ minWidth: 140 }}
    />
  );
}
