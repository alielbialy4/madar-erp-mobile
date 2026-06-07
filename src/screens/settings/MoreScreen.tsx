import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { MotiView } from 'moti';
import { AppScreen } from '@/components/layout';
import { ModuleHero } from '@/components/layout/ModuleHero';
import { AppButton, AppSearchField, AppText as Text } from '@/components/ui';
import { HubGrid } from '@/components/navigation/HubGrid';
import { buildMobileSidebarMenu } from '@/navigation/buildSidebarMenu';
import { buildMoreHubGroups } from '@/navigation/moreModuleHub';
import type { MoreHubItem } from '@/navigation/moreModuleHub';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';
import type { AppColors } from '@/constants/colors';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavShell } from '@/navigation/NavShellContext';

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
  const columns = width >= 1100 ? 4 : width >= 900 ? 3 : 2;
  const { openDrawer, openCommandPalette } = useNavShell();

  const user = useAuthStore((state) => state.user);
  const viewMode = useBranchStore((state) => state.viewMode);
  const { can, hasFeature } = usePermissions();
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
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
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            (item.description?.toLowerCase().includes(q) ?? false),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [can, hasFeature, query, user?.is_super_admin, viewMode]);

  const totalModules = useMemo(
    () => groups.reduce((sum, g) => sum + g.items.length, 0),
    [groups],
  );

  const handleItemPress = (item: MoreHubItem) => {
    if (item.nav) navigateFromMore(navigation, item.nav);
  };

  return (
    <AppScreen title="المزيد" subtitle="مركز الوحدات — تنظيم حسب نشاط العمل" noHeader>
      <ModuleHero
        eyebrow="مركز الوحدات"
        title="كل عمليات ERP"
        subtitle="ابحث أو افتح القائمة الكاملة — منظّم حسب نشاط العمل"
        stats={[{ label: 'وحدات', value: totalModules }]}
        compact
      />
      <View style={styles.toolbar}>
        <AppSearchField
          value={query}
          onChangeText={setQuery}
          placeholder="بحث في الوحدات..."
        />
        <View style={styles.toolbarActions}>
          <AppButton title="بحث سريع" variant="secondary" onPress={openCommandPalette} />
          <AppButton title="كل الشاشات" variant="outline" onPress={openDrawer} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {groups.map((group, gIdx) => (
          <MotiView
            key={group.id}
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: gIdx * 80, type: 'spring', damping: 20, stiffness: 100 }}
            style={styles.section}
          >
            <View style={[styles.sectionHeader, flexRow]}>
              <View style={styles.sectionAccent} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.sectionTitle}>{group.title}</Text>
                <Text style={styles.sectionSubtitle}>{group.subtitle}</Text>
              </View>
            </View>
            <HubGrid
              items={group.items}
              columns={columns}
              onItemPress={handleItemPress}
            />
          </MotiView>
        ))}

        {groups.length === 0 ? (
          <Text style={styles.empty}>لا توجد وحدات مطابقة — جرّب البحث السريع أو القائمة الكاملة</Text>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    toolbar: { gap: spacing.sm, marginBottom: spacing.md, paddingHorizontal: spacing.lg },
    toolbarActions: {
      ...flexRow,
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    scroll: { flex: 1 },
    content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl },
    section: { gap: spacing.sm },
    sectionHeader: { gap: 4, paddingHorizontal: spacing.xs },
    sectionTitle: {
      ...textStart,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.bold,
      color: c.text,
    },
    sectionSubtitle: {
      ...textStart,
      fontSize: typography.tiny,
      color: c.textMuted,
    },
    sectionAccent: {
      width: 4,
      height: 20,
      borderRadius: 2,
      backgroundColor: c.accent,
    },
    empty: {
      ...textStart,
      textAlign: 'center',
      color: c.textMuted,
      padding: spacing.xl,
    },
  });
}
