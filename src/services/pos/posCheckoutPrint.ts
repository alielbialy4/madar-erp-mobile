import type { CartLine } from '@/store/posStore';
import type { PrintJobRecord, ReceiptPrintPayload } from '@/types/printing';
import { resolveReceiptProfile } from '@/services/printing/branchPrintBinding';
import { printEngine } from '@/services/printing/printEngine';
import { resolveKitchenPrintGroups } from '@/services/printing/kitchenRoutingResolver';
import { mapCheckoutToReceiptPayload } from '@/services/printing/receiptMappers';
import { recordPrintTiming } from '@/services/printing/printDiagnostics';
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

function jobOutcome(job: PrintJobRecord): 'printed' | 'failed' | 'queued' {
  if (job.status === 'printed') return 'printed';
  if (job.status === 'pending' || job.status === 'printing') return 'queued';
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

async function printReceiptForCheckout(
  input: PostCheckoutPrintInput,
  printSettings: ReturnType<typeof normalizeBranchPrintSettings>,
): Promise<PostCheckoutPrintResult['receipt']> {
  if (!printSettings.auto_print_receipt) {
    return {
      outcome: 'skipped',
      message: 'طباعة الإيصال التلقائية معطّلة في إعدادات الفرع.',
    };
  }

  const serverProfileId = String(input.catalogSettings.customer_printer_profile_id ?? '');
  const profile = await resolveReceiptProfile(input.branchId, serverProfileId || null);
  if (!profile) {
    return {
      outcome: 'skipped',
      message: 'لم تُحدَّد طابعة إيصال على هذا الجهاز.',
    };
  }

  const payload = buildOnlineReceiptPayload(input);
  try {
    const job = await printEngine.printReceiptCheckout(
      payload,
      profile,
      printSettings.receipt_print_mode,
    );
    const status = jobOutcome(job);
    return {
      outcome: status === 'printed' ? 'printed' : status === 'queued' ? 'queued' : 'failed',
      message:
        status === 'failed'
          ? 'فشلت طباعة الإيصال — راجع قائمة انتظار الطباعة.'
          : status === 'queued'
            ? 'تمت إضافة الإيصال لقائمة انتظار الطباعة.'
            : undefined,
    };
  } catch {
    return {
      outcome: 'failed',
      message: 'فشلت طباعة الإيصال — راجع قائمة انتظار الطباعة.',
    };
  }
}

export async function runPostCheckoutPrint(input: PostCheckoutPrintInput): Promise<PostCheckoutPrintResult> {
  const printSettings = normalizeBranchPrintSettings(input.catalogSettings);

  const result: PostCheckoutPrintResult = {
    receipt: { outcome: 'skipped' },
    kitchen: { outcome: 'skipped', ticketsPrinted: 0, warnings: [] },
  };

  const kitchenEligible =
    printSettings.enable_kitchen_print &&
    !useServerKitchenPrintQueue(input.catalogSettings) &&
    input.cartLines.length > 0;

  let kitchenApiMs: number | null = null;
  const kitchenRoutingPromise = kitchenEligible
    ? (async () => {
        const kitchenApiStartedAt = Date.now();
        const routing = await resolveKitchenPrintGroups({
          branchId: input.branchId,
          cart: input.cartLines,
          products: input.products,
        });
        kitchenApiMs = Date.now() - kitchenApiStartedAt;
        return routing;
      })()
    : Promise.resolve({ groups: [] as Awaited<ReturnType<typeof resolveKitchenPrintGroups>>['groups'], warnings: [] as string[] });

  const [kitchenRouting, receiptResult] = await Promise.all([
    kitchenRoutingPromise,
    printReceiptForCheckout(input, printSettings),
  ]);

  result.receipt = receiptResult;

  if (kitchenApiMs != null) {
    await recordPrintTiming({ kitchen_api_ms: kitchenApiMs });
  }

  if (!printSettings.enable_kitchen_print) {
    result.kitchen = { outcome: 'skipped', ticketsPrinted: 0, warnings: [], message: 'طباعة المطبخ معطّلة.' };
    return result;
  }

  if (useServerKitchenPrintQueue(input.catalogSettings)) {
    result.kitchen = {
      outcome: 'skipped',
      ticketsPrinted: 0,
      warnings: [],
      message:
        'طابور طباعة السيرفر مفعّل — لن تُطبع تذاكر مطبخ محلياً من هذا الجهاز. عطّله لاستخدام IP المحلي.',
    };
    return result;
  }

  if (input.cartLines.length === 0) {
    result.kitchen = { outcome: 'skipped', ticketsPrinted: 0, warnings: [] };
    return result;
  }

  const { groups, warnings } = kitchenRouting;
  result.kitchen.warnings = warnings;

  if (groups.length === 0) {
    result.kitchen.message =
      warnings.length > 0 ? warnings[0] : 'لا توجد أصناف موجّهة لطباعة المطبخ.';
    return result;
  }

  const outcomes = await Promise.all(
    groups.map(async (group) => {
      try {
        const job = await printEngine.printKitchenTicketCheckout(
          buildKitchenPayload(input, group),
          group.profile,
        );
        return jobOutcome(job) === 'printed';
      } catch {
        return false;
      }
    }),
  );
  const printed = outcomes.filter(Boolean).length;
  const failed = outcomes.length - printed;
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

  return result;
}

export { getPaymentPrintLabel };
