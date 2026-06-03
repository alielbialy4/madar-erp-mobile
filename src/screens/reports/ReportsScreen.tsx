import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppScreen } from '@/components/layout';
import { AppCard, AppInput, AppText } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import { REPORT_GROUPS, listReportHubItems } from '@/reports/reportDefinitions';
import type { ReportGroupId, ReportId } from '@/reports/types';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { flexRow, textStart } from '@/constants/layout';
import { storageGet, storageKeys, storageSet } from '@/services/storage';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';

const RECENT_KEY = storageKeys.reportsRecent;

type Nav = NativeStackNavigationProp<MoreStackParamList, 'Reports'>;

export function ReportsScreen({ navigation }: { navigation: Nav }) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 3 : width >= 600 ? 2 : 1;
  const { can, hasFeature } = usePermissions();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<ReportId[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void storageGet<ReportId[]>(RECENT_KEY).then((ids) => setRecent(ids ?? []));
    }, []),
  );

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
    const next = [id, ...recent.filter((r) => r !== id)].slice(0, 6);
    setRecent(next);
    void storageSet(RECENT_KEY, next);
    navigation.navigate('ReportViewer', { reportId: id });
  };

  const grouped = useMemo(() => {
    const map = new Map<ReportGroupId, typeof items>();
    for (const g of REPORT_GROUPS) map.set(g.id, []);
    for (const item of items) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return REPORT_GROUPS.map((g) => ({ group: g, items: map.get(g.id) ?? [] })).filter((x) => x.items.length > 0);
  }, [items]);

  const recentItems = useMemo(
    () => recent.map((id) => items.find((i) => i.id === id)).filter(Boolean) as typeof items,
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
      subtitle="تقارير تشغيلية مطابقة للويب — فلاتر وبيانات حقيقية"
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <AppInput value={query} onChangeText={setQuery} placeholder="بحث في التقارير..." />
      {recentItems.length ? (
        <View style={{ gap: spacing.sm }}>
          <AppText style={{ fontWeight: '700', ...textStart }}>فُتح مؤخراً</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ ...flexRow, gap: spacing.sm }}>
            {recentItems.map((item) => (
              <PressableScale key={item.id} onPress={() => openReport(item.id)}>
                <AppCard style={{ minWidth: 160, padding: spacing.md }}>
                  <AppText style={textStart}>{item.title}</AppText>
                </AppCard>
              </PressableScale>
            ))}
          </ScrollView>
        </View>
      ) : null}
      <PressableScale onPress={() => navigation.navigate('RecipeReports')}>
        <AppCard style={{ ...flexRow, alignItems: 'center', gap: spacing.md }}>
          <MaterialIcons name="restaurant" size={28} color={c.accent} />
          <View style={{ flex: 1 }}>
            <AppText style={{ fontWeight: '700', ...textStart }}>تقارير تكلفة الوصفات</AppText>
            <AppText style={{ color: c.textMuted, ...textStart, fontSize: 12 }}>
              استهلاك الخامات، التكلفة والهامش، الوصفات الناقصة، والفرق المتوقع
            </AppText>
          </View>
          <MaterialIcons name="chevron-left" size={24} color={c.textMuted} />
        </AppCard>
      </PressableScale>
      <PressableScale onPress={() => navigation.navigate('LegacyReports')}>
        <AppCard style={{ ...flexRow, alignItems: 'center', gap: spacing.md }}>
          <MaterialIcons name="history" size={28} color={c.accent} />
          <View style={{ flex: 1 }}>
            <AppText style={{ fontWeight: '700', ...textStart }}>التقارير الكلاسيكية</AppText>
            <AppText style={{ color: c.textMuted, ...textStart, fontSize: 12 }}>
              مبيعات شاملة، مشتريات، منتجات، عملاء، موردون، مدفوعات، أرباح، مخزون
            </AppText>
          </View>
          <MaterialIcons name="chevron-left" size={24} color={c.textMuted} />
        </AppCard>
      </PressableScale>
      {grouped.map(({ group, items: groupItems }) => (
        <View key={group.id} style={{ gap: spacing.md }}>
          <AppText style={{ fontWeight: '800', fontSize: 16, ...textStart }}>{group.title}</AppText>
          <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.md }}>
            {groupItems.map((item) => (
              <PressableScale
                key={item.id}
                onPress={() => openReport(item.id)}
                style={{ width: columns === 1 ? '100%' : `${100 / columns - 2}%`, minWidth: columns === 1 ? undefined : 200, flexGrow: 1 }}
              >
                <AppCard style={{ gap: spacing.sm, minHeight: 120 }}>
                  <View style={{ ...flexRow, alignItems: 'center', gap: spacing.sm }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 12,
                      backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center',
                    }}>
                      <MaterialIcons name={item.icon as keyof typeof MaterialIcons.glyphMap} size={22} color={c.accent} />
                    </View>
                    <AppText style={{ flex: 1, fontWeight: '700', ...textStart }}>{item.title}</AppText>
                  </View>
                  <AppText style={{ color: c.textMuted, fontSize: 12, ...textStart }} numberOfLines={2}>
                    {item.description}
                  </AppText>
                  {item.feature && !hasFeature(item.feature) ? (
                    <AppText style={{ color: c.warning, fontSize: 11, ...textStart }}>يتطلب تقارير متقدمة</AppText>
                  ) : null}
                </AppCard>
              </PressableScale>
            ))}
          </View>
        </View>
      ))}
      {!items.length ? (
        <AppText style={{ ...textStart, color: c.textMuted }}>لا توجد تقارير مطابقة للبحث أو الصلاحيات.</AppText>
      ) : null}
    </AppScreen>
  );
}
