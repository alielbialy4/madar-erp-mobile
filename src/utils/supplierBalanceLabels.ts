export const CURRENT_BALANCE_TOOLTIP =
  'الرصيد الحالي هو صافي المبلغ المستحق بينك وبين المورد. القيمة الموجبة = مستحق للمورد (يمكن «تسوية رصيد المورد» منها). السالبة = رصيد لصالحك عند المورد (استخدم «استخدام رصيد دائن»).';

export const AVAILABLE_CREDIT_TOOLTIP =
  'رصيد مقدم/دائن يمكن استخدامه لتسوية فواتير المورد. يتغيّر عند الدفع على الحساب أو عند التسوية على فاتورة.';

export type SupplierBalanceInterpretation = {
  direction: 'settled' | 'payable' | 'credit';
  label_ar: string;
  hint_ar?: string;
  display_amount?: string;
  signed_amount?: string;
};

export function getCurrentBalanceInterpretation(
  signed: number | string,
  fromApi?: SupplierBalanceInterpretation | null,
): SupplierBalanceInterpretation {
  if (fromApi?.label_ar) {
    return fromApi;
  }

  const n = Number(signed);
  if (!Number.isFinite(n) || Math.abs(n) < 0.0001) {
    return {
      direction: 'settled',
      label_ar: 'لا يوجد رصيد مستحق',
      hint_ar: CURRENT_BALANCE_TOOLTIP,
      display_amount: '0.00',
      signed_amount: '0',
    };
  }

  if (n > 0) {
    return {
      direction: 'payable',
      label_ar: 'مستحق للمورد',
      hint_ar: CURRENT_BALANCE_TOOLTIP,
      display_amount: n.toFixed(2),
      signed_amount: String(n),
    };
  }

  return {
    direction: 'credit',
    label_ar: 'رصيد لصالحك عند المورد',
    hint_ar: CURRENT_BALANCE_TOOLTIP,
    display_amount: Math.abs(n).toFixed(2),
    signed_amount: String(n),
  };
}

export function currentBalanceColorKey(signed: number): 'danger' | 'success' | 'muted' {
  if (signed > 0.0001) return 'danger';
  if (signed < -0.0001) return 'success';
  return 'muted';
}
