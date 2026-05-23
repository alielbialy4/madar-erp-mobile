import React, { useMemo } from 'react';
import { Text } from '@/components/ui/AppText';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import { createDashboardStyles } from '@/components/dashboard/dashboardStyles';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { fonts } from '@/constants/fonts';

type Props = {
  totalCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  promoCount: number;
  isLoading?: boolean;
  onRefresh: () => void;
  canManage: boolean;
  onAdd?: () => void;
  onReorder?: () => void;
  onCategories?: () => void;
  categoryHint?: string | null;
  /** Flatter header for phone list — less vertical padding */
  compact?: boolean;
};

export function ProductsHero({
  totalCount,
  lowStockCount,
  outOfStockCount,
  promoCount,
  isLoading,
  onRefresh,
  canManage,
  onAdd,
  onReorder,
  onCategories,
  categoryHint,
  compact: compactProp,
}: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const compact = compactProp ?? width < 600;
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const cs = useMemo(() => createCategoryStyles(c), [c]);

  const chips = (
    <>
      {onCategories ? (
        <Pressable
          onPress={onCategories}
          style={({ pressed }) => [ds.actionChip, ds.actionChipOutline, pressed && { opacity: 0.9 }]}
        >
          <MaterialIcons name="category" size={18} color={c.textMuted} />
          <Text style={[ds.actionChipText, { color: c.text }]}>التصنيفات</Text>
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
      {canManage && onAdd ? (
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [ds.actionChip, ds.actionChipPrimary, pressed && { opacity: 0.9 }]}
        >
          <MaterialIcons name="add" size={18} color={c.primaryForeground} />
          <Text style={[ds.actionChipText, { color: c.primaryForeground }]}>منتج جديد</Text>
        </Pressable>
      ) : null}
    </>
  );

  if (compact) {
    return (
      <View style={{ gap: spacing.sm }}>
        <View style={{ ...flexRow, alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text
              style={{
                ...textStart,
                fontSize: typography.pageTitle,
                fontFamily: fonts.extraBold,
                fontWeight: '800',
                color: c.text,
              }}
            >
              المنتجات
            </Text>
            {categoryHint ? (
              <Text style={{ ...textStart, fontSize: typography.tiny, color: c.textMuted }} numberOfLines={1}>
                {categoryHint}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={onRefresh}
            disabled={isLoading}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: radius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.surfaceMuted,
              borderWidth: 1,
              borderColor: c.borderSubtle,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={c.accent} />
            ) : (
              <MaterialIcons name="refresh" size={20} color={c.accent} />
            )}
          </Pressable>
        </View>

        <View style={cs.statsRow}>
          <View style={[cs.statBox, cs.statBoxCompact]}>
            <Text style={[cs.statValue, cs.statValueCompact]}>{totalCount}</Text>
            <Text style={cs.statLabel}>محمّل</Text>
          </View>
          <View style={[cs.statBox, cs.statBoxCompact]}>
            <Text style={[cs.statValue, cs.statValueCompact, { color: c.warning }]}>{lowStockCount}</Text>
            <Text style={cs.statLabel}>منخفض</Text>
          </View>
          <View style={[cs.statBox, cs.statBoxCompact]}>
            <Text style={[cs.statValue, cs.statValueCompact, { color: c.danger }]}>{outOfStockCount}</Text>
            <Text style={cs.statLabel}>نفد</Text>
          </View>
          <View style={[cs.statBox, cs.statBoxCompact]}>
            <Text style={[cs.statValue, cs.statValueCompact, { color: c.success }]}>{promoCount}</Text>
            <Text style={cs.statLabel}>عروض</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {chips}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={ds.heroOuter}>
      <View style={ds.heroAccent} />
      <View style={ds.heroBody}>
        <Text style={ds.heroEyebrow}>الكتالوج</Text>
        <Text style={ds.heroTitle}>المنتجات</Text>
        <Text style={ds.heroSubtitle}>
          {categoryHint
            ? `عرض منتجات تصنيف «${categoryHint}» — الأسعار والمخزون حسب الفرع الحالي.`
            : 'إدارة الأسعار والباركود والمخزون — الترتيب يظهر في نقطة البيع.'}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ds.chipScroll}>
          {chips}
        </ScrollView>

        <View style={cs.statsRow}>
          <View style={cs.statBox}>
            <Text style={cs.statValue}>{totalCount}</Text>
            <Text style={cs.statLabel}>محمّل</Text>
          </View>
          <View style={cs.statBox}>
            <Text style={[cs.statValue, { color: c.warning }]}>{lowStockCount}</Text>
            <Text style={cs.statLabel}>منخفض</Text>
          </View>
          <View style={cs.statBox}>
            <Text style={[cs.statValue, { color: c.danger }]}>{outOfStockCount}</Text>
            <Text style={cs.statLabel}>نفد</Text>
          </View>
          <View style={cs.statBox}>
            <Text style={[cs.statValue, { color: c.success }]}>{promoCount}</Text>
            <Text style={cs.statLabel}>عروض</Text>
          </View>
        </View>

        <View style={ds.heroMetaRow}>
          <View style={[ds.refreshPill, flexRow]}>
            <MaterialIcons name="inventory-2" size={14} color={c.textCaption} />
            <Text style={ds.refreshText}>{totalCount} منتج في القائمة</Text>
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
