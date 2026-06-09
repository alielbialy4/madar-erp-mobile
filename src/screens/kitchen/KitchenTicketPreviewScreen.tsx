import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { kitchenAPI } from '@/api/kitchen';
import { getKitchenRoutingRules, resolveKitchenProfilesForCart } from '@/services/offline/kitchenRouting';
import { resolveKitchenPrintGroups, type KitchenPrintGroup } from '@/services/printing/kitchenRoutingResolver';
import { getEnabledProfilesByRole, getPrinterProfile } from '@/services/printing/printerProfiles';
import { printEngine } from '@/services/printing/printEngine';
import { getPrintJobs } from '@/services/printing/printQueue';
import type { KitchenTicketPayload } from '@/types/printing';
import type { CartLine } from '@/store/posStore';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { dateText, numberText } from '@/utils/format';
import { textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { useBranchStore } from '@/store/branchStore';
import { useColors } from '@/hooks/useColors';

type TicketPayload = {
  store?: { name?: string | null; kitchen_ticket_font_size?: number | null };
  order?: {
    id?: number;
    invoice_number?: string | null;
    print_sequence?: number | null;
    order_type?: string | null;
    created_at?: string | null;
    cashier_name?: string | null;
    kitchen_notes?: string | null;
    dining_table?: { name?: string | null; number?: string | null } | null;
    items?: {
      id?: number;
      quantity?: number;
      notes?: string | null;
      product?: { id?: number; name?: string | null; category_id?: number | null } | null;
      options?: { group_title?: string; options?: { name?: string | null }[] }[];
    }[];
  };
};

function toPrintPayload(ticket: TicketPayload, itemsOverride?: TicketPayload['order'] extends infer O ? O extends { items?: infer I } ? I : never : never): KitchenTicketPayload {
  const order = ticket.order ?? {};
  const tableName = order.dining_table?.name ?? order.dining_table?.number ?? null;
  const items = itemsOverride ?? order.items ?? [];
  return {
    order_label: String(order.invoice_number ?? order.id ?? 'Kitchen'),
    store_name: ticket.store?.name ?? undefined,
    print_sequence: order.print_sequence ?? null,
    invoice_number: order.invoice_number != null ? String(order.invoice_number) : null,
    cashier_name: order.cashier_name ?? null,
    date: order.created_at ? dateText(order.created_at) : null,
    order_type: order.order_type ?? null,
    table_name: tableName,
    kitchen_notes: order.kitchen_notes ?? null,
    system_ref: order.id != null ? String(order.id) : null,
    is_reprint: true,
    ticket_type: 'kitchen',
    items: items.map((item) => ({
      name: item.product?.name ?? 'صنف',
      quantity: Number(item.quantity ?? 1),
      notes: item.notes ?? undefined,
      modifiers: item.options?.flatMap((group) => group.options?.map((option) => option.name ?? '') ?? []) ?? [],
      options: item.options?.map((group) => ({
        group_title: group.group_title ?? '',
        options: (group.options ?? []).map((opt) => ({ name: opt.name ?? '' })),
      })),
    })),
  };
}

function ticketItemsToCart(order: NonNullable<TicketPayload['order']>): {
  cart: CartLine[];
  products: { id: number; name: string; category_id?: number | null }[];
} {
  const cart: CartLine[] = [];
  const products: { id: number; name: string; category_id?: number | null }[] = [];
  for (const [index, item] of (order.items ?? []).entries()) {
    const productId = Number(item.product?.id ?? 0);
    if (!productId) continue;
    cart.push({
      product_id: productId,
      product_name: item.product?.name ?? 'صنف',
      quantity: Number(item.quantity ?? 1),
      unit_price: 0,
      discount: 0,
    });
    products.push({
      id: productId,
      name: item.product?.name ?? 'صنف',
      category_id: item.product?.category_id ?? null,
    });
  }
  return { cart, products };
}

async function resolveKitchenGroupsForTicket(
  branchId: string,
  ticket: TicketPayload,
): Promise<{ groups: KitchenPrintGroup[]; warnings: string[] }> {
  const order = ticket.order;
  if (!order) return { groups: [], warnings: [] };

  const { cart, products } = ticketItemsToCart(order);
  if (cart.length > 0) {
    const resolved = await resolveKitchenPrintGroups({ branchId, cart, products }).catch(() => ({
      groups: [] as KitchenPrintGroup[],
      warnings: [] as string[],
    }));
    if (resolved.groups.length > 0) {
      return resolved;
    }

    const rules = await getKitchenRoutingRules(branchId);
    const legacyGroups = resolveKitchenProfilesForCart(cart, products, rules);
    const groups: KitchenPrintGroup[] = [];
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
    if (groups.length > 0) {
      return { groups, warnings: resolved.warnings };
    }
  }

  const fallbackProfiles = await getEnabledProfilesByRole('kitchen');
  if (fallbackProfiles.length === 0) {
    return { groups: [], warnings: ['لا يوجد ملف طابعة مطبخ مفعّل.'] };
  }

  const profile = fallbackProfiles[0];
  const fallbackLines: CartLine[] = (order.items ?? []).map((item) => ({
    product_id: Number(item.product?.id ?? 0),
    product_name: item.product?.name ?? 'صنف',
    quantity: Number(item.quantity ?? 1),
    unit_price: 0,
    discount: 0,
  }));

  return {
    groups: [
      {
        profileId: profile.id,
        profile,
        ticketType: profile.role === 'bar' ? 'bar' : 'kitchen',
        lines: fallbackLines,
      },
    ],
    warnings: [],
  };
}

function buildGroupPayload(ticket: TicketPayload, group: KitchenPrintGroup): KitchenTicketPayload {
  const order = ticket.order ?? {};
  const orderItems = order.items ?? [];
  const routedItems = group.lines.map((line) => {
    const source =
      orderItems.find((item) => Number(item.product?.id ?? 0) === line.product_id) ??
      orderItems.find((item) => item.product?.name === line.product_name);
    return {
      product: { name: line.product_name },
      quantity: line.quantity,
      notes: line.notes ?? source?.notes,
      options: source?.options,
    };
  });
  const payload = toPrintPayload(ticket, routedItems);
  payload.route_label = group.profile.name;
  payload.ticket_type = group.ticketType === 'bar' ? 'bar' : 'kitchen';
  payload.order_label = String(order.invoice_number ?? order.id ?? payload.order_label);
  return payload;
}

export function KitchenTicketPreviewScreen({ route, navigation }: { route: any; navigation: any }) {
  const c = useColors();
  const activeBranchId = useBranchStore((s) => s.activeBranch?.id);
  const id = Number(route.params?.id);
  const [ticket, setTicket] = useState<TicketPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) {
      setError('رقم تذكرة غير صالح.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await kitchenAPI.getTicket(id);
      const data = extractData<TicketPayload>(response as never) ?? (response.data as TicketPayload | undefined) ?? null;
      setTicket(data);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const printPayload = useMemo(() => (ticket ? toPrintPayload(ticket) : null), [ticket]);

  const printTicket = async () => {
    if (!printPayload || !ticket) return;
    if (!activeBranchId) {
      setMessage('يجب اختيار فرع قبل الطباعة.');
      return;
    }
    setPrinting(true);
    setMessage(null);
    try {
      const { groups, warnings } = await resolveKitchenGroupsForTicket(activeBranchId, ticket);
      if (groups.length === 0) {
        setMessage(warnings[0] ?? 'لا يوجد ملف طابعة مطبخ مفعّل. أضف ملف طابعة من الإعدادات ثم أعد المحاولة.');
        return;
      }

      let printed = 0;
      let lastJobId: string | undefined;
      for (const group of groups) {
        const payload = buildGroupPayload(ticket, group);
        const job = await printEngine.printKitchenTicket(payload, group.profile);
        lastJobId = job.id;
        printed += 1;
      }

      const updated = lastJobId ? (await getPrintJobs()).find((row) => row.id === lastJobId) : undefined;
      const warningText = warnings.length ? ` ${warnings.join(' ')}` : '';
      if (updated?.status === 'failed') {
        setMessage((updated.error_message || 'تمت إضافة أمر الطباعة إلى الطابور لكنه فشل على الجهاز.') + warningText);
      } else if (updated?.status === 'printed') {
        setMessage(`تمت طباعة ${printed} تذكرة مطبخ.${warningText}`);
      } else {
        setMessage(`تمت إضافة ${printed} تذكرة إلى طابور الطباعة.${warningText}`);
      }
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setPrinting(false);
    }
  };

  const order = ticket?.order;

  return (
    <AppScreen
      title="معاينة تذكرة المطبخ"
      subtitle={order?.invoice_number ? `فاتورة ${order.invoice_number}` : undefined}
      onBack={navigation.goBack}
      refreshing={loading}
      onRefresh={load}
    >
      {loading && !ticket ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && !ticket ? <AppEmptyState title="تعذر تحميل التذكرة" /> : null}
      {ticket && order ? (
        <View style={{ gap: spacing.md }}>
          <AppCard>
            <AppSectionHeader title={ticket.store?.name ?? 'تذكرة مطبخ'} />
            <AppListItem title="الفاتورة" subtitle={String(order.invoice_number ?? order.id ?? '—')} />
            <AppListItem title="تسلسل الطباعة" subtitle={String(order.print_sequence ?? '—')} />
            <AppListItem title="نوع الطلب" subtitle={String(order.order_type ?? '—')} />
            <AppListItem title="الطاولة" subtitle={String(order.dining_table?.name ?? order.dining_table?.number ?? '—')} />
            <AppListItem title="الوقت" subtitle={dateText(order.created_at ?? undefined)} />
          </AppCard>
          <AppCard>
            <AppSectionHeader title="الأصناف" />
            {(order.items ?? []).map((item, index) => (
              <AppListItem
                key={String(item.id ?? index)}
                title={item.product?.name ?? 'صنف'}
                subtitle={`× ${numberText(item.quantity ?? 1)}${item.notes ? ` • ${item.notes}` : ''}`}
                meta={item.options?.flatMap((group) => group.options?.map((option) => option.name).filter(Boolean) ?? []).join(', ')}
              />
            ))}
          </AppCard>
          {order.kitchen_notes ? (
            <AppCard>
              <Text style={{ ...textStart, color: c.text }}>{order.kitchen_notes}</Text>
            </AppCard>
          ) : null}
          {message ? <Text style={{ ...textStart, color: c.info, fontWeight: '700' }}>{message}</Text> : null}
          <View style={{ gap: spacing.sm }}>
            <AppButton title="طباعة / إعادة طباعة" onPress={() => void printTicket()} loading={printing} />
            <AppButton title="قائمة انتظار الطباعة" variant="secondary" onPress={() => navigation.navigate('PrintQueue')} />
            <AppButton title="ملفات طابعات المطبخ" variant="outline" onPress={() => {
              if (activeBranchId) navigation.navigate('PrinterProfiles', { branchId: activeBranchId });
              else navigation.navigate('BranchesList');
            }} />
          </View>
        </View>
      ) : null}
    </AppScreen>
  );
}
