import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { HEADER_CHROME } from '@/constants/headerChrome';
import { elevation } from '@/constants/elevation';
import { useColors } from '@/hooks/useColors';
import { useBranchStore } from '@/store/branchStore';
import { useAuthStore } from '@/store/authStore';
import { canUseGlobalView } from '@/utils/permissions';
import { normalizeApiError } from '@/utils/errors';
import { useToast } from '@/components/feedback';
import { AppBottomSheet } from '@/components/layout/AppBottomSheet';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppText } from '@/components/ui/AppText';
import type { Branch } from '@/types/api';

export function getBranchDisplayLabel(
  viewMode: 'global' | 'branch',
  activeBranch: Branch | null,
  allBranchesLabel = 'كل الفروع',
): string {
  if (viewMode === 'global') return allBranchesLabel;
  if (!activeBranch) return allBranchesLabel;
  return activeBranch.name;
}

function canSwitchBranches(
  branches: Branch[],
  viewMode: 'global' | 'branch',
  user: ReturnType<typeof useAuthStore.getState>['user'],
): boolean {
  return (
    branches.length > 1 ||
    canUseGlobalView(user) ||
    (branches.length >= 1 && viewMode === 'global')
  );
}

type BranchRowProps = {
  icon: 'public' | 'store';
  title: string;
  subtitle?: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
};

function BranchRow({ icon, title, subtitle, selected, disabled, onPress }: BranchRowProps) {
  const c = useColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.sheetRow,
        {
          backgroundColor: selected ? c.primarySoftMuted : 'transparent',
          borderColor: selected ? c.primarySoftBorder : 'transparent',
          opacity: disabled ? 0.55 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
    >
      <View
        style={[
          styles.sheetIconWell,
          {
            backgroundColor: selected ? c.primarySoftStrong : c.surfaceMuted,
            borderColor: selected ? c.primarySoftBorder : c.borderSubtle,
          },
        ]}
      >
        <MaterialIcons
          name={icon}
          size={HEADER_CHROME.sheetIconSize}
          color={selected ? c.primarySoftForeground : c.textMuted}
        />
      </View>
      <View style={styles.sheetCopy}>
        <AppText style={[styles.sheetTitle, { color: c.text }]} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={[styles.sheetSubtitle, { color: c.textMuted }]} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {selected ? <MaterialIcons name="check" size={20} color={c.primarySoftForeground} /> : null}
    </Pressable>
  );
}

type BranchSwitcherProps = {
  density?: 'icon' | 'pill';
};

