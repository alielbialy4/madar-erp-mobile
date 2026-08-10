import { designColors } from '@/constants/colors';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppSearchField } from '@/components/ui/AppSearchField';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText as Text } from '@/components/ui/AppText';
import { resolveSidebarIcon } from '@/constants/sidebarIcons';
import { buildDashboardShortcutGroups, filterDashboardShortcutGroups } from '@/navigation/buildDashboardShortcutGroups';
import { navigateSidebarAction } from '@/navigation/sidebarNavigation';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@/types/navigation';

const TONE_BORDERS = [designColors.blueLight, designColors.greenLight, designColors.yellowLight, designColors.slate400, designColors.slate300];
const TONE_BGS = [designColors.blueSoft, designColors.greenSoft, designColors.yellowSoft, designColors.slate200, designColors.slate50];
const TONE_FGS = [designColors.blueDark, designColors.green, designColors.yellow, designColors.navy, designColors.slate700];

function shortcutColumns(width: number): number {
  if (width >= 1200) return 6;
  if (width >= 960) return 5;
  if (width >= 720) return 4;
  if (width >= 480) return 3;
  return 2;
}

type Props = {
  navigation: BottomTabNavigationProp<MainTabParamList>;
};

export function DashboardShortcutsHub({ navigation }: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const columns = shortcutColumns(width);
  const user = useAuthStore((s) => s.user);
  const viewMode = useBranchStore((s) => s.viewMode);
  const { can, hasFeature } = usePermissions();
  const [query, setQuery] = useState('');

  const groups = useMemo(
    () =>
      buildDashboardShortcutGroups(
        Boolean(user?.is_super_admin),
        (perm) => can(perm),
        viewMode,
        (feature) => hasFeature(feature),
      ),
    [can, hasFeature, user?.is_super_admin, viewMode],
  );

  const filtered = useMemo(() => filterDashboardShortcutGroups(groups, query), [groups, query]);

  if (groups.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={[styles.topRow, flexRow]}>
        <Text style={[styles.title, { color: c.text }]}>اختصارات سريعة</Text>
        <View style={styles.searchWrap}>
          <AppSearchField compact value={query} onChangeText={setQuery} placeholder="بحث..." />
        </View>
      </View>

      <View style={[styles.hubCard, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
        {filtered.length === 0 ? (
          <Text style={[styles.noResults, { color: c.textMuted }]}>لا توجد نتائج مطابقة.</Text>
        ) : (
          filtered.map((group, gIdx) => (
            <View key={group.id} style={styles.group}>
              <View style={[styles.groupHeader, flexRow]}>
                <Text style={[styles.groupTitle, { color: c.text }]}>{group.title}</Text>
                <View style={[styles.groupCount, { backgroundColor: c.surfaceMuted }]}>
                  <Text style={[styles.groupCountText, { color: c.textMuted }]}>{group.items.length}</Text>
                </View>
              </View>
              <View style={styles.grid}>
                {group.items.map((item, idx) => {
                  const tone = (gIdx + idx) % TONE_BORDERS.length;
                  const iconName = resolveSidebarIcon(item.icon);
                  const colWidth = 100 / columns;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => navigateSidebarAction(navigation, item.nav)}
                      style={({ pressed }) => [
                        styles.shortcutCard,
                        flexRow,
                        {
                          width: `${colWidth}%` as `${number}%`,
                          maxWidth: `${colWidth}%` as `${number}%`,
                          borderColor: TONE_BORDERS[tone],
                          backgroundColor: TONE_BGS[tone],
                        },
                        pressed && { opacity: 0.88 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                    >
                      <View style={[styles.shortcutIcon, { borderColor: TONE_BORDERS[tone] }]}>
                        <AppIcon name={iconName} size={16} color={TONE_FGS[tone]} weight="duotone" />
                      </View>
                      <Text style={[styles.shortcutLabel, { color: c.text }]} numberOfLines={1}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
    width: '100%',
  },
  topRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  title: {
    ...textStart,
    fontSize: typography.body,
    fontFamily: fonts.bold,
    flexShrink: 0,
  },
  searchWrap: {
    flex: 1,
    minWidth: 160,
    maxWidth: 280,
  },
  hubCard: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  noResults: {
    ...textStart,
    textAlign: 'center',
    paddingVertical: spacing.md,
    fontSize: typography.small,
    fontFamily: fonts.regular,
  },
  group: {
    gap: spacing.xs,
  },
  groupHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  groupTitle: {
    ...textStart,
    flex: 1,
    fontSize: typography.small,
    fontFamily: fonts.bold,
  },
  groupCount: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
  },
  groupCountText: {
    fontSize: 9,
    fontFamily: fonts.bold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  shortcutCard: {
    minHeight: 40,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    gap: spacing.xs,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  shortcutIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  shortcutLabel: {
    ...textStart,
    flex: 1,
    fontSize: 11,
    fontFamily: fonts.bold,
    lineHeight: 14,
  },
});
