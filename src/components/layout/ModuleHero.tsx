import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow, textStart } from '@/constants/layout';
import { createModuleStyles } from '@/styles/createModuleStyles';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { AppText } from '@/components/ui/AppText';

export type ModuleHeroStat = { label: string; value: string | number; tone?: 'default' | 'success' | 'warning' | 'danger' };

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  stats?: ModuleHeroStat[];
  onRefresh?: () => void;
  refreshing?: boolean;
  actions?: React.ReactNode;
  compact?: boolean;
};

export function ModuleHero({ eyebrow, title, subtitle, stats, onRefresh, refreshing, actions, compact }: Props) {
  const c = useColors();
  const styles = useMemo(() => createModuleStyles(c), [c]);

  return (
    <View style={compact ? styles.heroCompact : styles.heroOuter}>
      <View style={styles.heroAccent} />
      <View style={compact ? styles.heroBodyCompact : styles.heroBody}>
        {eyebrow ? <AppText style={styles.heroEyebrow}>{eyebrow}</AppText> : null}
        <View style={{ ...flexRow, alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <AppText style={styles.heroTitle}>{title}</AppText>
            {subtitle ? <AppText style={styles.heroSubtitle}>{subtitle}</AppText> : null}
          </View>
          {onRefresh ? (
            <Pressable onPress={onRefresh} style={styles.statPill} accessibilityRole="button" accessibilityLabel="تحديث">
              {refreshing ? <ActivityIndicator size="small" color={c.accent} /> : <MaterialIcons name="refresh" size={16} color={c.textMuted} />}
            </Pressable>
          ) : null}
        </View>
        {stats?.length ? (
          <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statPill}>
                <AppText style={styles.statPillValue}>{stat.value}</AppText>
                <AppText style={styles.statPillLabel}>{stat.label}</AppText>
              </View>
            ))}
          </View>
        ) : null}
        {actions ? <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>{actions}</View> : null}
      </View>
    </View>
  );
}
