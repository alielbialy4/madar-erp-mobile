export type ReceiptPrintLabels = {
  invoice: string;
  invoiceNumber: string;
  orderNumber: string;
  date: string;
  customer: string;
  cashier: string;
  paymentType: string;
  paymentBreakdown: string;
  order: string;
  table: string;
  item: string;
  category: string;
  qty: string;
  price: string;
  total: string;
  subtotal: string;
  tax: string;
  discount: string;
  deliveryFee: string;
  paid: string;
  change: string;
  balance: string;
  notes: string;
  itemsSection: string;
  phonePrefix: string;
  couponWithCode: (code: string) => string;
  couponIncluded: string;
  reprint: string;
  offlineUnsynced: string;
  offlineSyncNote: string;
};

export const receiptPrintLabels: ReceiptPrintLabels = {
  invoice: 'فاتورة بيع',
  invoiceNumber: 'رقم الفاتورة',
  orderNumber: 'رقم الطلب',
  date: 'التاريخ',
  customer: 'العميل',
  cashier: 'الكاشير',
  paymentType: 'طريقة الدفع',
  paymentBreakdown: 'تفاصيل الدفع',
  order: 'الطلب',
  table: 'الطاولة',
  item: 'الصنف',
  category: 'التصنيف',
  qty: 'كمية',
  price: 'السعر',
  total: 'الإجمالي',
  subtotal: 'المجموع',
  tax: 'الضريبة',
  discount: 'خصم',
  deliveryFee: 'رسوم التوصيل',
  paid: 'المدفوع',
  change: 'الباقي',
  balance: 'المتبقي',
  notes: 'ملاحظات',
  itemsSection: 'الأصناف',
  phonePrefix: 'هاتف:',
  couponWithCode: (code) => `منها خصم الكوبون ${code}`,
  couponIncluded: 'منها خصم الكوبون ضمن الخصومات',
  reprint: 'إعادة طباعة',
  offlineUnsynced: '*** غير مزامنة ***',
  offlineSyncNote: 'لم تتم مزامنة هذه الفاتورة بعد',
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'نقدي',
  card: 'بطاقة',
  credit: 'آجل',
  layaway: 'تقسيط',
  split: 'دفع مقسم',
  instapay: 'إنستا باي',
  electronic_wallet: 'محفظة إلكترونية',
  gift_card: 'بطاقة هدايا',
};

export function getPaymentPrintLabel(type: string): string {
  const key = type.trim().toLowerCase();
  return PAYMENT_LABELS[key] ?? type;
}

export type KitchenPrintLabels = {
  kitchen: string;
  bar: string;
  reprint: string;
  orderNumber: string;
  invoiceNumber: string;
  table: string;
  date: string;
  cashier: string;
  orderType: string;
  route: string;
  kitchenNotes: string;
  item: string;
  qty: string;
  systemRef: string;
  developerFooter: string;
};

export const kitchenPrintLabels: KitchenPrintLabels = {
  kitchen: 'المطبخ',
  bar: 'البار',
  reprint: 'إعادة طباعة',
  orderNumber: 'رقم الطلب',
  invoiceNumber: 'رقم الفاتورة',
  table: 'الطاولة',
  date: 'التاريخ',
  cashier: 'الكاشier',
  orderType: 'نوع الطلب',
  route: 'المسار',
  kitchenNotes: 'ملاحظات المطبخ',
  item: 'الصنف',
  qty: 'الكمية',
  systemRef: 'مرجع النظام',
  developerFooter: 'تم التطوير بواسطة madar - 01055566412',
};

export type ShiftClosePrintLabels = {
  title: string;
  shiftNo: string;
  branch: string;
  cashier: string;
  vault: string;
  opened: string;
  closed: string;
  status: string;
  statusOpen: string;
  statusClosed: string;
  openingBalance: string;
  revenueSummary: string;
  grossSales: string;
  totalPaid: string;
  refunds: string;
  netRevenue: string;
  cashSales: string;
  nonCashSales: string;
  creditSalesDeferred: string;
  layawaySalesDeferred: string;
  debtCollections: string;
  layawayCollections: string;
  invoiceCount: string;
  soldProducts: string;
  expenses: string;
  cashMovements: string;
  finalAccounting: string;
  expectedCash: string;
  actualCash: string;
  variance: string;
  developerFooter: string;
};

export const shiftClosePrintLabels: ShiftClosePrintLabels = {
  title: 'تقرير إغلاق الوردية',
  shiftNo: 'رقم الوردية',
  branch: 'الفرع',
  cashier: 'الكاشير',
  vault: 'الخزنة',
  opened: 'فتح',
  closed: 'إغلاق',
  status: 'الحالة',
  statusOpen: 'مفتوحة',
  statusClosed: 'مغلقة',
  openingBalance: 'رصيد الافتتاح',
  revenueSummary: 'ملخص الإيرادات',
  grossSales: 'إجمالي المبيعات',
  totalPaid: 'إجمالي المدفوع',
  refunds: 'المرتجعات',
  netRevenue: 'صافي الإيراد',
  cashSales: 'مبيعات نقدية',
  nonCashSales: 'مبيعات غير نقدية',
  creditSalesDeferred: 'مبيعات آجل (إجمالي الفواتير)',
  layawaySalesDeferred: 'مبيعات تقسيط (إجمالي الفواتير)',
  debtCollections: 'تحصيل ديون عملاء',
  layawayCollections: 'تحصيل أقساط تقسيط',
  invoiceCount: 'عدد الفواتير',
  soldProducts: 'المنتجات المباعة',
  expenses: 'المصروفات',
  cashMovements: 'حركات النقدية',
  finalAccounting: 'المحاسبة النهائية',
  expectedCash: 'النقدية المتوقعة',
  actualCash: 'النقدية الفعلية',
  variance: 'الفرق',
  developerFooter: 'تم التطوير بواسطة madar - 01055566412',
};
