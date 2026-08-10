export type BranchScopeRequest = {
  branchId: string | null;
  generation: number;
};

/**
 * Invalidates asynchronous work when the active branch changes. A request may
 * update UI state only while both its generation and branch still match.
 */
export function createBranchScopeRequestGuard() {
  let generation = 0;

  return {
    begin(branchId?: string | null): BranchScopeRequest {
      generation += 1;
      return { branchId: branchId ?? null, generation };
    },
    invalidate(): void {
      generation += 1;
    },
    isCurrent(request: BranchScopeRequest, activeBranchId?: string | null): boolean {
      return request.generation === generation && request.branchId === (activeBranchId ?? null);
    },
  };
}
