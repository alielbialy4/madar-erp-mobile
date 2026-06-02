import React, { useEffect, useMemo, useState } from 'react';
import { textStart } from '@/constants/layout';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { expensesAPI } from '@/api/expenses';
import { shiftsAPI } from '@/api/shifts';
import { vaultsAPI } from '@/api/vaults';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppInput, AppSectionHeader, AppSelect } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { CrudListScreen } from '@/screens/shared/CrudListScreen';
import { extractArray } from '@/utils/data';
import { dateText, money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

export function ExpensesScreen() {
  const c = useColors();
  const [createOpen, setCreateOpen] = useState(false);
  const [categories, setCategories] = useState<Record<string, unknown>[]>([]);
  const [vaults, setVaults] = useState<Record<string, unknown>[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVault, setSelectedVault] = useState<string | null>(null);
  const [cashSource, setCashSource] = useState<'drawer' | 'vault'>('drawer');
  const [drawerLedgerOpen, setDrawerLedgerOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [listKey, setListKey] = useState(0);

  const styles = useMemo(() => StyleSheet.create({
    wrapper: { flex: 1 },
    listWrapper: { flex: 1 },
    fabWrapper: { position: 'absolute', bottom: spacing.lg, start: spacing.lg, end: spacing.lg },
    fabButton: { borderRadius: 999 },
    sheetContent: { gap: spacing.md },
    emptyHint: { color: c.textMuted, fontSize: typography.small, ...textStart },
    errorText: { color: c.danger, ...textStart, fontWeight: '800' },
  }), [c]);

  useEffect(() => {
    if (!createOpen) return;
    expensesAPI.getCategories()
      .then((res) => setCategories(extractArray(res)))
      .catch(() => {});
    vaultsAPI.list({ active_only: true })
      .then((res) => setVaults(extractArray(res)))
      .catch(() => {});
    shiftsAPI
      .current()
      .then((res) => {
        const open = res.data;
        const usesDrawer = Boolean(open?.drawer_ledger_enabled);
        setDrawerLedgerOpen(usesDrawer);
        setCashSource(usesDrawer ? 'drawer' : 'vault');
      })
      .catch(() => {
        setDrawerLedgerOpen(false);
        setCashSource('vault');
      });
  }, [createOpen]);

  const handleSubmit = async () => {
    if (!selectedCategory) { setErrorMsg('اختر التصنيف'); return; }
    if (!amount) { setErrorMsg('أدخل المبلغ'); return; }
    if (!selectedVault) { setErrorMsg('اختر الخزنة'); return; }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await expensesAPI.create({
        expense_category_id: selectedCategory,
        amount: Number(amount),
        description,
        expense_date: expenseDate,
        vault_id: selectedVault,
        cash_source: cashSource,
      });
      setCreateOpen(false);
      setAmount('');
      setDescription('');
      setSelectedCategory(null);
      setSelectedVault(null);
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setListKey((k) => k + 1);
    } catch (err) {
      setErrorMsg(normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.listWrapper} key={listKey}>
        <CrudListScreen<Record<string, unknown>>
          title="المصروفات"
          loader={expensesAPI.getAll}
          itemTitle={(item) => String((item.category as any)?.name ?? item.category_name ?? item.description ?? `مصروف ${item.id}`)}
          itemSubtitle={(item) => dateText(String(item.expense_date ?? item.created_at ?? ''))}
          itemMeta={(item) => money(item.amount ?? 0)}
          itemBadge={(item) => ({ label: String(item.status ?? 'مسجل'), tone: item.status === 'cancelled' ? 'danger' : 'success' })}
          emptyTitle="لا توجد مصروفات"
        />
      </View>

      <View style={styles.fabWrapper}>
        <AppButton title="+ مصروف جديد" onPress={() => setCreateOpen(true)} style={styles.fabButton} />
      </View>

      <AppBottomSheet visible={createOpen} onClose={() => setCreateOpen(false)}>
        <View style={styles.sheetContent}>
          <AppSectionHeader title="إنشاء مصروف" />
          {categories.length > 0 ? (
            <AppSelect
              label="التصنيف"
              value={selectedCategory}
              options={categories.map((c) => ({ label: String(c.name ?? ''), value: String(c.id) }))}
              onChange={setSelectedCategory}
            />
          ) : (
            <Text style={styles.emptyHint}>لا توجد تصنيفات</Text>
          )}
          <AppInput label="المبلغ" keyboardType="numeric" value={amount} onChangeText={setAmount} placeholder="أدخل المبلغ" />
          <AppInput label="الوصف" value={description} onChangeText={setDescription} placeholder="وصف المصروف" />
          <AppInput label="التاريخ" value={expenseDate} onChangeText={setExpenseDate} placeholder="YYYY-MM-DD" />
          {drawerLedgerOpen ? (
            <AppSelect
              label="مصدر الصرف النقدي"
              value={cashSource}
              options={[
                { label: 'من درج الوردية', value: 'drawer' },
                { label: 'من الخزنة', value: 'vault' },
              ]}
              onChange={(v) => setCashSource(v as 'drawer' | 'vault')}
            />
          ) : null}
          {vaults.length > 0 ? (
            <AppSelect
              label="الخزنة"
              value={selectedVault}
              options={vaults.map((v) => ({ label: String(v.name ?? ''), value: String(v.id) }))}
              onChange={setSelectedVault}
            />
          ) : (
            <Text style={styles.emptyHint}>لا توجد خزن نشطة</Text>
          )}
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          <AppButton
            title="إنشاء المصروف"
            loading={submitting}
            disabled={!selectedCategory || !amount || !selectedVault}
            onPress={() => setConfirmVisible(true)}
          />
        </View>
      </AppBottomSheet>

      <ConfirmDialog
        visible={confirmVisible}
        title="تأكيد إنشاء المصروف"
        message={`سيتم صرف ${money(Number(amount) || 0)}`}
        confirmLabel="تأكيد"
        onConfirm={() => { setConfirmVisible(false); void handleSubmit(); }}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}
