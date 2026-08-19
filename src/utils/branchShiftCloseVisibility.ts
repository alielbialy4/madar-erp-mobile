export type BranchShiftRegisterMode = 'legacy_shared_drawer' | 'multi_register' | string;

export function cashierMayCloseBranchShift(opts: {
  isCashier: boolean;
  registerMode?: BranchShiftRegisterMode | null;
  canManageShifts: boolean;
}): boolean {
  if (!opts.isCashier) return true;
  if (opts.registerMode !== 'multi_register') return true;
  return opts.canManageShifts;
}
