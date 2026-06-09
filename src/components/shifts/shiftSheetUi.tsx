import React, { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

type KpiTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

const KPI_TONE_ICON: Record<KpiTone, keyof typeof MaterialIcons.glyphMap> = {
  default: 'insights',
  success: 'trending-up',
  warning: 'warning-amber',
  danger: 'trending-down',
  info: 'payments',
};

export function ShiftKpiRow({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: KpiTone;
}) {
  const c = useColors();
  const color =
    tone === 'success' ? c.success : tone === 'warning' ? c.warning : tone === 'danger' ? c.danger : tone === 'info' ? c.info : c.text;
  return (
    <View style={{ ...flexRow, justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs }}>
      <AppText style={{ ...textStart, color: c.textMuted, fontSize: typography.small, flex: 1 }}>{label}</AppText>
      <AppText style={{ fontWeight: '800', color, fontFamily: fonts.bold }}>{value}</AppText>
    </View>
  );
}

export function ShiftKpiTile({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: KpiTone;
}) {
  const c = useColors();
  const styles = useMemo(() => createKpiStyles(c), [c]);
  const toneBg =
    tone === 'success'
      ? c.softSuccess
      : tone === 'warning'
        ? c.softWarning
        : tone === 'danger'
          ? c.softDanger
          : tone === 'info'
            ? c.softInfo
            : c.surfaceMuted;
  const toneFg =
    tone === 'success'
      ? c.success
      : tone === 'warning'
        ? c.warning
        : tone === 'danger'
          ? c.danger
          : tone === 'info'
            ? c.info
            : c.text;
  const toneBorder =
    tone === 'success'
      ? c.softSuccessBorder
      : tone === 'warning'
        ? c.softWarningBorder
        : tone === 'danger'
          ? c.softDangerBorder
          : tone === 'info'
            ? c.softInfoBorder
            : c.borderSubtle;

  return (
    <View style={[styles.kpiTile, { backgroundColor: toneBg, borderColor: toneBorder }]}>
      <View style={[styles.kpiIcon, { backgroundColor: c.surface }]}>
        <MaterialIcons name={KPI_TONE_ICON[tone]} size={18} color={toneFg} />
      </View>
      <AppText style={[styles.kpiLabel, { color: c.textMuted }]} numberOfLines={1}>
        {label}
      </AppText>
      <AppText style={[styles.kpiValue, { color: toneFg }]} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

export function ShiftInfoTile({ label, value }: { label: string; value: string }) {
  const c = useColors();
  const styles = useMemo(() => createInfoStyles(c), [c]);
  return (
    <View style={styles.infoTile}>
      <AppText style={styles.infoLabel} numberOfLines={1}>
        {label}
      </AppText>
      <AppText style={styles.infoValue} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

export function ShiftHighlightCard({
  label,
  value,
  icon = 'account-balance-wallet',
}: {
  label: string;
  value: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
}) {
  const c = useColors();
  const styles = useMemo(() => createHighlightStyles(c), [c]);
  return (
    <View style={styles.highlight}>
      <View style={styles.highlightIcon}>
        <MaterialIcons name={icon} size={24} color={c.primary} />
      </View>
      <View style={styles.highlightText}>
        <AppText style={styles.highlightLabel}>{label}</AppText>
        <AppText style={styles.highlightValue}>{value}</AppText>
      </View>
    </View>
  );
}

export function ShiftSectionCard({
  title,
  icon,
  children,
  style,
}: {
  title: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const c = useColors();
  const styles = useMemo(() => createSectionStyles(c), [c]);
  return (
    <View style={[styles.section, style]}>
      <View style={styles.sectionHeader}>
        {icon ? (
          <View style={styles.sectionIcon}>
            <MaterialIcons name={icon} size={18} color={c.primary} />
          </View>
        ) : null}
        <AppText style={styles.sectionTitle}>{title}</AppText>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export function ShiftSheetFooter({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return (
    <View
      style={{
        ...flexRow,
        gap: spacing.sm,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: c.borderSubtle,
        marginTop: spacing.sm,
      }}
    >
      {children}
    </View>
  );
}

function createKpiStyles(c: AppColors) {
  return StyleSheet.create({
    kpiTile: {
      flex: 1,
      minWidth: 140,
      borderRadius: radius.xl,
      borderWidth: 1,
      padding: spacing.md,
      gap: spacing.xs,
    },
    kpiIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kpiLabel: { ...textStart, fontSize: typography.tiny, fontFamily: fonts.medium, fontWeight: '600' },
    kpiValue: { ...textStart, fontSize: typography.body, fontFamily: fonts.bold, fontWeight: '800' },
  });
}

function createInfoStyles(c: AppColors) {
  return StyleSheet.create({
    infoTile: {
      flex: 1,
      minWidth: 120,
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      gap: 2,
    },
    infoLabel: { ...textStart, fontSize: typography.tiny, color: c.textMuted, fontFamily: fonts.medium },
    infoValue: { ...textStart, fontSize: typography.small, fontFamily: fonts.bold, fontWeight: '700', color: c.text },
  });
}

function createHighlightStyles(c: AppColors) {
  return StyleSheet.create({
    highlight: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.xl,
      backgroundColor: c.primarySoftMuted,
      borderWidth: 1,
      borderColor: c.primarySoftBorder,
    },
    highlightIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    highlightText: { flex: 1, minWidth: 0, gap: 2 },
    highlightLabel: { ...textStart, color: c.textMuted, fontSize: typography.small, fontFamily: fonts.medium },
    highlightValue: { ...textStart, color: c.primary, fontSize: typography.pageTitle, fontFamily: fonts.bold, fontWeight: '800' },
  });
}

function createSectionStyles(c: AppColors) {
  return StyleSheet.create({
    section: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      overflow: 'hidden',
    },
    sectionHeader: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: c.surfaceMuted,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    sectionIcon: {
      width: 30,
      height: 30,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      ...textStart,
      flex: 1,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
    },
    sectionBody: { padding: spacing.md, gap: spacing.sm },
  });
}
