import type { MoreStackParamList } from '@/types/navigation';

type InventoryMovementScreen = Extract<
  keyof MoreStackParamList,
  | 'StockTransferDetail'
  | 'StockAdjustmentDetail'
  | 'StockCountDetail'
  | 'PurchaseDetail'
  | 'RequisitionDetail'
>;

export type MovementSourceResolvable = {
  movement_type?: string;
  reference_type?: string | null;
  reference_id?: string | null;
  reference_parent_id?: string | number | null;
  product_id?: number;
  warehouse_id?: string | null;
};

export type MovementLinkTarget =
  | { screen: 'StockTransferDetail'; params: MoreStackParamList['StockTransferDetail']; label: string }
  | { screen: 'StockAdjustmentDetail'; params: MoreStackParamList['StockAdjustmentDetail']; label: string }
  | { screen: 'StockCountDetail'; params: MoreStackParamList['StockCountDetail']; label: string }
  | { screen: 'PurchaseDetail'; params: MoreStackParamList['PurchaseDetail']; label: string }
  | { screen: 'RequisitionDetail'; params: MoreStackParamList['RequisitionDetail']; label: string };

const REFERENCE_ROUTES: Record<string, { screen: InventoryMovementScreen; label: string }> = {
  stock_transfer: { screen: 'StockTransferDetail', label: 'فتح التحويل' },
  stock_adjustment: { screen: 'StockAdjustmentDetail', label: 'فتح التسوية' },
  stock_count: { screen: 'StockCountDetail', label: 'فتح الجرد' },
  purchase: { screen: 'PurchaseDetail', label: 'فتح أمر الشراء' },
  requisition: { screen: 'RequisitionDetail', label: 'فتح الطلب' },
};

export function resolveMovementLink(row: MovementSourceResolvable): MovementLinkTarget | null {
  const refType = String(row.reference_type ?? row.movement_type ?? '').toLowerCase();
  const refId = row.reference_id ?? row.reference_parent_id;
  if (!refId) return null;

  const route = REFERENCE_ROUTES[refType];
  if (!route) return null;

  if (route.screen === 'PurchaseDetail') {
    return {
      screen: 'PurchaseDetail',
      params: { id: Number(refId) },
      label: route.label,
    };
  }
  if (route.screen === 'StockTransferDetail') {
    return { screen: 'StockTransferDetail', params: { id: String(refId) }, label: route.label };
  }
  if (route.screen === 'StockAdjustmentDetail') {
    return { screen: 'StockAdjustmentDetail', params: { id: String(refId) }, label: route.label };
  }
  if (route.screen === 'StockCountDetail') {
    return { screen: 'StockCountDetail', params: { id: String(refId) }, label: route.label };
  }
  return { screen: 'RequisitionDetail', params: { id: String(refId) }, label: route.label };
}

export const MOVEMENT_TYPE_LABEL_AR: Record<string, string> = {
  sale: 'بيع',
  refund: 'مرتجع',
  purchase: 'شراء',
  purchase_return: 'مرتجع شراء',
  transfer: 'تحويل',
  adjustment: 'تسوية',
  stock_count: 'جرد',
  manual_in: 'إدخال يدوي',
  manual_out: 'إخراج يدوي',
  damage: 'تالف',
  requisition: 'طلب داخلي',
};

export function movementTypeLabel(row: MovementSourceResolvable & { movement_type_label_ar?: string }): string {
  if (row.movement_type_label_ar) return row.movement_type_label_ar;
  const type = row.movement_type;
  if (type && MOVEMENT_TYPE_LABEL_AR[type]) return MOVEMENT_TYPE_LABEL_AR[type];
  return type ?? 'حركة';
}