export function BranchSwitcher({ density = 'pill' }: BranchSwitcherProps) {
  const { t } = useTranslation();
  const c = useColors();
  const toast = useToast();
  const { width } = useWindowDimensions();
  /** Match web sm+: two-line pill from tablet widths up. */
  const showSubtitle = density === 'pill' && width >= 600;
  const iconOnly = density === 'icon';
  const pillWidth =
    density === 'pill'
      ? Math.min(HEADER_CHROME.pillMaxWidth, Math.max(HEADER_CHROME.pillPreferWidth, Math.round(width * 0.24)))
      : undefined;

  const user = useAuthStore((s) => s.user);
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const branches = useBranchStore((s) => s.branches);
  const viewMode = useBranchStore((s) => s.viewMode);
  const branchLoading = useBranchStore((s) => s.loading);
  const switchBranch = useBranchStore((s) => s.switchBranch);

  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [search, setSearch] = useState('');

  const multi = canSwitchBranches(branches, viewMode, user);
  const branchName = getBranchDisplayLabel(viewMode, activeBranch, t('All Branches'));
  const branchCode = viewMode === 'branch' ? activeBranch?.code?.trim() || null : null;
  const iconName = viewMode === 'global' ? 'public' : 'store';
  const subtitle =
    viewMode === 'global'
      ? t('Global View')
      : multi
        ? t('Switch branch')
        : t('header.currentBranch');

  const isGlobal = viewMode === 'global';
  const busy = branchLoading || switching;
  const a11yLabel = `${branchName}${branchCode ? ` (${branchCode})` : ''} — ${subtitle}`;
  /** Web: nested icon tile only on the full pill; icon-only control has a flat glyph. */
  const wellTransparent = iconOnly;

  const filteredBranches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter((b) => {
      const name = b.name?.toLowerCase() ?? '';
      const code = b.code?.toLowerCase() ?? '';
      return name.includes(q) || code.includes(q);
    });
  }, [branches, search]);

  const handleClose = useCallback(() => {
    if (switching) return;
    setOpen(false);
    setSearch('');
  }, [switching]);

  const handleSelect = useCallback(
    async (branchId: string | null) => {
      if (switching) return;
      setSwitching(true);
      try {
        await switchBranch(branchId);
        toast.success(branchId ? 'تم تحديث الفرع' : 'تم التحويل إلى العرض العام');
        setOpen(false);
        setSearch('');
      } catch (err) {
        toast.error(normalizeApiError(err).message);
      } finally {
        setSwitching(false);
      }
    },
    [switchBranch, switching, toast],
  );

  const iconWell = (
    <View
      style={[
        styles.pillIconWell,
        iconOnly && styles.iconOnlyWell,
        wellTransparent
          ? { backgroundColor: 'transparent', borderColor: 'transparent' }
          : {
              backgroundColor: isGlobal ? c.surfaceMuted : c.primarySoftStrong,
              borderColor: isGlobal ? c.borderSubtle : c.primarySoftBorder,
            },
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={c.icon} />
      ) : (
        <MaterialIcons
          name={iconName}
          size={iconOnly ? HEADER_CHROME.actionIconSize : HEADER_CHROME.pillIconSize}
          color={
            wellTransparent
              ? c.icon
              : isGlobal
                ? c.textMuted
                : c.primarySoftForeground
          }
        />
      )}
    </View>
  );

  const pillBody = iconOnly ? (
    iconWell
  ) : (
    <>
      {iconWell}
      <View style={styles.pillCopy}>
        <View style={styles.pillTitleRow}>
          <AppText style={[styles.pillTitle, { color: c.text }]} numberOfLines={1}>
            {branchName}
          </AppText>
          {branchCode ? (
            <View style={[styles.codeChip, { backgroundColor: c.surfaceMuted, borderColor: c.borderSubtle }]}>
              <AppText style={[styles.codeChipText, { color: c.textMuted }]} numberOfLines={1}>
                {branchCode}
              </AppText>
            </View>
          ) : null}
        </View>
        {showSubtitle ? (
          <AppText style={[styles.pillSubtitle, { color: c.textMuted }]} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {multi && !busy ? (
        <MaterialIcons
          name={open ? 'expand-less' : 'expand-more'}
          size={16}
          color={c.textCaption}
        />
      ) : null}
    </>
  );

  const pillStyle = [
    iconOnly ? styles.iconPill : styles.pill,
    !iconOnly && pillWidth ? { width: pillWidth } : null,
    !iconOnly && showSubtitle ? styles.pillTwoLine : styles.pillSingleLine,
    {
      backgroundColor: isGlobal ? c.primarySoftMuted : c.surface,
      borderColor: open ? c.primarySoftBorder : c.borderSubtle,
      opacity: branchLoading ? 0.75 : 1,
      zIndex: 1,
    },
    elevation(c, 'sm'),
  ];

  return (
    <>
      {multi ? (
        <Pressable
          onPress={() => setOpen(true)}
          disabled={busy}
          style={({ pressed }) => [
            ...pillStyle,
            pressed && { backgroundColor: isGlobal ? c.surfaceMuted : c.primarySoftMuted },
          ]}
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
        >
          {pillBody}
        </Pressable>
      ) : (
        <View style={pillStyle} accessibilityLabel={a11yLabel}>
          {pillBody}
        </View>
      )}

      <AppBottomSheet visible={open} onClose={handleClose} title={t('Switch branch')} dismissable={!switching}>
        {branches.length > 5 ? (
          <View style={[styles.searchBox, { borderColor: c.borderSubtle, backgroundColor: c.surfaceMuted }]}>
            <MaterialIcons name="search" size={18} color={c.textMuted} />
            <AppTextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('header.branchSearch')}
              placeholderTextColor={c.textCaption}
              style={[styles.searchInput, { color: c.text }]}
              editable={!switching}
            />
          </View>
        ) : null}

        {canUseGlobalView(user) ? (
          <>
            <AppText style={[styles.sectionLabel, { color: c.textCaption }]}>{t('header.scope')}</AppText>
            <BranchRow
              icon="public"
              title={t('All Branches')}
              subtitle={t('Global View')}
              selected={viewMode === 'global'}
              disabled={switching}
              onPress={() => void handleSelect(null)}
            />
            {branches.length > 0 ? <View style={[styles.divider, { backgroundColor: c.borderSubtle }]} /> : null}
          </>
        ) : null}

        {branches.length > 0 ? (
          <AppText style={[styles.sectionLabel, { color: c.textCaption }]}>{t('header.branches')}</AppText>
        ) : null}

        {filteredBranches.length === 0 ? (
          <AppText style={[styles.emptyText, { color: c.textMuted }]}>{t('header.noBranches')}</AppText>
        ) : (
          filteredBranches.map((b) => (
            <BranchRow
              key={String(b.id)}
              icon="store"
              title={b.name}
              subtitle={b.code?.trim() || undefined}
              selected={activeBranch?.id === b.id && viewMode === 'branch'}
              disabled={switching}
              onPress={() => void handleSelect(String(b.id))}
            />
          ))
        )}

        {switching ? (
          <View style={styles.switchingRow}>
            <ActivityIndicator size="small" color={c.accent} />
            <AppText style={[styles.switchingText, { color: c.textMuted }]}>
              {t('header.branchSwitching')}
            </AppText>
          </View>
        ) : null}
      </AppBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: HEADER_CHROME.pillPaddingX,
    borderRadius: HEADER_CHROME.pillRadius,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: HEADER_CHROME.pillMaxWidth,
    overflow: 'hidden',
  },
  pillSingleLine: {
    height: HEADER_CHROME.pillHeight,
    minHeight: HEADER_CHROME.pillHeight,
    maxHeight: HEADER_CHROME.pillHeight,
    paddingVertical: 0,
  },
  pillTwoLine: {
    minHeight: HEADER_CHROME.pillHeight,
    maxHeight: 44,
    paddingVertical: HEADER_CHROME.pillPaddingY,
  },
  iconPill: {
    width: HEADER_CHROME.iconOnlySize,
    height: HEADER_CHROME.iconOnlySize,
    borderRadius: HEADER_CHROME.actionRadius,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  pillIconWell: {
    width: HEADER_CHROME.pillIconWell,
    height: HEADER_CHROME.pillIconWell,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconOnlyWell: {
    width: HEADER_CHROME.actionIconSize + 2,
    height: HEADER_CHROME.actionIconSize + 2,
    borderWidth: 0,
  },
  pillCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 1,
  },
  pillTitleRow: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  pillTitle: {
    ...textStart,
    flexShrink: 1,
    fontSize: typography.small,
    lineHeight: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  codeChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
    flexShrink: 0,
  },
  codeChipText: {
    fontSize: HEADER_CHROME.pillCodeFontSize,
    lineHeight: 12,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  pillSubtitle: {
    ...textStart,
    fontSize: typography.caption,
    lineHeight: 13,
    fontFamily: fonts.regular,
  },
  sheetRow: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: HEADER_CHROME.sheetRowRadius,
    borderWidth: 1,
  },
  sheetIconWell: {
    width: HEADER_CHROME.sheetIconWell,
    height: HEADER_CHROME.sheetIconWell,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sheetCopy: { flex: 1, minWidth: 0, gap: 2 },
  sheetTitle: {
    ...textStart,
    fontSize: typography.body,
    fontFamily: fonts.medium,
    fontWeight: '500',
  },
  sheetSubtitle: {
    ...textStart,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
  },
  searchBox: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body,
    fontFamily: fonts.medium,
    paddingVertical: spacing.xs,
  },
  sectionLabel: {
    ...textStart,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
  emptyText: {
    ...textStart,
    fontSize: typography.body,
    fontFamily: fonts.regular,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  switchingRow: {
    ...flexRow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  switchingText: {
    fontSize: typography.caption,
    fontFamily: fonts.medium,
  },
});
