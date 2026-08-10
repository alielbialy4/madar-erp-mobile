import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import type { FinancialAccount } from '@/types/api';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { PosSheetHeader, PosTotalHero, usePosSheetStyles } from '@/components/pos/posSheetUi';
import { MetricBlock } from '@/components/madar';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { money } from '@/utils/format';

export type SplitLine = {
  financial_account_id: string;
  vault_id?: string | null;
  amount: string;
  payment_method: 'cash' | 'card' | 'wallet' | 'electronic_wallet' | 'instapay' | 'bank_transfer' | 'payment_gateway';
};

type Props = {
  visible: boolean;
  totalDue: number;
  financialAccounts: FinancialAccount[];
  hasCustomer: boolean;
  onClose: () => void;
  onConfirm: (lines: SplitLine[]) => void;
};

export function SplitPaymentSheet({ visible, totalDue, financialAccounts, hasCustomer, onClose, onConfirm }: Props) {
  const c = useColors();
  const s = usePosSheetStyles();
  const [lines, setLines] = useState<SplitLine[]>([
    { payment_method: 'cash', financial_account_id: financialAccounts.find((a) => a.payment_method === 'cash')?.id ?? '', amount: '' },
    { payment_method: 'card', financial_account_id: financialAccounts.find((a) => a.payment_method === 'card')?.id ?? '', amount: '' },
  ]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLines([
      { payment_method: 'cash', financial_account_id: financialAccounts.find((a) => a.payment_method === 'cash')?.id ?? '', amount: '' },
      { payment_method: 'card', financial_account_id: financialAccounts.find((a) => a.payment_method === 'card')?.id ?? '', amount: '' },
    ]);
    setError(null);
  }, [visible, financialAccounts]);

  const updateLine = (index: number, field: keyof SplitLine, value: string) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
    setError(null);
  };

  const addLine = () => {
    setLines((prev) => [...prev, { payment_method: 'card', financial_account_id: financialAccounts.find((a) => a.payment_method === 'card')?.id ?? '', amount: '' }]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const totalPaid = lines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
  const remaining = Math.max(0, totalDue - totalPaid);
  const mismatch = Math.abs(totalPaid - totalDue) > 0.02;
  const activeLines = lines.filter((l) => (parseFloat(l.amount) || 0) > 0);

  const handleConfirm = () => {
    if (financialAccounts.length === 0) {
      setError('لا توجد حسابات دفع متاحة للدفع المقسم.');
      return;
    }
    if (activeLines.length < 2) {
      setError('أضف خطّي دفع على الأقل بمبالغ أكبر من صفر.');
      return;
    }
    if (activeLines.some((line) => line.payment_method !== 'wallet' && !line.financial_account_id)) {
      setError('اختر حساباً مالياً لكل خط دفع غير محفظة العميل.');
      return;
    }
    if (mismatch) {
      setError(`المجموع المدفوع (${money(totalPaid)}) يجب أن يساوي المستحق (${money(totalDue)})`);
      return;
    }
    onConfirm(activeLines);
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      <View style={s.root}>
        <PosSheetHeader title="دفع مقسم" subtitle="وزّع المبلغ على أكثر من طريقة دفع وخزنة" />
        <PosTotalHero label="المستحق" amount={money(totalDue)} hint={mismatch && totalPaid > 0 ? `فرق ${money(Math.abs(totalDue - totalPaid))}` : `متبقي ${money(remaining)}`} />

        <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
          <MetricBlock label="المستحق" value={totalDue} currency="ج.م" level="C" style={{ flex: 1, minWidth: '28%' }} />
          <MetricBlock label="المدفوع" value={totalPaid} currency="ج.م" level="C" tone="positive" style={{ flex: 1, minWidth: '28%' }} />
          <MetricBlock
            label="المتبقي"
            value={remaining}
            currency="ج.م"
            level="C"
            tone={remaining > 0.02 ? 'warning' : 'positive'}
            style={{ flex: 1, minWidth: '28%' }}
          />
        </View>

        {mismatch && totalPaid > 0 ? (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>فرق: {money(totalDue - totalPaid)} — عدّل المبالغ</Text>
          </View>
        ) : null}

        {financialAccounts.length === 0 ? (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>لا توجد حسابات دفع متاحة. لا يمكن تنفيذ الدفع المقسم.</Text>
          </View>
        ) : null}

        <View style={{ gap: spacing.md }}>
          {lines.map((item, index) => (
            <View key={index} style={s.lineCard}>
              <View style={[flexRow, { justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={{ ...textStart, fontFamily: fonts.bold, fontSize: typography.body, color: c.text }}>
                  خط دفع {index + 1}
                </Text>
                {lines.length > 2 ? (
                  <Pressable onPress={() => removeLine(index)} hitSlop={8}>
                    <MaterialIcons name="delete-outline" size={22} color={c.danger} />
                  </Pressable>
                ) : null}
              </View>
              <AppSelect
                label="طريقة الدفع"
                value={item.payment_method}
                onChange={(v) => updateLine(index, 'payment_method', v)}
                options={[
                  { label: 'نقدي', value: 'cash' },
                  { label: 'بطاقة', value: 'card' },
                  { label: 'محافظ إلكترونية', value: 'electronic_wallet' },
                  { label: 'إنستا باي', value: 'instapay' },
                  { label: 'تحويل بنكي', value: 'bank_transfer' },
                  { label: 'بوابة دفع', value: 'payment_gateway' },
                  ...(hasCustomer ? [{ label: 'محفظة', value: 'wallet' }] : []),
                ]}
              />
              <AppInput
                label="المبلغ"
                keyboardType="decimal-pad"
                value={item.amount}
                onChangeText={(v) => updateLine(index, 'amount', v)}
                placeholder="0.00"
              />
              {item.payment_method !== 'wallet' ? (
                <AppSelect
                  label="حساب الدفع"
                  value={item.financial_account_id}
                  onChange={(v) => updateLine(index, 'financial_account_id', v)}
                  options={financialAccounts
                    .filter((account) => account.payment_method === item.payment_method)
                    .map((account) => ({
                      label: [account.name, account.provider_name, account.masked_identifier].filter(Boolean).join(' · '),
                      value: String(account.id),
                    }))}
                />
              ) : null}
            </View>
          ))}
        </View>

        {error ? (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={s.stickyFooter}>
          <View style={[flexRow, { gap: spacing.sm }]}>
            <AppButton title="إضافة خط" variant="outline" onPress={addLine} style={{ flex: 1 }} />
            <AppButton
              title="تأكيد التوزيع"
              onPress={handleConfirm}
              disabled={financialAccounts.length === 0 || mismatch || activeLines.length < 2}
              style={{ flex: 1 }}
            />
          </View>
          <AppButton title="إلغاء" variant="ghost" onPress={onClose} fullWidth />
        </View>
      </View>
    </AppBottomSheet>
  );
}
