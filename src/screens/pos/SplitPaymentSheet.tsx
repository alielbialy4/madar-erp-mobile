import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import type { Vault } from '@/types/api';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { PosSheetHeader, PosTotalHero, usePosSheetStyles } from '@/components/pos/posSheetUi';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
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
  const c = useColors();
  const s = usePosSheetStyles();
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
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
    setError(null);
  };

  const addLine = () => {
    setLines((prev) => [...prev, { payment_method: 'card', vault_id: vaults[0]?.id ?? '', amount: '' }]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const totalPaid = lines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
  const remaining = Math.max(0, totalDue - totalPaid);
  const mismatch = Math.abs(totalPaid - totalDue) > 0.02;
  const activeLines = lines.filter((l) => (parseFloat(l.amount) || 0) > 0);

  const handleConfirm = () => {
    if (vaults.length === 0) {
      setError('لا توجد خزنة متاحة للدفع المقسم.');
      return;
    }
    if (activeLines.length < 2) {
      setError('أضف خطّي دفع على الأقل بمبالغ أكبر من صفر.');
      return;
    }
    if (activeLines.some((line) => !line.vault_id)) {
      setError('اختر خزنة لكل خط دفع.');
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
        <PosTotalHero label="المستحق" amount={money(totalDue)} />

        <View style={s.splitMeter}>
          <View style={s.meterBox}>
            <Text style={[s.meterValue, s.meterDue]}>{money(totalDue)}</Text>
            <Text style={s.meterLabel}>المستحق</Text>
          </View>
          <View style={s.meterBox}>
            <Text style={[s.meterValue, s.meterPaid]}>{money(totalPaid)}</Text>
            <Text style={s.meterLabel}>المدفوع</Text>
          </View>
          <View style={s.meterBox}>
            <Text style={[s.meterValue, s.meterRemain]}>{money(remaining)}</Text>
            <Text style={s.meterLabel}>المتبقي</Text>
          </View>
        </View>

        {mismatch && totalPaid > 0 ? (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>فرق: {money(totalDue - totalPaid)} — عدّل المبالغ</Text>
          </View>
        ) : null}

        {vaults.length === 0 ? (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>لا توجد خزنة متاحة. لا يمكن تنفيذ الدفع المقسم.</Text>
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
              <AppSelect
                label="الخزنة"
                value={item.vault_id}
                onChange={(v) => updateLine(index, 'vault_id', v)}
                options={vaults.map((vault) => ({ label: vault.name, value: String(vault.id) }))}
              />
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
              disabled={vaults.length === 0 || mismatch || activeLines.length < 2}
              style={{ flex: 1 }}
            />
          </View>
          <AppButton title="إلغاء" variant="ghost" onPress={onClose} fullWidth />
        </View>
      </View>
    </AppBottomSheet>
  );
}
