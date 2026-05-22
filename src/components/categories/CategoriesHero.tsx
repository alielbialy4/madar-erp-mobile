import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { createDashboardStyles } from '@/components/dashboard/dashboardStyles';
import { fonts } from '@/constants/fonts';
import { createCategoryStyles } from './categoryStyles';

type Props = {
  totalCount: number;
  activeCount: number;
  isLoading?: boolean;
  onRefresh: () => void;
  canManage: boolean;
  onAdd?: () => void;
  onReorder?: () => void;
  onProducts?: () => void;
};

export function CategoriesHero({
  totalCount,
  activeCount,
  isLoading,
  onRefresh,
  canManage,
  onAdd,
  onReorder,
  onProducts,
}: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const cs = useMemo(() => createCategoryStyles(c), [c]);
  const inactiveCount = Math.max(0, totalCount - activeCount);

  const chips = (
    <>
      {canManage && onAdd ? (
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [ds.actionChip, ds.actionChipPrimary, pressed && { opacity: 0.9 }]}
        >
          <MaterialIcons name="add" size={18} color={c.primaryForeground} />
          <Text style={[ds.actionChipText, { color: c.primaryForeground }]}>تصنيف جديد</Text>
        </Pressable>
      ) : null}
      {canManage && onReorder ? (
        <Pressable
          onPress={onReorder}
          style={({ pressed }) => [ds.actionChip, ds.actionChipOutline, pressed && { opacity: 0.9 }]}
        >
          <MaterialIcons name="swap-vert" size={18} color={c.textMuted} />
          <Text style={[ds.actionChipText, { color: c.text }]}>ترتيب POS</Text>
        </Pressable>
      ) : null}
      {onProducts ? (
        <Pressable
          onPress={onProducts}
          style={({ pressed }) => [ds.actionChip, ds.actionChipOutline, pressed && { opacity: 0.9 }]}
        >
          <MaterialIcons name="inventory-2" size={18} color={c.textMuted} />
          <Text style={[ds.actionChipText, { color: c.text }]}>المنتجات</Text>
        </Pressable>
      ) : null}
    </>
  );

  return (
    <View style={ds.heroOuter}>
      <View style={ds.heroAccent} />
      <View style={ds.heroBody}>
        <Text style={ds.heroEyebrow}>المخزون</Text>
        <Text style={ds.heroTitle}>التصنيفات</Text>
        <Text style={ds.heroSubtitle}>نظّم كتالوج المنتجات — الترتيب هنا يظهر في نقطة البيع.</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ds.chipScroll}>
          {chips}
        </ScrollView>

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
            <MaterialIcons name="category" size={14} color={c.textCaption} />
            <Text style={ds.refreshText}>{totalCount} تصنيف</Text>
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
