import type { CartLine } from '@/store/posStore';
import type { ReceiptPrintPayload } from '@/types/printing';
import { resolveReceiptProfile } from '@/services/printing/branchPrintBinding';
import { printEngine } from '@/services/printing/printEngine';
import { getPrintJobs } from '@/services/printing/printQueue';
import { resolveKitchenPrintGroups } from '@/services/printing/kitchenRoutingResolver';
import { mapCheckoutToReceiptPayload } from '@/services/printing/receiptMappers';
import { getPaymentPrintLabel } from '@/constants/printLabels';
import { normalizeBranchPrintSettings } from '@/utils/branchPrintSettings';
import { useServerKitchenPrintQueue } from '@/services/pos/posKitchenPrint';

type ProductRef = { id: number; name: string; category_id?: number | null };
type CategoryRef = { id: number; name: string };

export type PostCheckoutPrintInput = {
  branchId: string;
  branchName?: string;
  cashierName?: string;
  customerName?: string | null;
  saleId?: number;
  invoiceNumber?: string | null;
  printSequence?: number | string | null;
  cartLines: CartLine[];
  products: ProductRef[];
  categories?: CategoryRef[];
  catalogSettings: Record<string, unknown>;
  receipt: {
    subtotal: number;
    discount: number;
    tax: number;
    deliveryFee?: number;
    total: number;
    paid: number;
    change?: number;
    balance?: number;
    payment_type: string;
    payment_breakdown?: Array<{ label: string; amount: number }>;
    coupon_code?: string | null;
    coupon_discount?: number;
    notes?: string | null;
  };
  orderType?: string | null;
  tableName?: string | null;
};

export type PrintOutcome = 'printed' | 'queued' | 'skipped' | 'failed';

export type PostCheckoutPrintResult = {
  receipt: { outcome: PrintOutcome; message?: string };
  kitchen: { outcome: PrintOutcome; ticketsPrinted: number; warnings: string[]; message?: string };
};

async function jobOutcome(jobId: string): Promise<'printed' | 'failed' | 'queued'> {
  const updated = (await getPrintJobs()).find((j) => j.id === jobId);
  if (updated?.status === 'printed') return 'printed';
  if (updated?.status === 'pending' || updated?.status === 'printing') return 'queued';
  return 'failed';
}

export function buildOnlineReceiptPayload(input: PostCheckoutPrintInput): ReceiptPrintPayload {
  return mapCheckoutToReceiptPayload({
    branchName: input.branchName,
    cashierName: input.cashierName,
    customerName: input.customerName,
    saleId: input.saleId,
    invoiceNumber: input.invoiceNumber,
    printSequence: input.printSequence,
    cartLines: input.cartLines,
    products: input.products,
    categories: input.categories,
    catalogSettings: input.catalogSettings,
    subtotal: input.receipt.subtotal,
    discount: input.receipt.discount,
    tax: input.receipt.tax,
    deliveryFee: input.receipt.deliveryFee,
    total: input.receipt.total,
    paid: input.receipt.paid,
    change: input.receipt.change,
    balance: input.receipt.balance,
    paymentType: input.receipt.payment_type,
    paymentBreakdown: input.receipt.payment_breakdown,
    couponCode: input.receipt.coupon_code,
    couponDiscount: input.receipt.coupon_discount,
    notes: input.receipt.notes,
    orderType: input.orderType,
    tableName: input.tableName,
  });
}

function buildKitchenPayload(input: PostCheckoutPrintInput, group: Awaited<ReturnType<typeof resolveKitchenPrintGroups>>['groups'][0]) {
  return {
    order_label: input.saleId ? `بيع #${input.saleId}` : `POS-${Date.now()}`,
    store_name: input.branchName,
    print_sequence: input.printSequence,
    invoice_number: input.invoiceNumber ?? (input.saleId ? String(input.saleId) : null),
    cashier_name: input.cashierName,
    date: new Date().toLocaleString('ar-EG-u-nu-latn'),
    order_type: input.orderType,
    table_name: input.tableName,
    route_label: group.profile.name,
    items: group.lines.map((line) => ({
      name: line.variant_name ? `${line.product_name} - ${line.variant_name}` : line.product_name,
      quantity: line.quantity,
      notes: line.notes,
      modifiers: line.selected_options?.flatMap((g) => g.options.map((o) => o.name ?? '')),
      options: line.selected_options?.map((g) => ({
        group_title: g.group_title ?? '',
        options: g.options.map((o) => ({ name: o.name ?? '', applied_price: o.applied_price })),
      })),
    })),
    ticket_type: group.ticketType,
  };
}

