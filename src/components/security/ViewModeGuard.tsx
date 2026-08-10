import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { AppButton, AppText } from '@/components/ui';
import { flexRow, textStart } from '@/constants/layout';
import { backArrowIcon } from '@/utils/rtl';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { useBranchStore } from '@/store/branchStore';
import { normalizeApiError } from '@/utils/errors';
import type { ViewMode } from '@/navigation/viewModeRoutePolicy';
import { isViewModeAllowed } from '@/navigation/viewModeRoutePolicy';

type ViewModeGuardProps = {
  allowedModes: ViewMode[];
  children: React.ReactNode;
};

export function ViewModeGuard({ allowedModes, children }: ViewModeGuardProps) {
  const c = useColors();
  const viewMode = useBranchStore((s) => s.viewMode);
  const branches = useBranchStore((s) => s.branches);
  const branchLoading = useBranchStore((s) => s.loading);
  const switchBranch = useBranchStore((s) => s.switchBranch);
  const navigation = useNavigation();
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allowed = isViewModeAllowed(allowedModes, viewMode);
  const showBranchGate = viewMode === 'global' && !allowedModes.includes('global');

  useEffect(() => {
    if (allowed || showBranchGate) return;
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'DashboardTab' }],
      }),
    );
  }, [allowed, navigation, showBranchGate]);

  if (allowed) return <>{children}</>;

  if (showBranchGate) {
    const chooseBranch = async (branchId: string) => {
      if (switchingId) return;
      setSwitchingId(branchId);
      setError(null);
      try {
        await switchBranch(branchId);
        navigation.dispatch(CommonActions.navigate({ name: 'POSTab' }));
      } catch (err) {
        setError(normalizeApiError(err).message);
      } finally {
        setSwitchingId(null);
      }
    };

    return (
      <View style={[styles.root, { backgroundColor: c.background }]}>
        <View style={styles.frame}>
          <View style={[styles.iconWell, { backgroundColor: c.surfaceMuted }]}>
            <MaterialIcons name="store" size={24} color={c.textMuted} />
          </View>
          <View style={styles.copy}>
            <AppText style={[styles.eyebrow, { color: c.textCaption }]}>سياق التشغيل</AppText>
            <AppText style={[styles.title, { color: c.text }]}>اختر فرعًا لبدء العمل</AppText>
            <AppText style={[styles.subtitle, { color: c.textMuted }]}>
              نقطة البيع والعمليات المالية تعمل على فرع محدد. اختيارك هنا يحدّث السياق ثم يفتح الشاشة تلقائيًا.
            </AppText>
          </View>

          {error ? (
            <View style={[styles.error, { backgroundColor: c.softDanger, borderColor: c.softDangerBorder }]}>
              <MaterialIcons name="error-outline" size={18} color={c.danger} />
              <AppText style={[styles.errorText, { color: c.danger }]}>{error}</AppText>
            </View>
          ) : null}

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {branchLoading && branches.length === 0 ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={c.textMuted} />
                <AppText style={[styles.subtitle, { color: c.textMuted }]}>جاري تحميل الفروع المتاحة…</AppText>
              </View>
            ) : null}
            {branches.map((branch) => {
              const switching = switchingId === branch.id;
              return (
                <Pressable
                  key={branch.id}
                  onPress={() => void chooseBranch(branch.id)}
                  disabled={Boolean(switchingId)}
                  accessibilityRole="button"
                  accessibilityLabel={`اختيار فرع ${branch.name}`}
                  style={({ pressed }) => [
                    styles.branchRow,
                    { backgroundColor: pressed ? c.surfaceMuted : c.surface, borderColor: c.border },
                  ]}
                >
                  <View style={[styles.branchIcon, { backgroundColor: c.surfaceMuted }]}>
                    {switching ? <ActivityIndicator size="small" color={c.textMuted} /> : <MaterialIcons name="storefront" size={18} color={c.textMuted} />}
                  </View>
                  <View style={styles.branchCopy}>
                    <AppText style={[styles.branchName, { color: c.text }]} numberOfLines={1}>{branch.name}</AppText>
                    <AppText style={[styles.branchMeta, { color: c.textCaption }]} numberOfLines={1}>
                      {branch.code ? `كود ${branch.code}` : 'فرع متاح'}
                    </AppText>
                  </View>
                  <MaterialIcons name={backArrowIcon()} size={18} color={c.textCaption} />
                </Pressable>
              );
            })}
          </ScrollView>

          <AppButton
            title="العودة للوحة التحكم"
            variant="ghost"
            onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'DashboardTab' }] }))}
          />
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  frame: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', gap: spacing.lg, justifyContent: 'center' },
  iconWell: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  copy: { gap: spacing.xs },
  eyebrow: { ...textStart, fontFamily: fonts.bold, fontSize: typography.micro, letterSpacing: 0.6 },
  title: { ...textStart, fontFamily: fonts.extraBold, fontWeight: '800', fontSize: typography.h2, lineHeight: 34 },
  subtitle: { ...textStart, fontFamily: fonts.regular, fontSize: typography.small, lineHeight: 21 },
  error: { ...flexRow, alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  errorText: { ...textStart, flex: 1, fontFamily: fonts.bold, fontSize: typography.caption },
  list: { maxHeight: 360 },
  listContent: { borderTopWidth: StyleSheet.hairlineWidth },
  loadingRow: { ...flexRow, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  branchRow: { ...flexRow, minHeight: 68, alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  branchIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  branchCopy: { flex: 1, minWidth: 0, gap: 2 },
  branchName: { ...textStart, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.body },
  branchMeta: { ...textStart, fontFamily: fonts.regular, fontSize: typography.caption },
});
