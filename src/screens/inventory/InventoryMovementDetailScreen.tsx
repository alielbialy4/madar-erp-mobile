import React, { useMemo } from 'react';
import { View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppSectionHeader } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { dateText, numberText, asText } from '@/utils/format';
import { textStart, textLtr } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { movementTypeLabel, resolveMovementLink } from '@/services/inventory/movementLinks';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'InventoryMovementDetail'>;
type Route = RouteProp<MoreStackParamList, 'InventoryMovementDetail'>;

export function InventoryMovementDetailScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const c = useColors();
  const m = route.params.movement;
  const link = useMemo(() => resolveMovementLink(m), [m]);

  const rows: { label: string; value: string; ltr?: boolean }[] = [
    { label: 'المنتج', value: asText(m.product_name ?? (m.product as Record<string, unknown>)?.name) },
    { label: 'المستودع', value: asText(m.warehouse_name ?? (m.warehouse as Record<string, unknown>)?.name) },
    { label: 'التغير', value: numberText(m.delta ?? m.quantity ?? 0), ltr: true },
    { label: 'نوع الحركة', value: movementTypeLabel(m) },
    { label: 'المرجع', value: asText(m.reference_label_ar ?? m.reference_type, '—') },
    { label: 'التاريخ', value: dateText(String(m.occurred_at ?? m.created_at ?? '')) },
    { label: 'دفعة', value: asText((m.batch as Record<string, unknown>)?.batch_number ?? m.batch_number, '—') },
  ];

  return (
    <AppScreen title="تفاصيل الحركة" onBack={navigation.goBack}>
      <View style={{ gap: spacing.md }}>
        <AppCard style={{ gap: spacing.md }}>
          <AppSectionHeader title="البيانات" />
          {rows.map((r) => (
            <Text key={r.label} style={{ ...textStart, marginBottom: spacing.sm }}>
              <Text style={{ color: c.textMuted }}>{r.label}: </Text>
              <Text style={[r.ltr ? textLtr : textStart, { fontWeight: '700' }]}>{r.value}</Text>
            </Text>
          ))}
        </AppCard>
        {link ? (
          <AppButton
            title={link.label}
            variant="secondary"
            onPress={() => {
              if (link.screen === 'PurchaseDetail') navigation.navigate('PurchaseDetail', link.params);
              else if (link.screen === 'StockTransferDetail') navigation.navigate('StockTransferDetail', link.params);
              else if (link.screen === 'StockAdjustmentDetail') navigation.navigate('StockAdjustmentDetail', link.params);
              else if (link.screen === 'StockCountDetail') navigation.navigate('StockCountDetail', link.params);
              else navigation.navigate('RequisitionDetail', link.params);
            }}
          />
        ) : null}
      </View>
    </AppScreen>
  );
}
