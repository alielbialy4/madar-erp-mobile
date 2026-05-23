import React, { useMemo } from 'react';
import { Text } from '@/components/ui/AppText';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { createDashboardStyles } from '@/components/dashboard/dashboardStyles';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { fonts } from '@/constants/fonts';

type Stat = { label: string; value: string | number; tone?: 'default' | 'success' | 'warning' | 'danger' };

type Chip = { label: string; icon: React.ComponentProps<typeof MaterialIcons>['name']; onPress: () => void; primary?: boolean };

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  stats?: Stat[];
  chips?: Chip[];
  metaLabel?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
};

export function InventoryHero({
  eyebrow,
  title,
  subtitle,
  stats = [],
  chips = [],
  metaLabel,
  isLoading,
  onRefresh,
}: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const cs = useMemo(() => createCategoryStyles(c), [c]);

  const toneColor = (tone?: Stat['tone']) => {
    if (tone === 'success') return c.success;
    if (tone === 'warning') return c.warning;
    if (tone === 'danger') return c.danger;
    return c.text;
  };

  return (
    <View style={ds.heroOuter}>
      <View style={ds.heroAccent} />
      <View style={ds.heroBody}>
        <Text style={ds.heroEyebrow}>{eyebrow}</Text>
        <Text style={ds.heroTitle}>{title}</Text>
        <Text style={ds.heroSubtitle}>{subtitle}</Text>

        {chips.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ds.chipScroll}>
            {chips.map((chip) => (
              <Pressable
                key={chip.label}
                onPress={chip.onPress}
                style={({ pressed }) => [
                  ds.actionChip,
                  chip.primary ? ds.actionChipPrimary : ds.actionChipOutline,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <MaterialIcons
                  name={chip.icon}
                  size={18}
                  color={chip.primary ? c.primaryForeground : c.textMuted}
                />
                <Text style={[ds.actionChipText, { color: chip.primary ? c.primaryForeground : c.text }]}>
                  {chip.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {stats.length > 0 ? (
          <View style={cs.statsRow}>
            {stats.map((s) => (
              <View key={s.label} style={cs.statBox}>
                <Text style={[cs.statValue, { color: toneColor(s.tone) }]}>{s.value}</Text>
                <Text style={cs.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {metaLabel || onRefresh ? (
          <View style={ds.heroMetaRow}>
            {metaLabel ? (
              <View style={[ds.refreshPill, flexRow]}>
                <MaterialIcons name="warehouse" size={14} color={c.textCaption} />
                <Text style={ds.refreshText}>{metaLabel}</Text>
              </View>
            ) : (
              <View />
            )}
            {onRefresh ? (
              <Pressable
                onPress={onRefresh}
                disabled={isLoading}
                style={({ pressed }) => [ds.refreshPill, flexRow, pressed && { opacity: 0.85 }]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={c.accent} />
                ) : (
                  <MaterialIcons name="refresh" size={18} color={c.accent} />
                )}
                <Text style={[ds.refreshText, { color: c.accent, fontFamily: fonts.bold }]}>تحديث</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
