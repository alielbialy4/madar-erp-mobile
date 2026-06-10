import { movementTypeLabel, resolveMovementLink } from '@/services/inventory/movementLinks';

describe('movementLinks', () => {
  it('resolves stock transfer deep link', () => {
    const link = resolveMovementLink({
      reference_type: 'stock_transfer',
      reference_id: '42',
    });
    expect(link).toEqual({
      screen: 'StockTransferDetail',
      params: { id: '42' },
      label: 'فتح التحويل',
    });
  });

  it('ignores sale references outside More stack', () => {
    expect(
      resolveMovementLink({
        movement_type: 'sale',
        reference_type: 'sale',
        reference_id: '7',
      }),
    ).toBeNull();
  });

  it('returns null when reference id missing', () => {
    expect(resolveMovementLink({ reference_type: 'stock_adjustment' })).toBeNull();
  });

  it('labels known movement types in Arabic', () => {
    expect(movementTypeLabel({ movement_type: 'transfer' })).toBe('تحويل');
    expect(movementTypeLabel({ movement_type_label_ar: 'مخصص' })).toBe('مخصص');
  });
});
