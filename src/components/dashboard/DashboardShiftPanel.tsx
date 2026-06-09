import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AppButton } from '@/components/ui';
import { Text } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { money, numberText } from '@/utils/format';
import { parseApiMoneyFirst } from '@/utils/parseMoney';
import { spacing } from '@/constants/spacing';
import { createDashboardStyles } from './dashboardStyles';
import { DashboardSection } from './DashboardSection';

type Shift = Record<string, unknown> | null | undefined;

type Props = {
  shift: Shift;
  onOpenShift?: () => void;
  onManageShifts?: () => void;
};

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  return (
    <View style={[ds.detailRow, last && { borderBottomWidth: 0 }]}>
      <Text style={ds.detailLabel}>{label}</Text>
      <Text style={ds.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function DashboardShiftPanel({ shift, onOpenShift, onManageShifts }: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);

  return (
    <DashboardSection
      title="الوردية الحالية"
      hint="ملخص الوردية المفتوحة"
      icon="schedule"
      iconTone="info"
      badge={shift ? 'نشطة' : 'مغلقة'}
      badgeTone={shift ? 'success' : 'warning'}
    >
      <View style={ds.surfaceCard}>
        {shift ? (
          <>
            <DetailRow label="وقت الفتح" value={String(shift.opened_at ?? '—')} />
            <DetailRow label="الكاشير" value={String(shift.cashier_name ?? '—')} />
            <DetailRow label="الخزنة" value={String(shift.vault_name ?? '—')} />
            <DetailRow
              label="رصيد البداية"
              value={money(shift.starting_cash ?? 0)}
              last={!onManageShifts}
            />
            {onManageShifts ? (
              <View style={{ padding: spacing.md }}>
                <AppButton title="إدارة الورديات" variant="outline" size="sm" onPress={onManageShifts} />
              </View>
            ) : null}
          </>
        ) : (
          <View style={[ds.emptyBox, { gap: spacing.md }]}>
            <Text style={ds.emptyText}>لا توجد وردية مفتوحة على هذا الفرع</Text>
            {onOpenShift ? <AppButton title="فتح وردية" size="sm" onPress={onOpenShift} /> : null}
          </View>
        )}
      </View>
    </DashboardSection>
  );
}
