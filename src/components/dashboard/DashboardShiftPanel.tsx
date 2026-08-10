import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AppButton } from '@/components/ui';
import { Text } from '@/components/ui/AppText';
import { MadarSection, MetricBlock } from '@/components/madar';
import { useColors } from '@/hooks/useColors';
import { money } from '@/utils/format';
import { spacing } from '@/constants/spacing';
import { createDashboardStyles } from './dashboardStyles';

type Shift = Record<string, unknown> | null | undefined;

type Props = {
  shift: Shift;
  onOpenShift?: () => void;
  onManageShifts?: () => void;
};

export function DashboardShiftPanel({ shift, onOpenShift, onManageShifts }: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);

  return (
    <MadarSection
      title="الوردية الحالية"
      action={
        <Text style={[ds.sectionHint, { color: shift ? c.success : c.warning }]}>
          {shift ? 'نشطة' : 'مغلقة'}
        </Text>
      }
    >
      {shift ? (
        <View style={{ gap: spacing.md }}>
          <MetricBlock
            label="رصيد البداية"
            value={money(shift.starting_cash ?? 0)}
            hint={[
              shift.cashier_name ? `كاشير ${String(shift.cashier_name)}` : null,
              shift.vault_name ? String(shift.vault_name) : null,
            ]
              .filter(Boolean)
              .join(' · ') || undefined}
            level="B"
            tone="info"
          />
          <Text style={ds.sectionHint}>
            {shift.opened_at ? `افتتحت ${String(shift.opened_at)}` : 'وقت الفتح غير متاح'}
          </Text>
          {onManageShifts ? (
            <AppButton title="إدارة الورديات" variant="outline" size="sm" onPress={onManageShifts} />
          ) : null}
        </View>
      ) : (
        <View style={[ds.emptyBox, { gap: spacing.md }]}>
          <Text style={ds.emptyText}>لا توجد وردية مفتوحة على هذا الفرع</Text>
          {onOpenShift ? <AppButton title="فتح وردية" size="sm" onPress={onOpenShift} /> : null}
        </View>
      )}
    </MadarSection>
  );
}
