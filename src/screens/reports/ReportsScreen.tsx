import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppScreen } from '@/components/layout';
import { AppSearchField, AppText } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import { REPORT_GROUPS, listReportHubItems } from '@/reports/reportDefinitions';
import type { ReportGroupId, ReportId } from '@/reports/types';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { flexRow, textStart } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';
import { storageGet, storageKeys, storageSet } from '@/services/storage';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';

const RECENT_KEY = storageKeys.reportsRecent;
type Nav = NativeStackNavigationProp<MoreStackParamList, 'Reports'>;
type HubItem = ReturnType<typeof listReportHubItems>[number];

export function ReportsScreen({ navigation }: { navigation: Nav }) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { can, hasFeature } = usePermissions();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<ReportId[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => {
    void storageGet<ReportId[]>(RECENT_KEY).then((ids) => setRecent(ids ?? []));
  }, []));

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listReportHubItems().filter((item) => {
      if (!can(item.permission)) return false;
      if (item.feature && !hasFeature(item.feature)) return false;
      if (!q) return true;
      return item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    });
  }, [can, hasFeature, query]);

  const openReport = (id: ReportId) => {
    const next = [id, ...recent.filter((recentId) => recentId !== id)].slice(0, 6);
    setRecent(next);
    void storageSet(RECENT_KEY, next);
    if (id === 'raw-materials') {
      navigation.navigate('RawMaterialsReport');
      return;
    }
    navigation.navigate('ReportViewer', { reportId: id });
  };

  const grouped = useMemo(() => {
    const map = new Map<ReportGroupId, HubItem[]>();
    for (const group of REPORT_GROUPS) map.set(group.id, []);
    for (const item of items) map.set(item.group, [...(map.get(item.group) ?? []), item]);
    return REPORT_GROUPS
      .map((group) => ({ group, items: map.get(group.id) ?? [] }))
      .filter((entry) => entry.items.length > 0);
  }, [items]);

  const recentItems = useMemo(
    () => recent.map((id) => items.find((item) => item.id === id)).filter(Boolean) as HubItem[],
    [items, recent],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void storageGet<ReportId[]>(RECENT_KEY)
      .then((ids) => setRecent(ids ?? []))
      .finally(() => setRefreshing(false));
  }, []);

  return (
    <AppScreen
      title="مركز التقارير"
      subtitle={`${items.length} تقريرًا متاحًا حسب صلاحياتك`}
      refreshing={refreshing}
      onRefresh={onRefresh}
      scroll={false}
      contentStyle={styles.screen}
    >
      <View style={styles.searchArea}>
        <AppSearchField value={query} onChangeText={setQuery} placeholder="ابحث باسم التقرير أو مخرجاته..." compact />
        {recentItems.length ? (
          <View style={styles.recentBlock}>
            <AppText style={styles.overline}>فُتح مؤخرًا</AppText>
            <View style={styles.recentWrap}>
              {recentItems.map((item) => (
                <Pressable key={item.id} onPress={() => openReport(item.id)} style={styles.recentItem}>
                  <MaterialIcons name="history" size={15} color={c.textMuted} />
                  <AppText style={styles.recentLabel} numberOfLines={1}>{item.title}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!query.trim() ? (
          <View style={styles.section}>
            <SectionHeading title="مسارات تحليلية" subtitle="تقارير متعددة التبويبات أو تغطية تاريخية موسعة" count={2} />
            <View style={styles.listSurface}>
              <ReportRow
                title="تكلفة الوصفات"
                description="استهلاك، تكلفة وهامش، نواقص، فروق متوقعة"
                icon="restaurant"
                onPress={() => navigation.navigate('RecipeReports')}
                divider
              />
              <ReportRow
                title="التقارير الكلاسيكية"
                description="مبيعات ومشتريات وعملاء وموردون ومدفوعات ومخزون"
                icon="history"
                onPress={() => navigation.navigate('LegacyReports')}
              />
            </View>
          </View>
        ) : null}

        {grouped.map(({ group, items: groupItems }) => (
          <View key={group.id} style={styles.section}>
            <SectionHeading title={group.title} count={groupItems.length} />
            <View style={styles.listSurface}>
              {groupItems.map((item, index) => (
                <ReportRow
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  icon={item.icon as keyof typeof MaterialIcons.glyphMap}
                  onPress={() => openReport(item.id)}
                  divider={index < groupItems.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        {!items.length ? (
          <View style={styles.empty}>
            <MaterialIcons name="search-off" size={24} color={c.textCaption} />
            <AppText style={styles.emptyTitle}>لا توجد تقارير مطابقة</AppText>
            <AppText style={styles.emptyText}>غيّر عبارة البحث أو راجع صلاحية عرض التقارير.</AppText>
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

function SectionHeading({ title, subtitle, count }: { title: string; subtitle?: string; count: number }) {
  const c = useColors();
  return (
    <View style={{ ...flexRow, alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md }}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <AppText style={{ ...textStart, color: c.text, fontFamily: fonts.extraBold, fontSize: typography.cardTitle }}>{title}</AppText>
        {subtitle ? <AppText style={{ ...textStart, color: c.textMuted, fontFamily: fonts.regular, fontSize: typography.caption }}>{subtitle}</AppText> : null}
      </View>
      <AppText style={{ color: c.textCaption, fontFamily: fonts.bold, fontSize: typography.caption }}>{count}</AppText>
    </View>
  );
}

function ReportRow({ title, description, icon, onPress, divider }: { title: string; description: string; icon: keyof typeof MaterialIcons.glyphMap; onPress: () => void; divider?: boolean }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        ...flexRow,
        minHeight: 68,
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: pressed ? c.surfaceMuted : c.surface,
        borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
        borderBottomColor: c.borderSubtle,
      })}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={{ width: 38, height: 38, borderRadius: radius.md, backgroundColor: c.surfaceMuted, borderWidth: StyleSheet.hairlineWidth, borderColor: c.borderSubtle, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name={icon} size={20} color={c.textMuted} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <AppText style={{ ...textStart, color: c.text, fontFamily: fonts.bold, fontSize: typography.body }} numberOfLines={1}>{title}</AppText>
        <AppText style={{ ...textStart, color: c.textMuted, fontFamily: fonts.regular, fontSize: typography.caption }} numberOfLines={1}>{description}</AppText>
      </View>
      <MaterialIcons name="chevron-left" size={21} color={c.textCaption} />
    </Pressable>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { padding: 0, gap: 0 },
    searchArea: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.borderSubtle },
    overline: { ...textStart, color: c.textCaption, fontFamily: fonts.bold, fontSize: typography.micro },
    recentBlock: { gap: spacing.xs },
    recentWrap: { ...flexRow, flexWrap: 'wrap', gap: spacing.xs },
    recentItem: { ...flexRow, maxWidth: '48%', minHeight: 34, alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.md, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.borderSubtle },
    recentLabel: { ...textStart, flexShrink: 1, color: c.textMuted, fontFamily: fonts.medium, fontSize: typography.caption },
    scroll: { flex: 1, minHeight: 0 },
    content: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, paddingBottom: spacing.xxxl, gap: spacing.lg },
    section: { gap: spacing.sm },
    listSurface: { backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.borderSubtle, borderRadius: radius.md, overflow: 'hidden' },
    empty: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
    emptyTitle: { color: c.text, fontFamily: fonts.bold, fontSize: typography.body },
    emptyText: { color: c.textMuted, fontFamily: fonts.regular, fontSize: typography.caption },
  });
}
