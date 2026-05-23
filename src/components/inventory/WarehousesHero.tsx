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

type Props = {
  totalCount: number;
  activeCount: number;
  isLoading?: boolean;
  onRefresh: () => void;
  canManage: boolean;
  onAdd?: () => void;
  readOnlyHint?: string | null;
};

export function WarehousesHero({
  totalCount,
  activeCount,
  isLoading,
  onRefresh,
  canManage,
  onAdd,
  readOnlyHint,
}: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const cs = useMemo(() => createCategoryStyles(c), [c]);
  const inactiveCount = Math.max(0, totalCount - activeCount);

  return (
    <View style={ds.heroOuter}>
      <View style={ds.heroAccent} />
      <View style={ds.heroBody}>
        <Text style={ds.heroEyebrow}>المخزون</Text>
        <Text style={ds.heroTitle}>المخازن</Text>
        <Text style={ds.heroSubtitle}>
          {readOnlyHint ??
            'عرض وإدارة المخازن — الربط بالفرع يتم من إعدادات الفرع (المخزن الافتراضي).'}
        </Text>

        {canManage && onAdd ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ds.chipScroll}>
            <Pressable
              onPress={onAdd}
              style={({ pressed }) => [ds.actionChip, ds.actionChipPrimary, pressed && { opacity: 0.9 }]}
            >
              <MaterialIcons name="add" size={18} color={c.primaryForeground} />
              <Text style={[ds.actionChipText, { color: c.primaryForeground }]}>مخزن جديد</Text>
            </Pressable>
          </ScrollView>
        ) : null}

        <View style={cs.statsRow}>
          <View style={cs.statBox}>
            <Text style={cs.statValue}>{totalCount}</Text>
            <Text style={cs.statLabel}>إجمالي</Text>
          </View>
          <View style={cs.statBox}>
            <Text style={[cs.statValue, { color: c.success }]}>{activeCount}</Text>
            <Text style={cs.statLabel}>نشط</Text>
          </View>
          <View style={cs.statBox}>
            <Text style={[cs.statValue, { color: c.warning }]}>{inactiveCount}</Text>
            <Text style={cs.statLabel}>غير نشط</Text>
          </View>
        </View>

        <View style={ds.heroMetaRow}>
          <View style={[ds.refreshPill, flexRow]}>
            <MaterialIcons name="warehouse" size={14} color={c.textCaption} />
            <Text style={ds.refreshText}>{totalCount} مخزن</Text>
          </View>
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
        </View>
      </View>
    </View>
  );
}
