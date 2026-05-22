import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { money } from '@/utils/format';
import { spacing } from '@/constants/spacing';
import { createDashboardStyles } from './dashboardStyles';
import { DashboardSection } from './DashboardSection';

type Props = {
  days: string[];
  revenue: number[];
  title?: string;
  hint?: string;
};

export function RevenueTrendChart({
  days,
  revenue,
  title = 'اتجاه الإيرادات',
  hint = 'آخر 14 يومًا — متابعة سريعة للأداء.',
}: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const max = Math.max(...revenue.map((n) => Number(n) || 0), 1);
  const labels = days.map((day) => {
    const parts = (day || '').split('-');
    if (parts.length >= 3) return `${parts[2]}/${parts[1]}`;
    return day;
  });
  const peak = Math.max(...revenue.map((n) => Number(n) || 0));

  return (
    <DashboardSection title={title} hint={hint} icon="show-chart" iconTone="info" badge="14 يوم" badgeTone="info">
      <View style={ds.surfaceCard}>
        <View style={[ds.cardBody, { paddingTop: spacing.md }]}>
          {revenue.length === 0 ? (
            <View style={ds.emptyBox}>
              <Text style={ds.emptyText}>لا توجد بيانات اتجاه للعرض.</Text>
            </View>
          ) : (
            <>
              <View style={styles.bars}>
                {revenue.map((value, index) => {
                  const h = Math.max(12, Math.round((Number(value) / max) * 128));
                  const active = Number(value) === peak && peak > 0;
                  return (
                    <View key={`${labels[index]}-${index}`} style={styles.barCol}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: h,
                            backgroundColor: active ? c.accent : c.accentSoft,
                            borderWidth: active ? 0 : 1,
                            borderColor: c.accentBorder,
                          },
                        ]}
                      />
                      <Text style={styles.barLabel} numberOfLines={1}>
                        {labels[index]}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.footer}>
                <Text style={styles.footerLabel}>أعلى يوم</Text>
                <Text style={styles.footerValue}>{money(peak)}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </DashboardSection>
  );
}

const styles = {
  bars: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-between' as const,
    gap: 6,
    minHeight: 148,
    paddingTop: 8,
  },
  barCol: { flex: 1, alignItems: 'center' as const, gap: 8, minWidth: 0 },
  bar: { width: '76%' as const, maxWidth: 32, borderRadius: 8 },
  barLabel: { fontSize: 9, color: '#94A3B8', textAlign: 'center' as const },
  footer: {
    marginTop: 16,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EDF2',
  },
  footerLabel: { fontSize: 12, color: '#64748B', writingDirection: 'rtl' as const },
  footerValue: { fontSize: 14, fontWeight: '800' as const, color: '#0F172A', writingDirection: 'ltr' as const },
};
