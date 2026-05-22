export type ShiftLike = {
  shift_no?: number | string | null;
  branch?: { name?: string | null } | null;
};

export function formatShiftLabel(
  shift?: ShiftLike | null,
  fallbackShiftId?: string | null,
  fallbackBranchName?: string | null,
): string {
  const branchName = shift?.branch?.name ?? fallbackBranchName ?? null;
  const shiftNo = shift?.shift_no;

  if (branchName && shiftNo != null && String(shiftNo).trim() !== '') {
    return `${branchName} #${shiftNo}`;
  }
  if (shiftNo != null && String(shiftNo).trim() !== '') {
    return `#${shiftNo}`;
  }
  if (fallbackShiftId) {
    return `#${String(fallbackShiftId).slice(-6)}`;
  }
  return '—';
}
