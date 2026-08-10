import { getKitchenRoutingRules, resolveKitchenProfilesForCart } from '@/services/offline/kitchenRouting';
import { resolveKitchenPrintGroups, type KitchenPrintGroup } from '@/services/printing/kitchenRoutingResolver';
import { getPrinterProfile } from '@/services/printing/printerProfiles';
import { printEngine } from '@/services/printing/printEngine';
import type { CartLine } from '@/store/posStore';

type ProductRef = { id: number; name: string; category_id?: number | null };

export function isServerKitchenPrintQueueEnabled(settings: Record<string, unknown> | null | undefined): boolean {
  const v = settings?.use_server_kitchen_print_queue;
  return v === true || v === 1 || v === '1';
}

export async function printKitchenFromCart(input: {
  cart: CartLine[];
  products: ProductRef[];
  branchId: string;
  branchName?: string;
  cashierName?: string;
  tableName?: string | null;
  catalogSettings?: Record<string, unknown> | null;
}): Promise<{ ok: boolean; message: string }> {
  const { cart, products, branchId, branchName, cashierName, tableName, catalogSettings } = input;
  if (cart.length === 0) {
    return { ok: false, message: 'السلة فارغة.' };
  }

  if (isServerKitchenPrintQueueEnabled(catalogSettings)) {
    return {
      ok: true,
      message: 'طباعة المطبخ مفعّلة عبر طابور السيرفر — لن تُرسل نسخة محلية من الجهاز.',
    };
  }

  let groups: KitchenPrintGroup[] = (
    await resolveKitchenPrintGroups({ branchId, cart, products }).catch(() => ({ groups: [], warnings: [] }))
  ).groups;
  if (groups.length === 0) {
    const rules = await getKitchenRoutingRules(branchId);
    const legacyGroups = resolveKitchenProfilesForCart(cart, products, rules);
    groups = [];
    for (const group of legacyGroups) {
      const profile = await getPrinterProfile(group.profileId);
      if (!profile?.enabled) continue;
      groups.push({
        profileId: profile.id,
        profile,
        ticketType: group.ticketType === 'bar' ? 'bar' : 'kitchen',
        lines: group.lines,
      });
    }
  }

  if (groups.length === 0) {
    return { ok: false, message: 'لا توجد أصناف موجهة لطباعة المطبخ. راجع توجيه المطبخ.' };
  }

  let printed = 0;

  for (const group of groups) {
    await printEngine.printKitchenTicket(
      {
        order_label: `POS-${Date.now()}`,
        store_name: branchName,
        date: new Date().toLocaleString('ar-EG-u-nu-latn'),
        cashier_name: cashierName,
        table_name: tableName ?? 'تيك أواي / سفري',
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
        ticket_type: group.ticketType === 'bar' ? 'bar' : 'kitchen',
      },
      group.profile,
    );
    printed += 1;
  }

  if (printed === 0) {
    return { ok: false, message: 'لم يتم إعداد طابعة.' };
  }

  return { ok: true, message: 'تم إرسال الأصناف إلى المطبخ.' };
}

export function isKitchenPrintEnabled(settings: Record<string, unknown> | null | undefined): boolean {
  const v = settings?.enable_kitchen_print;
  return v === true || v === 1 || v === '1';
}
