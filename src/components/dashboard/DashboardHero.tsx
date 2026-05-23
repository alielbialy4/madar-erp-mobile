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
import { createDashboardStyles } from './dashboardStyles';

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
  const ds = useMemo(() => createDashboardStyles(c), [c]);

  return (
    <View style={ds.heroOuter}>
      <View style={ds.heroGradientBand} />
      <View style={ds.heroAccent} />
      <View style={ds.heroBody}>
        <Text style={ds.heroEyebrow}>{eyebrow}</Text>
        <Text style={ds.heroTitle}>{title}</Text>
        <Text style={ds.heroSubtitle}>{subtitle}</Text>

        {scopeBadges ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ds.chipScroll}>
            {scopeBadges}
          </ScrollView>
        ) : null}

        {quickActions ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ds.chipScroll}>
            {quickActions}
          </ScrollView>
        ) : null}

        <View style={ds.heroMetaRow}>
          <View style={[ds.refreshPill, flexRow]}>
            <MaterialIcons name="schedule" size={14} color={c.textCaption} />
            <Text style={ds.refreshText}>آخر تحديث {lastUpdatedLabel}</Text>
          </View>
          <Pressable
            onPress={onRefresh}
            disabled={isLoading}
            style={({ pressed }) => [
              ds.refreshPill,
              flexRow,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="تحديث البيانات"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={c.accent} />
            ) : (
              <MaterialIcons name="refresh" size={18} color={c.accent} />
            )}
            <Text style={[ds.refreshText, { color: c.accent, fontFamily: 'Tajawal_700Bold' }]}>تحديث</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