export async function runPostCheckoutPrint(input: PostCheckoutPrintInput): Promise<PostCheckoutPrintResult> {
  const printSettings = normalizeBranchPrintSettings(input.catalogSettings);
  const serverProfileId = String(input.catalogSettings.customer_printer_profile_id ?? '');

  const result: PostCheckoutPrintResult = {
    receipt: { outcome: 'skipped' },
    kitchen: { outcome: 'skipped', ticketsPrinted: 0, warnings: [] },
  };

  if (printSettings.auto_print_receipt) {
    const profile = await resolveReceiptProfile(input.branchId, serverProfileId || null);
    if (!profile) {
      result.receipt = {
        outcome: 'skipped',
        message: 'لم تُحدَّد طابعة إيصال على هذا الجهاز.',
      };
    } else {
      const payload = buildOnlineReceiptPayload(input);
      try {
        const job = await printEngine.printReceipt(payload, profile);
        const status = await jobOutcome(job.id);
        result.receipt = {
          outcome: status === 'printed' ? 'printed' : status === 'queued' ? 'queued' : 'failed',
          message:
            status === 'failed'
              ? 'فشلت طباعة الإيصال — راجع قائمة انتظار الطباعة.'
              : status === 'queued'
                ? 'تمت إضافة الإيصال لقائمة انتظار الطباعة.'
                : undefined,
        };
      } catch {
        result.receipt = {
          outcome: 'failed',
          message: 'فشلت طباعة الإيصال — راجع قائمة انتظار الطباعة.',
        };
      }
    }
  } else {
    result.receipt = {
      outcome: 'skipped',
      message: 'طباعة الإيصال التلقائية معطّلة في إعدادات الفرع.',
    };
  }

  if (!printSettings.enable_kitchen_print) {
    result.kitchen = { outcome: 'skipped', ticketsPrinted: 0, warnings: [], message: 'طباعة المطبخ معطّلة.' };
  } else if (useServerKitchenPrintQueue(input.catalogSettings)) {
    result.kitchen = {
      outcome: 'skipped',
      ticketsPrinted: 0,
      warnings: [],
      message:
        'طابور طباعة السيرفر مفعّل — لن تُطبع تذاكر مطبخ محلياً من هذا الجهاز. عطّله لاستخدام IP المحلي.',
    };
  } else if (input.cartLines.length === 0) {
    result.kitchen = { outcome: 'skipped', ticketsPrinted: 0, warnings: [] };
  } else {
    const { groups, warnings } = await resolveKitchenPrintGroups({
      branchId: input.branchId,
      cart: input.cartLines,
      products: input.products,
    });
    result.kitchen.warnings = warnings;

    if (groups.length === 0) {
      result.kitchen.message =
        warnings.length > 0 ? warnings[0] : 'لا توجد أصناف موجّهة لطباعة المطبخ.';
    } else {
      let printed = 0;
      let failed = 0;
      for (const group of groups) {
        try {
          const job = await printEngine.printKitchenTicket(buildKitchenPayload(input, group), group.profile);
          const status = await jobOutcome(job.id);
          if (status === 'printed') printed += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }
      result.kitchen.ticketsPrinted = printed;
      if (printed > 0 && failed === 0) {
        result.kitchen.outcome = 'printed';
      } else if (printed > 0) {
        result.kitchen.outcome = 'queued';
        result.kitchen.message = 'بعض تذاكر المطبخ فشلت — راجع قائمة انتظار الطباعة.';
      } else {
        result.kitchen.outcome = 'failed';
        result.kitchen.message = 'فشلت طباعة تذاكر المطبخ — راجع قائمة انتظار الطباعة.';
      }
    }
  }

  return result;
}

export { getPaymentPrintLabel };
