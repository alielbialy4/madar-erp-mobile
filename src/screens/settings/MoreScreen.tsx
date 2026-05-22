import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppInput, AppText as Text } from '@/components/ui';
import { buildMobileSidebarMenu } from '@/navigation/buildSidebarMenu';
import { buildMoreHubGroups } from '@/navigation/moreModuleHub';
import type { MoreHubItem } from '@/navigation/moreModuleHub';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';
import { resolveSidebarIcon } from '@/constants/sidebarIcons';
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
import { fadeIn } from '@/utils/animations';
import { chevronForwardIcon } from '@/utils/rtl';

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

function HubCard({
  item,
  columns,
  styles,
  c,
  onPress,
}: {
  item: MoreHubItem;
  columns: number;
  styles: ReturnType<typeof createStyles>;
  c: AppColors;
  onPress: () => void;
}) {
  const icon = resolveSidebarIcon(item.icon);
  const disabled = !item.nav || item.disabled;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.card,
        columns >= 4 ? styles.cardQuarter : columns >= 3 ? styles.cardThird : styles.cardHalf,
        disabled ? styles.cardDisabled : undefined,
        pressed && !disabled ? styles.cardPressed : undefined,
      ]}
      accessibilityState={{ disabled }}
    >
      <View style={[styles.cardIcon, disabled && styles.cardIconDisabled]}>
        <MaterialIcons name={icon} size={22} color={disabled ? c.textCaption : c.accent} />
      </View>
      <Text style={[styles.cardTitle, disabled && styles.cardTitleDisabled]} numberOfLines={2}>
        {item.label}
      </Text>
      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      <View style={styles.cardFooter}>
        {item.badge ? <AppBadge label={item.badge} tone="info" /> : <View />}
        {!disabled ? <MaterialIcons name={chevronForwardIcon()} size={18} color={c.textCaption} /> : null}
      </View>
      {item.disabledReason ? (
        <Text style={styles.cardLock} numberOfLines={2}>
          {item.disabledReason}
        </Text>
      ) : null}
    </Pressable>
  );
}

function SectionBlock({
  title,
  subtitle,
  children,
  opacity,
  styles,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  opacity: Animated.Value;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Animated.View style={[styles.section, { opacity }]}>
      <View style={[styles.sectionHeader, flexRow]}>
        <View style={styles.sectionAccent} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.cardGrid}>{children}</View>
    </Animated.View>
  );
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

  const sectionOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    sectionOpacity.setValue(0);
    fadeIn(sectionOpacity, 320);
  }, [sectionOpacity]);

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

  return (
    <AppScreen title="المزيد" subtitle="مركز الوحدات — تنظيم حسب نشاط العمل" noHeader>
      <View style={styles.hubHero}>
        <View style={styles.hubHeroIcon}>
          <MaterialIcons name="apps" size={28} color={c.accent} />
        </View>
        <View style={styles.hubHeroText}>
          <Text style={styles.hubHeroTitle}>مركز الوحدات</Text>
          <Text style={styles.hubHeroSub}>كل عمليات ERP منظمة حسب نشاط العمل — ابحث أو افتح القائمة الكاملة</Text>
        </View>
      </View>
      <View style={styles.toolbar}>
        <AppInput
          value={query}
          onChangeText={setQuery}
          placeholder="بحث في الوحدات..."
          returnKeyType="search"
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
        {groups.map((group) => (
          <SectionBlock
            key={group.id}
            title={group.title}
            subtitle={group.subtitle}
            opacity={sectionOpacity}
            styles={styles}
          >
            {group.items.map((item) => (
              <HubCard
                key={item.id}
                item={item}
                columns={columns}
                styles={styles}
                c={c}
                onPress={() => item.nav && navigateFromMore(navigation, item.nav)}
              />
            ))}
          </SectionBlock>
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
    toolbar: { gap: spacing.sm, marginBottom: spacing.md },
    toolbarActions: {
      ...flexRow,
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    scroll: { flex: 1 },
    content: { paddingBottom: spacing.xxxl, gap: spacing.xl },
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
    cardGrid: {
      ...flexRow,
      flexWrap: 'wrap',
      gap: spacing.md,
      justifyContent: 'flex-start',
      alignItems: 'stretch',
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: spacing.md,
      minHeight: 128,
      gap: spacing.xs,
      alignItems: 'flex-start',
    },
    sectionAccent: {
      width: 4,
      height: 20,
      borderRadius: 2,
      backgroundColor: c.accent,
    },
    hubHero: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.xxxl,
      backgroundColor: c.primarySoftMuted,
      borderWidth: 1,
      borderColor: c.primarySoftBorder,
      marginBottom: spacing.sm,
    },
    hubHeroIcon: {
      width: 52,
      height: 52,
      borderRadius: radius.xl,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hubHeroText: { flex: 1, gap: 4 },
    hubHeroTitle: {
      ...textStart,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.extraBold,
      color: c.text,
    },
    hubHeroSub: {
      ...textStart,
      fontSize: typography.tiny,
      color: c.textMuted,
      lineHeight: 18,
    },
    cardHalf: {
      width: '48%',
      maxWidth: '48%',
    },
    cardThird: {
      width: '31.5%',
      maxWidth: '31.5%',
    },
    cardQuarter: {
      width: '23.5%',
      maxWidth: '23.5%',
    },
    cardFooter: {
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 'auto' as const,
    },
    cardPressed: { backgroundColor: c.surfaceMuted },
    cardDisabled: { opacity: 0.55 },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.xl,
      backgroundColor: c.softPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardIconDisabled: { backgroundColor: c.surfaceMuted },
    cardTitle: {
      ...textStart,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.text,
    },
    cardTitleDisabled: { color: c.textCaption },
    cardDesc: {
      ...textStart,
      fontSize: typography.tiny,
      color: c.textMuted,
      lineHeight: 16,
    },
    cardLock: {
      ...textStart,
      fontSize: 10,
      color: c.warning,
      fontFamily: fonts.medium,
    },
    empty: {
      ...textStart,
      textAlign: 'center',
      color: c.textMuted,
      padding: spacing.xl,
    },
  });
}
