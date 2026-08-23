export type PrintSequenceMode = 'branch_continuous' | 'wrap_from_one' | 'manual_start';

export function parsePrintSequenceMode(raw: unknown): PrintSequenceMode {
  if (raw === 'wrap_from_one' || raw === 'manual_start') return raw;
  return 'branch_continuous';
}

export function isPrintSequenceOptIn(mode: PrintSequenceMode): boolean {
  return mode === 'wrap_from_one' || mode === 'manual_start';
}
