import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow, textStart } from '@/constants/layout';
import { backArrowIcon } from '@/utils/rtl';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useBranchStore } from '@/store/branchStore';
import { useNetworkStore } from '@/store/networkStore';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function AppHeader({ title, subtitle, onBack, right }: Props) {
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const viewMode = useBranchStore((state) => state.viewMode);
  const isOnline = useNetworkStore((state) => state.isOnline);

  return (
    <View style={styles.header}>
      <View style={styles.mainRow}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="رجوع">
            <MaterialIcons name={backArrowIcon()} size={22} color={colors.text} />
          </Pressable>
        ) : null}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        <View style={styles.contextChip}>
          <View style={[styles.dot, { backgroundColor: isOnline ? colors.success : colors.danger }]} />
          <Text style={styles.contextText} numberOfLines={1}>
            {viewMode === 'global' ? 'عرض عام' : activeBranch?.name || ''}
          </Text>
        </View>
        {right ? <View style={styles.rightSlot}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  mainRow: { ...flexRow, alignItems: 'center', gap: spacing.md },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  titleWrap: { flex: 1 },
  title: {
    ...textStart,
    color: colors.text,
    fontSize: typography.pageTitle,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
  },
  subtitle: {
    ...textStart,
    color: colors.textMuted,
    fontSize: typography.tiny,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  contextChip: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.surface,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  contextText: {
    color: colors.textMuted,
    fontSize: typography.tiny,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  rightSlot: {},
});
