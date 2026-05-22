import React, { useCallback, useState } from 'react';
import { textStart } from '@/constants/layout';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { suppliersAPI } from '@/api/suppliers';
import { supplierPaymentsAPI } from '@/api/supplierPayments';
import { vaultsAPI } from '@/api/vaults';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import { AppBottomSheet, AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppInput, AppSectionHeader, AppSelect } from '@/components/ui';
import { ConfirmDialog, AppErrorState } from '@/components/feedback';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { extractArray } from '@/utils/data';
import { money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

export function SupplierDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const rawId = route.params?.id;
  if (!rawId) {
    return (
      <AppScreen title="خطأ" onBack={navigation.goBack}>
        <AppErrorState message="معرّف المورد مفقود" onRetry={navigation.goBack} />
      </AppScreen>
    );
  }
  return <SupplierDetail id={rawId} navigation={navigation} route={route} />;
}

function SupplierDetail({ id, navigation, route }: { id: string | number; navigation: any; route: any }) {

  const [settleOpen, setSettleOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleVaultId, setSettleVaultId] = useState<string | null>(null);
  const [settleSubmitting, setSettleSubmitting] = useState(false);
  const [settleError, setSettleError] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const loadVaults = useCallback(() => vaultsAPI.list({ active_only: true }), []);
  const vaultsResource = useAsyncResource<Record<string, unknown>[]>(loadVaults);
  const vaults = extractArray<Record<string, unknown>>(vaultsResource.data);

  const handleSettle = async (onSuccess: () => void) => {
    if (!settleAmount || !settleVaultId) { setSettleError('أدخل المبلغ واختر الخزنة'); return; }
    setSettleSubmitting(true);
    setSettleError(null);
    try {
      await supplierPaymentsAPI.create({
        supplier_id: Number(id),
        vault_id: settleVaultId,
        amount: settleAmount,
        payment_date: new Date().toISOString().split('T')[0],
      });
      setSettleOpen(false);
      setSettleAmount('');
      setSettleVaultId(null);
      onSuccess();
    } catch (err) {
      setSettleError(normalizeApiError(err).message);
    } finally {
      setSettleSubmitting(false);
    }
  };

  return (
    <DetailScreen<Record<string, unknown>>
      title={route.params?.name || 'تفاصيل المورد'}
      onBack={navigation.goBack}
      loader={() => suppliersAPI.getById(id)}
      fields={[
        { label: 'الاسم', value: (item) => String(item.name ?? '—') },
        { label: 'الهاتف', value: (item) => String(item.phone ?? '—'), ltr: true },
        { label: 'البريد', value: (item) => String(item.email ?? '—'), ltr: true },
        { label: 'الرصيد', value: (item) => money(item.balance ?? item.current_balance ?? 0) },
        { label: 'ائتمان متاح', value: (item) => money(item.available_credit ?? 0) },
      ]}
    >
      {(supplier, { refresh }) => (
        <>
          <AppCard>
            <AppSectionHeader title="تسوية" />
            <AppButton title="تسوية دفعة" variant="secondary" onPress={() => setSettleOpen(true)} />
          </AppCard>

          <AppBottomSheet visible={settleOpen} onClose={() => setSettleOpen(false)}>
            <View style={styles.sheetContent}>
              <AppSectionHeader title="تسوية دفعة للمورد" />
              <Text style={styles.balanceText}>الرصيد: {money(supplier.balance ?? supplier.current_balance ?? 0)}</Text>
              <AppInput
                label="المبلغ"
                keyboardType="numeric"
                value={settleAmount}
                onChangeText={setSettleAmount}
                placeholder="أدخل المبلغ"
              />
              <AppSelect
                label="الخزنة"
                value={settleVaultId}
                options={vaults.map((v) => ({ label: String(v.name ?? ''), value: String(v.id) }))}
                onChange={setSettleVaultId}
              />
              {settleError ? <Text style={styles.errorText}>{settleError}</Text> : null}
              <AppButton
                title="تأكيد التسوية"
                loading={settleSubmitting}
                disabled={!settleAmount || !settleVaultId}
                onPress={() => setConfirmVisible(true)}
              />
            </View>
          </AppBottomSheet>

          <ConfirmDialog
            visible={confirmVisible}
            title="تأكيد التسوية"
            message={`سيتم دفع ${money(Number(settleAmount) || 0)}`}
            confirmLabel="تأكيد"
            onConfirm={() => { setConfirmVisible(false); void handleSettle(refresh); }}
            onCancel={() => setConfirmVisible(false)}
            loading={settleSubmitting}
          />
        </>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  sheetContent: { gap: spacing.md },
  balanceText: { color: colors.text, fontSize: typography.body, fontWeight: '800', ...textStart },
  errorText: { color: colors.danger, ...textStart, fontWeight: '800' },
});
