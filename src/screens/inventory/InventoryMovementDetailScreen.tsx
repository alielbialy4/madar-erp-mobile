import React from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { AppScreen } from '@/components/layout';
import { AppCard, AppSectionHeader } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { dateText, numberText, asText } from '@/utils/format';
import { textStart, textLtr } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'InventoryMovementDetail'>;
type Route = RouteProp<MoreStackParamList, 'InventoryMovementDetail'>;

export function InventoryMovementDetailScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const m = route.params.movement;
  const rows: { label: string; value: string; ltr?: boolean }[] = [
    { label: 'المنتج', value: asText(m.product_name ?? (m.product as Record<string, unknown>)?.name) },
    { label: 'المستودع', value: asText(m.warehouse_name ?? (m.warehouse as Record<string, unknown>)?.name) },
    { label: 'التغير', value: numberText(m.delta ?? m.quantity ?? 0), ltr: true },
    { label: 'نوع الحركة', value: asText(m.movement_type_label_ar ?? m.movement_type) },
    { label: 'المرجع', value: asText(m.reference_label_ar ?? m.reference_type, '—') },
    { label: 'التاريخ', value: dateText(String(m.occurred_at ?? m.created_at ?? '')) },
    { label: 'دفعة', value: asText((m.batch as Record<string, unknown>)?.batch_number ?? m.batch_number, '—') },
  ];

  return (
    <AppScreen title="تفاصيل الحركة" onBack={navigation.goBack}>
      <AppCard style={{ gap: spacing.md }}>
        <AppSectionHeader title="البيانات" />
        {rows.map((r) => (
          <Text key={r.label} style={{ ...textStart, marginBottom: spacing.sm }}>
            <Text style={{ color: '#888' }}>{r.label}: </Text>
            <Text style={[r.ltr ? textLtr : textStart, { fontWeight: '700' }]}>{r.value}</Text>
          </Text>
        ))}
      </AppCard>
    </AppScreen>
  );
}
