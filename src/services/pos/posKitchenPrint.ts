import type { CartLine } from '@/store/posStore';
import { getKitchenRoutingRules, resolveKitchenProfilesForCart } from '@/services/offline/kitchenRouting';
import { getPrinterProfile } from '@/services/printing/printerProfiles';
import { printEngine } from '@/services/printing/printEngine';

type ProductRef = { id: number; name: string; category_id?: number | null };

export async function printKitchenFromCart(input: {
  cart: CartLine[];
  products: ProductRef[];
  branchId: string;
  tableName?: string | null;
}): Promise<{ ok: boolean; message: string }> {
  const { cart, products, branchId, tableName } = input;
  if (cart.length === 0) {
    return { ok: false, message: 'السلة فارغة.' };
  }

  const rules = await getKitchenRoutingRules(branchId);
  const groups = resolveKitchenProfilesForCart(cart, products, rules);
  if (groups.length === 0) {
    return { ok: false, message: 'لا توجد أصناف موجهة لطباعة المطبخ. راجع قواعد توجيه المطبخ.' };
  }

  let printed = 0;

  for (const group of groups) {
    const profile = await getPrinterProfile(group.profileId);
    if (!profile?.enabled) continue;
    await printEngine.printKitchenTicket(
      {
        order_label: `POS-${Date.now()}`,
        table_name: tableName ?? 'تيك أواي / سفري',
        items: group.lines.map((line) => ({
          name: line.variant_name ? `${line.product_name} - ${line.variant_name}` : line.product_name,
          quantity: line.quantity,
          notes: line.notes,
          modifiers: line.selected_options?.flatMap((g) => g.options.map((o) => o.name ?? '')),
        })),
        ticket_type: group.ticketType === 'bar' ? 'bar' : 'kitchen',
      },
      profile,
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
