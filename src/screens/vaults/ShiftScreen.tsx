import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { shiftsAPI } from '@/api/shifts';
import { vaultsAPI } from '@/api/vaults';
import { useBranchStore } from '@/store/branchStore';
import { AppScreen, AppBottomSheet } from '@/components/layout';
import { AppBadge, AppButton, AppCard, AppInput, AppListItem, AppSectionHeader, AppSelect, AppStatCard } from '@/components/ui';
import { ConfirmDialog, AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractArray, extractData } from '@/utils/data';
import { dateText, money, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

export function ShiftScreen({ navigation }: { route: any; navigation: any }) {
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const [currentShift, setCurrentShift] = useState<Record<string, unknown> | null>(null);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [shifts, setShifts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openSheet, setOpenSheet] = useState(false);
  const [closeSheet, setCloseSheet] = useState(false);
  const [vaults, setVaults] = useState<Record<string, unknown>[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [startingCash, setStartingCash] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'open' | 'close' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [shiftsRes, currentRes] = await Promise.all([
        shiftsAPI.list({ limit: 20 }),
        activeBranch?.id ? shiftsAPI.current(activeBranch.id) : Promise.resolve({ data: null }),
      ]);
      const allShifts = extractArray<Record<string, unknown>>(shiftsRes);
      setShifts(allShifts);
      const activeShift = extractData<Record<string, unknown> | null>(currentRes as any) ?? null;
      setCurrentShift(activeShift);
      if (activeShift?.id) {
        try {
          const summaryRes = await shiftsAPI.getSummary(String(activeShift.id));
          setSummary(extractData<Record<string, unknown>>(summaryRes as any) ?? null);
        } catch {
          setSummary(null);
        }
      } else {
        setSummary(null);
      }
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [activeBranch?.id]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!openSheet && !closeSheet) return;
    vaultsAPI.list({ active_only: true })
      .then((res) => setVaults(extractArray(res)))
      .catch(() => {});
  }, [openSheet, closeSheet]);

  const handleOpenShift = async () => {
    if (!selectedVaultId || !startingCash) { setActionError('أدخل البيانات المطلوبة'); return; }
    setSubmitting(true);
    setActionError(null);
    try {
      await shiftsAPI.open({
        vault_id: selectedVaultId,
        starting_cash: Number(startingCash),
      });
      setOpenSheet(false);
      setSelectedVaultId(null);
      setStartingCash('');
      void load();
    } catch (err) {
      setActionError(normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async () => {
    if (!actualCash) { setActionError('أدخل النقدية الفعلية'); return; }
    setSubmitting(true);
    setActionError(null);
    try {
      await shiftsAPI.close(String(currentShift!.id), {
        actual_cash: Number(actualCash),
        ...(closeNotes ? { notes: closeNotes } : {}),
      });
      setCloseSheet(false);
      setActualCash('');
      setCloseNotes('');
      void load();
    } catch (err) {
      setActionError(normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen title="إدارة الورديات" onBack={navigation.goBack}>
      {loading ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <>
          <View style={styles.stats}>
            <AppStatCard label="الحالة" value={currentShift ? 'مفتوحة' : 'مغلقة'} tone={currentShift ? 'success' : 'warning'} />
            <AppStatCard label="نقدية البداية" value={money(currentShift?.starting_cash ?? 0)} tone="primary" />
          </View>

          {currentShift ? (
            <AppCard style={styles.card}>
              <AppSectionHeader title="الوردية الحالية" />
              <AppListItem
                title={`وردية ${currentShift.shift_no ?? currentShift.id}`}
                subtitle={dateText(String(currentShift.opened_at ?? ''))}
                meta={money(currentShift.expected_cash ?? currentShift.starting_cash ?? 0)}
                badge={<AppBadge label="مفتوحة" tone="success" />}
              />
              {summary ? (
                <View style={styles.summarySection}>
                  <Text style={styles.summaryTitle}>ملخص الوردية</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryValue}>{money(summary.total_sales ?? 0)}</Text>
                    <Text style={styles.summaryLabel}>إجمالي المبيعات</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryValue}>{money(summary.total_expenses ?? 0)}</Text>
                    <Text style={styles.summaryLabel}>إجمالي المصروفات</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryValue}>{money(summary.expected_cash ?? 0)}</Text>
                    <Text style={styles.summaryLabel}>النقدية المتوقعة</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryValue}>{numberText(summary.total_transactions ?? 0)}</Text>
                    <Text style={styles.summaryLabel}>عدد العمليات</Text>
                  </View>
                </View>
              ) : null}
              <AppButton title="إغلاق الوردية" variant="danger" onPress={() => { setActionError(null); setCloseSheet(true); }} />
            </AppCard>
          ) : (
            <AppCard style={styles.card}>
              <AppEmptyState title="لا توجد وردية نشطة" message="افتح وردية جديدة للبدء" />
              <AppButton title="فتح وردية" onPress={() => { setActionError(null); setOpenSheet(true); }} />
            </AppCard>
          )}

          <AppCard style={styles.card}>
            <AppSectionHeader title="سجل الورديات" />
            {shifts.length === 0 ? <AppEmptyState title="لا توجد ورديات" /> : shifts.map((s) => (
              <AppListItem
                key={String(s.id)}
                title={`وردية ${s.shift_no ?? s.id}`}
                subtitle={dateText(String(s.opened_at ?? ''))}
                meta={money(s.expected_cash ?? s.starting_cash ?? 0)}
                badge={<AppBadge label={s.closed_at ? 'مغلقة' : 'مفتوحة'} tone={s.closed_at ? 'default' : 'success'} />}
              />
            ))}
          </AppCard>
        </>
      ) : null}

      <AppBottomSheet visible={openSheet} onClose={() => setOpenSheet(false)}>
        <View style={styles.sheetContent}>
          <AppSectionHeader title="فتح وردية" />
          <AppSelect
            label="الخزنة"
            value={selectedVaultId}
            options={vaults.map((v) => ({ label: String(v.name ?? ''), value: String(v.id) }))}
            onChange={setSelectedVaultId}
          />
          <AppInput label="نقدية البداية" keyboardType="numeric" value={startingCash} onChangeText={setStartingCash} placeholder="أدخل المبلغ" />
          {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
          <AppButton
            title="فتح الوردية"
            loading={submitting}
            disabled={!selectedVaultId || !startingCash}
            onPress={() => { setConfirmAction('open'); setConfirmVisible(true); }}
          />
        </View>
      </AppBottomSheet>

      <AppBottomSheet visible={closeSheet} onClose={() => setCloseSheet(false)}>
        <View style={styles.sheetContent}>
          <AppSectionHeader title="إغلاق الوردية" />
          <Text style={styles.expectedText}>النقدية المتوقعة: {money(currentShift?.expected_cash ?? 0)}</Text>
          <AppInput label="النقدية الفعلية" keyboardType="numeric" value={actualCash} onChangeText={setActualCash} placeholder="أدخل المبلغ" />
          <AppInput label="ملاحظات" value={closeNotes} onChangeText={setCloseNotes} multiline />
          {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
          <AppButton
            title="إغلاق الوردية"
            variant="danger"
            loading={submitting}
            disabled={!actualCash}
            onPress={() => { setConfirmAction('close'); setConfirmVisible(true); }}
          />
        </View>
      </AppBottomSheet>

      <ConfirmDialog
        visible={confirmVisible}
        title={confirmAction === 'open' ? 'تأكيد فتح الوردية' : 'تأكيد إغلاق الوردية'}
        message={confirmAction === 'open' ? `نقدية البداية: ${money(Number(startingCash) || 0)}` : `النقدية الفعلية: ${money(Number(actualCash) || 0)}`}
        confirmLabel="تأكيد"
        onConfirm={() => {
          setConfirmVisible(false);
          if (confirmAction === 'open') void handleOpenShift();
          else if (confirmAction === 'close') void handleCloseShift();
          setConfirmAction(null);
        }}
        onCancel={() => { setConfirmVisible(false); setConfirmAction(null); }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  stats: { ...flexRow, flexWrap: 'wrap', gap: spacing.md },
  card: { gap: spacing.md },
  summarySection: { gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  summaryTitle: { color: colors.text, fontSize: typography.h3, fontWeight: '900', ...textStart },
  summaryRow: { ...flexRow, justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: colors.textMuted, fontSize: typography.small, ...textStart },
  summaryValue: { color: colors.text, fontSize: typography.body, fontWeight: '800', ...textStart },
  sheetContent: { gap: spacing.md },
  expectedText: { color: colors.info, fontSize: typography.body, fontWeight: '800', ...textStart },
  errorText: { color: colors.danger, ...textStart, fontWeight: '800' },
});
