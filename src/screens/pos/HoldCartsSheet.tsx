import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppInput, AppListItem } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { AppText as Text } from '@/components/ui/AppText';
import {
  deleteHeldCart,
  listHeldCarts,
  restoreHeldCart,
  saveHeldCart,
  type HeldCartListItem,
} from '@/services/pos/holdCartService';
import type { CartLine } from '@/store/posStore';
import type { Coupon, Customer } from '@/types/api';
import { money, dateText } from '@/utils/format';
import { spacing } from '@/constants/spacing';
import { textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'list' | 'save';
  cart: CartLine[];
  customer: Customer | null;
  manualDiscount: number;
  appliedCoupon: { coupon: Coupon; discount: number } | null;
  cartTotal: number;
  onRestore: (data: {
    lines: CartLine[];
    customer: Customer | null;
    manualDiscount: number;
    appliedCoupon: { coupon: Coupon; discount: number } | null;
  }) => void;
};

export function HoldCartsSheet({
  visible,
  onClose,
  initialMode = 'list',
  cart,
  customer,
  manualDiscount,
  appliedCoupon,
  cartTotal,
  onRestore,
}: Props) {
  const c = useColors();
  const [mode, setMode] = useState<'list' | 'save'>('list');
  const [items, setItems] = useState<HeldCartListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cartName, setCartName] = useState('');
  const [paidAdvance, setPaidAdvance] = useState('');
  const [confirmReplace, setConfirmReplace] = useState<HeldCartListItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<HeldCartListItem | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listHeldCarts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      setMessage(null);
      void refresh();
    }
  }, [visible, refresh, initialMode]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const res = await saveHeldCart({
      name: cartName,
      cart,
      customer,
      manualDiscount,
      appliedCoupon,
      paidAdvance: paidAdvance === '' ? 0 : Number(paidAdvance) || 0,
    });
    setSaving(false);
    setMessage(res.message);
    if (res.ok) {
      setCartName('');
      setPaidAdvance('');
      setMode('list');
      void refresh();
    }
  };

  const applyRestore = async (item: HeldCartListItem) => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await restoreHeldCart(item);
      onRestore(data);
      onClose();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'تعذر استعادة السلة');
    } finally {
      setLoading(false);
      setConfirmReplace(null);
    }
  };

  const handleRestorePress = (item: HeldCartListItem) => {
    if (cart.length > 0) {
      setConfirmReplace(item);
      return;
    }
    void applyRestore(item);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setLoading(true);
    try {
      await deleteHeldCart(confirmDelete);
      setMessage('تم حذف السلة المحفوظة');
      void refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'تعذر الحذف');
    } finally {
      setLoading(false);
      setConfirmDelete(null);
    }
  };

  return (
    <>
      <AppBottomSheet visible={visible} onClose={onClose} title={mode === 'save' ? 'حفظ السلة' : 'السلات المحفوظة'}>
        <View style={{ gap: spacing.md }}>
          {message ? <Text style={{ ...textStart, color: c.warning }}>{message}</Text> : null}

          {mode === 'save' ? (
            <>
              <Text style={textStart}>
                السلة الحالية: {cart.length} صنف — الإجمالي {money(cartTotal)}
              </Text>
              <AppInput label="اسم السلة (اختياري)" value={cartName} onChangeText={setCartName} placeholder="مثال: طاولة 5" />
              <AppInput
                label="مدفوع مقدماً"
                keyboardType="numeric"
                value={paidAdvance}
                onChangeText={setPaidAdvance}
                placeholder="0"
              />
              {customer ? <Text style={textStart}>العميل: {customer.name}</Text> : null}
              <AppButton title="حفظ" onPress={() => void handleSave()} loading={saving} disabled={cart.length === 0} />
              <AppButton title="رجوع للقائمة" variant="outline" onPress={() => setMode('list')} />
            </>
          ) : (
            <>
              <AppButton
                title="حفظ السلة الحالية"
                onPress={() => setMode('save')}
                disabled={cart.length === 0}
              />
              {loading && items.length === 0 ? (
                <Text style={textStart}>جاري التحميل...</Text>
              ) : items.length === 0 ? (
                <Text style={textStart}>لا توجد سلات محفوظة</Text>
              ) : (
                items.map((item) => (
                  <View key={item.id} style={{ gap: spacing.xs }}>
                    <AppListItem
                      title={item.name}
                      subtitle={`${item.items_count} صنف • ${item.source === 'local' ? 'محلي' : 'خادم'}`}
                      meta={`${money(item.total)} • ${dateText(item.created_at)}`}
                      onPress={() => handleRestorePress(item)}
                    />
                    <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md }}>
                      <AppButton title="استعادة" size="sm" onPress={() => handleRestorePress(item)} />
                      <AppButton title="حذف" size="sm" variant="danger" onPress={() => setConfirmDelete(item)} />
                    </View>
                  </View>
                ))
              )}
              <AppButton title="إغلاق" variant="outline" onPress={onClose} />
            </>
          )}
        </View>
      </AppBottomSheet>

      <ConfirmDialog
        visible={!!confirmReplace}
        title="استبدال السلة"
        message="سيتم استبدال السلة الحالية. هل تريد المتابعة؟"
        confirmLabel="متابعة"
        onConfirm={() => confirmReplace && void applyRestore(confirmReplace)}
        onCancel={() => setConfirmReplace(null)}
      />
      <ConfirmDialog
        visible={!!confirmDelete}
        title="حذف السلة المحفوظة"
        message={`حذف «${confirmDelete?.name ?? ''}»؟`}
        confirmLabel="حذف"
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  );
}
