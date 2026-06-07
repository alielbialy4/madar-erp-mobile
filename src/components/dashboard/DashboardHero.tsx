import React, { useMemo } from 'react';
import { Text } from '@/components/ui/AppText';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { flexRow } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  scopeBadges?: React.ReactNode;
  lastUpdatedLabel: string;
  isLoading?: boolean;
  onRefresh: () => void;
  quickActions?: React.ReactNode;
};

export function DashboardHero({
  eyebrow = 'لوحة التحكم',
  title,
  subtitle,
  scopeBadges,
  lastUpdatedLabel,
  isLoading,
  onRefresh,
  quickActions,
}: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.heroOuter}>
      <LinearGradient
        colors={[c.accent + '15', c.accent + '03', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.heroAccentBar} />
      <View style={styles.heroBody}>
        <Text style={styles.heroEyebrow}>{eyebrow}</Text>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>

        {scopeBadges ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {scopeBadges}
          </ScrollView>
        ) : null}

        {quickActions ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {quickActions}
          </ScrollView>
        ) : null}

        <View style={styles.heroMetaRow}>
          <View style={[styles.refreshPill, flexRow]}>
            <Text style={styles.refreshText}>آخر تحديث {lastUpdatedLabel}</Text>
          </View>
          <Pressable
            onPress={onRefresh}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.refreshPill,
              styles.refreshPillActive,
              flexRow,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="تحديث البيانات"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={c.accent} />
            ) : null}
            <Text style={[styles.refreshText, { color: c.accent, fontFamily: fonts.bold }]}>تحديث</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    heroOuter: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
      borderRadius: radius.xxxl,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 5,
    },
    heroAccentBar: {
      height: 3,
      backgroundColor: c.accent,
    },
    heroBody: {
      padding: spacing.lg,
      gap: spacing.sm,
    },
    heroEyebrow: {
      fontSize: 11,
      fontFamily: fonts.bold,
      color: c.accent,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontSize: 22,
      fontFamily: fonts.extraBold,
      color: c.text,
      lineHeight: 28,
    },
    heroSubtitle: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: c.textMuted,
      lineHeight: 20,
    },
    chipScroll: {
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    heroMetaRow: {
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
      gap: spacing.sm,
    },
    refreshPill: {
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
    },
    refreshPillActive: {
      backgroundColor: c.accent + '15',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.accent + '30',
    },
    refreshText: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
  });
}
