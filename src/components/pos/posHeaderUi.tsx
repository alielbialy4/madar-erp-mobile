import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { flexRow, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useNetworkStore } from '@/store/networkStore';

export function posHeaderElevation(c: AppColors) {
  return Platform.select({
    ios: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
    android: { elevation: 3 },
    default: {},
  });
}

export function PosBranchMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const c = useColors();
  const dim = size === 'sm' ? 32 : 40;
  const icon = size === 'sm' ? 16 : 20;
  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: radius.control,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.border,
      }}
    >
      <MaterialIcons name="storefront" size={icon} color={c.text} />
    </View>
  );
}

export function PosOnlineChip({ compact }: { compact?: boolean }) {
  const c = useColors();
  const isOnline = useNetworkStore((s) => s.isOnline);
  const styles = useMemo(() => createChipStyles(c), [c]);
  return (
    <View style={[styles.chip, isOnline ? styles.chipOnline : styles.chipOffline, compact && styles.chipCompact]}>
      <View style={[styles.dot, { backgroundColor: isOnline ? c.success : c.danger }]} />
      <Text style={[styles.chipText, isOnline ? styles.chipTextOnline : styles.chipTextOffline]}>
        {isOnline ? 'متصل' : 'غير متصل'}
      </Text>
    </View>
  );
}

export function PosShiftChip({ active, label }: { active: boolean; label: string }) {
  const c = useColors();
  const styles = useMemo(() => createChipStyles(c), [c]);
  return (
    <View style={[styles.chip, active ? styles.chipShiftOpen : styles.chipShiftClosed]}>
      <MaterialIcons
        name={active ? 'check-circle' : 'schedule'}
        size={14}
        color={active ? c.success : c.warning}
      />
      <Text style={[styles.chipText, active ? styles.chipTextShiftOpen : styles.chipTextShiftClosed]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function createChipStyles(c: AppColors) {
  return StyleSheet.create({
    chip: {
      ...flexRow,
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.control,
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: c.surface,
      maxWidth: 140,
    },
    chipCompact: { paddingHorizontal: 7, paddingVertical: 4 },
    chipOnline: { borderColor: c.success },
    chipOffline: { borderColor: c.danger },
    chipShiftOpen: { borderColor: c.success },
    chipShiftClosed: { borderColor: c.warning },
    dot: { width: 6, height: 6, borderRadius: 3 },
    chipText: { fontSize: typography.tiny, fontFamily: fonts.bold, fontWeight: '700' },
    chipTextOnline: { color: c.success },
    chipTextOffline: { color: c.danger },
    chipTextShiftOpen: { color: c.success },
    chipTextShiftClosed: { color: c.warning },
  });
}

export function usePosHeaderBarStyle() {
  const c = useColors();
  return useMemo(
    () =>
      StyleSheet.create({
        bar: {
          backgroundColor: c.surfaceHeader ?? c.surface,
          borderBottomWidth: 1,
          borderBottomColor: c.borderSubtle,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          gap: spacing.sm,
          ...posHeaderElevation(c),
        },
        title: {
          ...textStart,
          fontSize: typography.caption,
          fontFamily: fonts.bold,
          fontWeight: '700',
          color: c.textCaption,
          letterSpacing: 0.3,
        },
        branchName: {
          ...textStart,
          fontSize: typography.body,
          fontFamily: fonts.extraBold,
          fontWeight: '800',
          color: c.text,
        },
        meta: {
          ...textStart,
          fontSize: typography.tiny,
          fontFamily: fonts.medium,
          color: c.textMuted,
        },
      }),
    [c],
  );
}
