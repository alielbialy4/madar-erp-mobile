import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { billSplitAPI } from '@/api/billSplit';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppInput, AppSectionHeader } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { normalizeApiError } from '@/utils/errors';

type Props = {
  visible: boolean;
  saleId: number;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export function BillSplitSheet({ visible, saleId, onClose, onSuccess }: Props) {
  const c = useColors();
  const [ways, setWays] = useState('2');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: { gap: spacing.md },
        hint: { color: c.textMuted, fontSize: typography.small, ...textStart },
        error: { color: c.danger, fontSize: typography.small, fontWeight: '700', ...textStart },
      }),
    [c],
  );

  const submit = async () => {
    const n = parseInt(ways, 10);
    if (!Number.isFinite(n) || n < 2) {
      setError('أدخل عدداً من الفواتير (2 أو أكثر)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await billSplitAPI.split(saleId, { type: 'equal', ways: n });
      if (response.status === 'success') {
        onSuccess(response.message || 'تم تقسيم الفاتورة بنجاح');
        onClose();
        return;
      }
      setError(response.message || 'تعذر تقسيم الفاتورة');
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <AppSectionHeader title="تقسيم الفاتورة بالتساوي" />
        <Text style={styles.hint}>
          يُنشئ عدة فواتير فرعية بحالة «معلّقة» يمكن تحصيل كل منها على حدة. التقسيم حسب الأصناف أو المبالغ متاح من الويب.
        </Text>
        <AppInput label="عدد الأجزاء" value={ways} onChangeText={setWays} keyboardType="number-pad" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton title="تقسيم" onPress={() => void submit()} loading={loading} />
        <AppButton title="إلغاء" variant="secondary" onPress={onClose} disabled={loading} />
      </View>
    </AppBottomSheet>
  );
}
