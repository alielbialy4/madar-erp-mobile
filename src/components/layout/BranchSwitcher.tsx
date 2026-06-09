import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
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
): string {
  if (viewMode === 'global') return 'كل الفروع';
  if (!activeBranch) return 'اختر الفرع';
  const code = activeBranch.code?.trim();
  return code ? `${activeBranch.name} (${code})` : activeBranch.name;
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
      style={{
        ...flexRow,
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: radius.xl,
        backgroundColor: selected ? c.primarySoftMuted : 'transparent',
        borderWidth: 1,
        borderColor: selected ? c.primarySoftBorder : 'transparent',
        opacity: disabled ? 0.55 : 1,
      }}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.lg,
          backgroundColor: c.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: c.borderSubtle,
        }}
      >
        <MaterialIcons name={icon} size={18} color={c.primarySoftForeground} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText
          style={{
            ...textStart,
            fontSize: typography.body,
            fontFamily: fonts.medium,
            fontWeight: '500',
            color: c.text,
          }}
          numberOfLines={1}
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText
            style={{
              ...textStart,
              fontSize: typography.caption,
              fontFamily: fonts.regular,
              color: c.textMuted,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {selected ? (
        <MaterialIcons name="check" size={20} color={c.primarySoftForeground} />
      ) : null}
    </Pressable>
  );
}

export function BranchSwitcher() {
  const c = useColors();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const showSubtitle = width >= 400;

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
  const label = getBranchDisplayLabel(viewMode, activeBranch);
  const iconName = viewMode === 'global' ? 'public' : 'store';
  const subtitle =
    viewMode === 'global'
      ? 'عرض عام'
      : multi
        ? 'تبديل الفرع'
        : 'الفرع الحالي';

  const isGlobal = viewMode === 'global';
  const pillBorderColor = isGlobal ? c.borderSubtle : c.primarySoftBorder;
  const pillBackground = isGlobal ? c.surfaceMuted : c.primarySoftMuted;

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

  const pillContent = (
    <>
      {branchLoading || switching ? (
        <ActivityIndicator size="small" color={c.primarySoftForeground} />
      ) : (
        <MaterialIcons name={iconName} size={17} color={c.primarySoftForeground} />
      )}
      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center', gap: 1 }}>
        <AppText
          style={{
            ...textStart,
            fontSize: isTablet ? typography.body : typography.caption,
            fontFamily: fonts.bold,
            fontWeight: '600',
            color: c.text,
          }}
          numberOfLines={1}
        >
          {label}
        </AppText>
        {showSubtitle ? (
          <AppText
            style={{
              ...textStart,
              fontSize: typography.tiny,
              fontFamily: fonts.regular,
              color: c.textMuted,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {multi && !branchLoading && !switching ? (
        <MaterialIcons
          name={open ? 'expand-less' : 'expand-more'}
          size={18}
          color={c.textMuted}
        />
      ) : null}
    </>
  );

  const pillStyle: ViewStyle = {
    ...flexRow,
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: showSubtitle ? 6 : 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: pillBorderColor,
    backgroundColor: pillBackground,
    opacity: branchLoading ? 0.75 : 1,
  };

  return (
    <>
      <View style={{ flex: 1, minWidth: 0 }}>
        {multi ? (
          <Pressable
            onPress={() => setOpen(true)}
            disabled={branchLoading || switching}
            style={pillStyle}
            accessibilityRole="button"
            accessibilityLabel="تبديل الفرع"
          >
            {pillContent}
          </Pressable>
        ) : (
          <View style={pillStyle}>{pillContent}</View>
        )}
      </View>

      <AppBottomSheet
        visible={open}
        onClose={handleClose}
        title="تبديل الفرع"
        dismissable={!switching}
      >
        {branches.length > 5 ? (
          <View
            style={{
              ...flexRow,
              alignItems: 'center',
              gap: spacing.sm,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: c.borderSubtle,
              backgroundColor: c.surfaceMuted,
              marginBottom: spacing.xs,
            }}
          >
            <MaterialIcons name="search" size={18} color={c.textMuted} />
            <AppTextInput
              value={search}
              onChangeText={setSearch}
              placeholder="بحث بالاسم أو الكود..."
              placeholderTextColor={c.textCaption}
              style={{
                flex: 1,
                fontSize: typography.body,
                fontFamily: fonts.medium,
                color: c.text,
                paddingVertical: spacing.xs,
              }}
              editable={!switching}
            />
          </View>
        ) : null}

        {canUseGlobalView(user) ? (
          <>
            <BranchRow
              icon="public"
              title="كل الفروع"
              subtitle="عرض عام"
              selected={viewMode === 'global'}
              disabled={switching}
              onPress={() => void handleSelect(null)}
            />
            {branches.length > 0 ? (
              <View
                style={{
                  height: 1,
                  backgroundColor: c.borderSubtle,
                  marginVertical: spacing.xs,
                }}
              />
            ) : null}
          </>
        ) : null}

        {filteredBranches.length === 0 ? (
          <AppText
            style={{
              ...textStart,
              fontSize: typography.body,
              fontFamily: fonts.regular,
              color: c.textMuted,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
            }}
          >
            لا توجد فروع مطابقة
          </AppText>
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
          <View style={{ ...flexRow, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingTop: spacing.sm }}>
            <ActivityIndicator size="small" color={c.accent} />
            <AppText style={{ fontSize: typography.caption, fontFamily: fonts.medium, color: c.textMuted }}>
              جاري التبديل...
            </AppText>
          </View>
        ) : null}
      </AppBottomSheet>
    </>
  );
}
