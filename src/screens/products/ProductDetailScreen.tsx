import React from 'react';
import { textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { productsAPI } from '@/api/products';
import { AppCard, AppSectionHeader } from '@/components/ui';
import { AppErrorState } from '@/components/feedback';
import { AppScreen } from '@/components/layout';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import type { Product } from '@/types/api';
import { money, numberText } from '@/utils/format';

export function ProductDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const rawId = route.params?.id;
  if (!rawId) {
    return (
      <AppScreen title="خطأ" onBack={navigation.goBack}>
        <AppErrorState message="معرّف المنتج مفقود" onRetry={navigation.goBack} />
      </AppScreen>
    );
  }
  const id = Number(rawId);
  return (
    <DetailScreen<Product & Record<string, unknown>>
      title={route.params?.name || 'تفاصيل المنتج'}
      onBack={navigation.goBack}
      loader={() => productsAPI.getById(id)}
      fields={[
        { label: 'الاسم', value: (item) => item.name },
        { label: 'الباركود', value: (item) => item.barcode ?? '—', ltr: true },
        { label: 'سعر البيع', value: (item) => money(item.selling_price ?? item.price ?? 0) },
        { label: 'التكلفة', value: (item) => money(item.cost_price ?? 0) },
        { label: 'الوحدة', value: (item) => typeof item.unit === 'string' ? item.unit : '—' },
        { label: 'التصنيف', value: (item) => (item.category as any)?.name ?? '—' },
        { label: 'الحالة', value: (item) => (item.is_active === false ? 'غير نشط' : 'نشط') },
      ]}
    >
      {(item) => (
        <>
          <AppCard>
            <AppSectionHeader title="الأرصدة" />
            {(item.units ?? []).length === 0 ? <Text style={{ ...textStart }}>لا توجد بيانات مخزون</Text> : item.units?.map((u: any) => (
              <Text key={u.id ?? u.warehouse_id} style={{ ...textStart }}>
                {u.warehouse?.name ?? u.warehouse_name ?? 'مخزن'}: {numberText(u.quantity ?? 0)}
              </Text>
            ))}
          </AppCard>
          <AppCard>
            <AppSectionHeader title="خيارات / موديفايرز" />
            {(item.option_groups ?? []).length === 0 ? <Text style={{ ...textStart }}>لا توجد مجموعات خيارات</Text> : item.option_groups?.map((g: any) => (
              <Text key={g.id} style={{ ...textStart }}>
                {g.name} ({g.is_required ? 'إلزامي' : 'اختياري'}): {(g.options ?? []).map((o: any) => o.name).join('، ')}
              </Text>
            ))}
          </AppCard>
        </>
      )}
    </DetailScreen>
  );
}
