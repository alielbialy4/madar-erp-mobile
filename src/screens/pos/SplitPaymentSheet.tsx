import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import type { Vault } from '@/types/api';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppInput, AppSectionHeader, AppSelect } from '@/components/ui';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { money } from '@/utils/format';

export type SplitLine = {
  vault_id: string;
  amount: string;
  payment_method: 'cash' | 'card' | 'wallet';
};

type Props = {
  visible: boolean;
  totalDue: number;
  vaults: Vault[];
  hasCustomer: boolean;
  onClose: () => void;
  onConfirm: (lines: SplitLine[]) => void;
};

export function SplitPaymentSheet({ visible, totalDue, vaults, hasCustomer, onClose, onConfirm }: Props) {
  const [lines, setLines] = useState<SplitLine[]>([
    { payment_method: 'cash', vault_id: vaults[0]?.id ?? '', amount: '' },
    { payment_method: 'card', vault_id: vaults[1]?.id ?? vaults[0]?.id ?? '', amount: '' },
  ]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLines([
      { payment_method: 'cash', vault_id: vaults[0]?.id ?? '', amount: '' },
      { payment_method: 'card', vault_id: vaults[1]?.id ?? vaults[0]?.id ?? '', amount: '' },
    ]);
    setError(null);
  }, [visible, vaults]);

  const updateLine = (index: number, field: keyof SplitLine, value: string) => {
    setLines((prev) => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
    setError(null);
  };

  const addLine = () => {
    setLines((prev) => [...prev, { payment_method: 'card', vault_id: vaults[0]?.id ?? '', amount: '' }]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const totalPaid = lines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
  const mismatch = Math.abs(totalPaid - totalDue) > 0.02;
  const activeLines = lines.filter((l) => (parseFloat(l.amount) || 0) > 0);

  const handleConfirm = () => {
    if (vaults.length === 0) {
      setError('لا توجد خزنة متاحة للدفع المقسم.');
      return;
    }
    if (activeLines.length < 2) {
      setError('يجب أن يكون هناك خطان نشطان على الأقل');
      return;
    }
    if (activeLines.some((line) => !line.vault_id)) {
      setError('اختر خزنة لكل خط دفع.');
      return;
    }
    if (mismatch) {
      setError(`المجموع (${money(totalPaid)}) لا يساوي المستحق (${money(totalDue)})`);
      return;
    }
    onConfirm(activeLines);
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <AppSectionHeader title="دفع مقسم" />
        <Text style={styles.totalLabel}>المبلغ المستحق: {money(totalDue)}</Text>
        {vaults.length === 0 ? (
          <Text style={styles.errorText}>لا توجد خزنة متاحة. لا يمكن تنفيذ الدفع المقسم بأمان.</Text>
        ) : null}
        <FlatList
          data={lines}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => (
            <View style={styles.lineCard}>
              <AppSelect
                label={`طريقة الدفع ${index + 1}`}
                value={item.payment_method}
                onChange={(v) => updateLine(index, 'payment_method', v)}
                options={[
                  { label: 'نقدي', value: 'cash' },
                  { label: 'بطاقة', value: 'card' },
                  ...(hasCustomer ? [{ label: 'محفظة', value: 'wallet' }] : []),
                ]}
              />
              <AppInput
                label="المبلغ"
                keyboardType="numeric"
                value={item.amount}
                onChangeText={(v) => updateLine(index, 'amount', v)}
              />
              <AppSelect
                label="الخزنة"
                value={item.vault_id}
                onChange={(v) => updateLine(index, 'vault_id', v)}
                options={vaults.map((vault) => ({ label: vault.name, value: vault.id }))}
              />
              {lines.length > 2 ? (
                <AppButton title="حذف" variant="ghost" onPress={() => removeLine(index)} size="sm" />
              ) : null}
            </View>
          )}
        />
        <Text style={styles.summaryText}>الإجمالي المدفوع: {money(totalPaid)}</Text>
        {mismatch ? <Text style={styles.errorText}>فرق: {money(totalDue - totalPaid)}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.actions}>
          <AppButton title="إضافة خط دفع" variant="outline" onPress={addLine} style={{ flex: 1 }} />
          <AppButton title="تأكيد" onPress={handleConfirm} disabled={vaults.length === 0 || mismatch || activeLines.length < 2} style={{ flex: 1 }} />
        </View>
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  totalLabel: { color: colors.text, fontSize: typography.h3, fontWeight: '900', ...textStart },
  lineCard: { borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.xl, padding: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  summaryText: { color: colors.text, fontSize: typography.body, fontWeight: '800', ...textStart },
  errorText: { color: colors.danger, fontSize: typography.small, ...textStart, fontWeight: '800' },
  actions: { ...flexRow, gap: spacing.md },
});
