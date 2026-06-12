import React from 'react';
import { AppText } from '@/components/ui';
import { textLtr } from '@/constants/layout';
import { money, numberText } from '@/utils/format';

const tabularNums = { fontVariant: ['tabular-nums'] as ('tabular-nums')[] };

export function numMeta(value: unknown, digits = 4): React.ReactNode {
  const n = Number(value);
  const text = Number.isFinite(n)
    ? n.toLocaleString('ar-EG-u-nu-latn', { maximumFractionDigits: digits })
    : '0';
  return <AppText style={[textLtr, tabularNums]}>{text}</AppText>;
}

export function moneyMeta(value: unknown): React.ReactNode {
  return <AppText style={[textLtr, tabularNums]}>{money(value)}</AppText>;
}

export function barcodeMeta(value: unknown): React.ReactNode {
  const text = value == null || value === '' ? '—' : String(value);
  return <AppText style={[textLtr, { fontFamily: 'monospace' }]}>{text}</AppText>;
}

export function pctMeta(value: unknown, digits = 1): React.ReactNode {
  const n = Number(value);
  if (!Number.isFinite(n)) return <AppText style={textLtr}>—</AppText>;
  return <AppText style={[textLtr, tabularNums]}>{`${n.toLocaleString('ar-EG-u-nu-latn', { maximumFractionDigits: digits })}%`}</AppText>;
}

export function textMeta(value: unknown, fallback = '—'): React.ReactNode {
  const text = value == null || value === '' ? fallback : String(value);
  return <AppText>{text}</AppText>;
}

export function countMeta(value: unknown): React.ReactNode {
  return <AppText style={[textLtr, tabularNums]}>{numberText(value)}</AppText>;
}
