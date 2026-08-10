import React, { useMemo, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppScreen, ModuleHeader } from '@/components/layout';
import { AppSearchField, AppText as Text } from '@/components/ui';
import { HubGrid } from '@/components/navigation/HubGrid';
import { buildMobileSidebarMenu } from '@/navigation/buildSidebarMenu';
import { buildMoreHubGroups } from '@/navigation/moreModuleHub';
import type { MoreHubGroupId, MoreHubItem } from '@/navigation/moreModuleHub';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';
import type { AppColors } from '@/constants/colors';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavShell } from '@/navigation/NavShellContext';

type GroupFilter = 'all' | MoreHubGroupId;

function navigateFromMore(
  navigation: {
    navigate: (a: string, b?: object) => void;
    getParent?: () => { navigate: (a: string, b?: object) => void } | undefined;
  },
  action: SidebarNavAction,
) {
  if (action.kind === 'tab') {
    navigation.getParent?.()?.navigate(action.tab);
    return;
  }
  if (action.kind === 'products') {
    navigation.getParent?.()?.navigate('ProductsTab', { screen: action.screen, params: action.params });
    return;
  }
  navigation.navigate(action.screen, action.params);
}

export function MoreScreen({
  navigation,
}: {
  navigation: {
    navigate: (a: string, b?: object) => void;
    getParent?: () => { navigate: (a: string, b?: object) => void } | undefined;
  };
}) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 3 : 1;
  const { openDrawer, openCommandPalette } = useNavShell();

  const user = useAuthStore((state) => state.user);
  const viewMode = useBranchStore((state) => state.viewMode);
  const { can, hasFeature } = usePermissions();
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');

  const allGroups = useMemo(() => {
    const menu = buildMobileSidebarMenu(
      Boolean(user?.is_super_admin),
      (perm) => can(perm),
      viewMode,
      (feature) => hasFeature(feature),
    );
    const built = buildMoreHubGroups(menu);
    const q = query.trim().toLowerCase();
    if (!q) return built;
    return built
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => item.label.toLowerCase().includes(q) || (item.description?.toLowerCase().includes(q) ?? false),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [can, hasFeature, query, user?.is_super_admin, viewMode]);

  const visibleGroups = groupFilter === 'all'
    ? allGroups
    : allGroups.filter((group) => group.id === groupFilter);
  const totalModules = allGroups.reduce((sum, group) => sum + group.items.length, 0);

  const handleItemPress = (item: MoreHubItem) => {
    if (item.nav) navigateFromMore(navigation, item.nav);
  };

  return (
    <AppScreen title="العمليات" subtitle="مركز العمل" noHeader scroll={false} contentStyle={styles.screen}>
      <ModuleHeader
        eyebrow="مركز العمل"
        title="العمليات"
        subtitle="انتقل مباشرة إلى المهمة المطلوبة؛ النتائج والصلاحيات تتبع الفرع الحالي."
        stats={[{ label: query ? 'نتيجة' : 'وحدة متاحة', value: totalModules }]}
        compact
      />

      <View style={styles.finder}>
        <AppSearchField value={query} onChangeText={setQuery} placeholder="ابحث باسم العملية..." compact />
        <View style={styles.quickActions}>
          <Pressable onPress={openCommandPalette} style={styles.quickAction} accessibilityRole="button">
            <MaterialIcons name="travel-explore" size={18} color={c.textMuted} />
            <Text style={styles.quickActionLabel}>انتقال سريع</Text>
          </Pressable>
          <Pressable onPress={openDrawer} style={styles.quickAction} accessibilityRole="button">
            <MaterialIcons name="menu-open" size={18} color={c.textMuted} />
            <Text style={styles.quickActionLabel}>القائمة الكاملة</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.filterRail}>
        <GroupButton label="الكل" count={totalModules} active={groupFilter === 'all'} onPress={() => setGroupFilter('all')} />
        {allGroups.map((group) => (
          <GroupButton
            key={group.id}
            label={group.title}
            count={group.items.length}
            active={groupFilter === group.id}
            onPress={() => setGroupFilter(group.id)}
          />
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {visibleGroups.map((group) => (
          <View key={group.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionCopy}>
                <Text style={styles.sectionTitle}>{group.title}</Text>
                <Text style={styles.sectionSubtitle}>{group.subtitle}</Text>
              </View>
              <Text style={styles.sectionCount}>{group.items.length}</Text>
            </View>
            <HubGrid items={group.items} columns={columns} onItemPress={handleItemPress} />
          </View>
        ))}

        {visibleGroups.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="search-off" size={24} color={c.textCaption} />
            <Text style={styles.emptyTitle}>لا توجد عملية مطابقة</Text>
            <Text style={styles.emptyText}>غيّر عبارة البحث أو اعرض كل مجموعات العمل.</Text>
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

function GroupButton({ label, count, active, onPress }: { label: string; count: number; active: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={{
        ...flexRow,
        minHeight: 38,
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: active ? c.primary : c.borderSubtle,
        backgroundColor: active ? c.primarySoftMuted : c.surface,
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={{ color: active ? c.primary : c.text, fontFamily: fonts.bold, fontSize: typography.caption }}>{label}</Text>
      <Text style={{ color: c.textCaption, fontFamily: fonts.bold, fontSize: typography.micro }}>{count}</Text>
    </Pressable>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { paddingHorizontal: spacing.md, paddingTop: 0, gap: spacing.sm },
    finder: { gap: spacing.sm },
    quickActions: { ...flexRow, gap: spacing.sm },
    quickAction: {
      ...flexRow,
      flex: 1,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      borderRadius: radius.md,
      backgroundColor: c.surface,
    },
    quickActionLabel: { color: c.textMuted, fontFamily: fonts.bold, fontSize: typography.caption },
    filterRail: { ...flexRow, flexWrap: 'wrap', gap: spacing.xs, paddingVertical: spacing.xs },
    scroll: { flex: 1, minHeight: 0 },
    content: { paddingBottom: spacing.xxxl, gap: spacing.lg },
    section: { gap: spacing.sm },
    sectionHeader: { ...flexRow, alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
    sectionCopy: { flex: 1, minWidth: 0, gap: 2 },
    sectionTitle: { ...textStart, color: c.text, fontFamily: fonts.extraBold, fontSize: typography.cardTitle },
    sectionSubtitle: { ...textStart, color: c.textMuted, fontFamily: fonts.regular, fontSize: typography.caption },
    sectionCount: { color: c.textCaption, fontFamily: fonts.bold, fontSize: typography.caption },
    empty: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xxxl },
    emptyTitle: { color: c.text, fontFamily: fonts.bold, fontSize: typography.body },
    emptyText: { color: c.textMuted, fontFamily: fonts.regular, fontSize: typography.caption },
  });
}
