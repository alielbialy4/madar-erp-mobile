import {
  countActiveInventoryFilters,
  EMPTY_INVENTORY_FILTERS,
  getInventoryGridColumns,
  inventoryFiltersToApiParams,
} from '@/constants/inventoryLayout';

describe('inventoryLayout', () => {
  it('maps balances filters to q-related API params', () => {
    const params = inventoryFiltersToApiParams(
      'balances',
      {
        ...EMPTY_INVENTORY_FILTERS,
        warehouse_id: 'wh-1',
        low_stock_only: true,
      },
      { isGlobalView: true },
    );
    expect(params).toEqual({
      warehouse_id: 'wh-1',
      low_stock_only: 1,
    });
  });

  it('maps movements date filters', () => {
    const params = inventoryFiltersToApiParams(
      'movements',
      {
        ...EMPTY_INVENTORY_FILTERS,
        movement_type: 'sale',
        direction: 'out',
        date_from: '2026-01-01',
        date_to: '2026-01-31',
      },
      { isGlobalView: false, effectiveBranchId: 'branch-1' },
    );
    expect(params).toMatchObject({
      movement_type: 'sale',
      direction: 'out',
      date_from: '2026-01-01',
      date_to: '2026-01-31',
    });
  });

  it('scopes requisitions branch in branch view', () => {
    const params = inventoryFiltersToApiParams(
      'requisitions',
      { ...EMPTY_INVENTORY_FILTERS, status: 'pending' },
      { isGlobalView: false, effectiveBranchId: 'branch-9' },
    );
    expect(params).toEqual({ status: 'pending', branch_id: 'branch-9' });
  });

  it('counts active filters per surface', () => {
    expect(
      countActiveInventoryFilters('expiry', {
        ...EMPTY_INVENTORY_FILTERS,
        near_expiry_only: true,
        expired_only: true,
      }),
    ).toBe(2);
  });

  it('returns grid columns for phone and tablet', () => {
    expect(getInventoryGridColumns(390, 844)).toBe(1);
    expect(getInventoryGridColumns(1024, 768)).toBeGreaterThanOrEqual(2);
  });
});
