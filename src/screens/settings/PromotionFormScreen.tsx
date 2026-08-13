import React, { useEffect, useState } from 'react';
import { promotionsAPI } from '@/api/promotions';
import { FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms';
import { useToast } from '@/components/feedback';
import { AppButton, AppDatePicker, AppInput, AppSelect } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { hasPermission } from '@/utils/permissions';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hapticError, hapticSuccess } from '@/utils/haptics';
import { useColors } from '@/hooks/useColors';

export function PromotionFormScreen({ route, navigation }: { route: any; navigation: any }) {
  const c = useColors();
  const id = route.params?.id as string | undefined;
  const user = useAuthStore((s) => s.user);
  const branch = useBranchStore((s) => s.activeBranch);
  const canManage = hasPermission(user, ['manage_promotions']);
  const toast = useToast();

  const [name, setName] = useState('');
  const [promotionBranchId, setPromotionBranchId] = useState<string | null | undefined>(undefined);
  const [type, setType] = useState('percentage_discount');
  const [rewardValue, setRewardValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minCart, setMinCart] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [buyQty, setBuyQty] = useState('2');
  const [getQty, setGetQty] = useState('1');
  const [dineIn, setDineIn] = useState('1');
  const [takeaway, setTakeaway] = useState('1');
  const [delivery, setDelivery] = useState('1');
  const [stackable, setStackable] = useState('0');
  const [scopeConfig, setScopeConfig] = useState<Record<string, unknown>>({
    schema_version: 2,
    scope_type: 'all',
    product_ids: [],
    category_ids: [],
  });
  const [scopeNeedsWebReview, setScopeNeedsWebReview] = useState(false);
  const [priority, setPriority] = useState('0');
  const [isActive, setIsActive] = useState('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void promotionsAPI.getById(id).then((res) => {
      const p = extractData(res) as Record<string, unknown> | undefined;
      if (!p) return;
      setName(String(p.name ?? ''));
      setPromotionBranchId(p.branch_id == null ? null : String(p.branch_id));
      setType(String(p.type ?? 'percentage_discount'));
      setRewardValue(String(p.reward_value ?? ''));
      setStartDate(String(p.start_date ?? '').slice(0, 10));
      setEndDate(String(p.end_date ?? '').slice(0, 10));
      setPriority(String(p.priority ?? 0));
      setIsActive(p.is_active === false ? '0' : '1');
      const config = p.config && typeof p.config === 'object'
        ? p.config as Record<string, unknown>
        : {};
      const cond = Array.isArray(p.conditions) ? (p.conditions as Record<string, unknown>[]) : [];
      const min = cond.find((x) => x.condition_type === 'min_cart_total');
      const productCondition = cond.find((x) => x.condition_type === 'specific_product');
      const categoryCondition = cond.find((x) => x.condition_type === 'specific_category');
      const unsupportedLegacy = cond.some((x) => x.condition_type === 'specific_brand')
        || Boolean(productCondition && categoryCondition);
      const isV2 = Number(config.schema_version ?? 0) >= 2;

      if (isV2) {
        setScopeConfig(config);
        setMinCart(config.minimum_cart_total == null ? '' : String(config.minimum_cart_total));
        setMinQuantity(config.minimum_item_quantity == null ? '' : String(config.minimum_item_quantity));
        const channels = Array.isArray(config.order_types) ? config.order_types.map(String) : ['dine_in', 'takeaway', 'delivery'];
        setDineIn(channels.includes('dine_in') ? '1' : '0');
        setTakeaway(channels.includes('takeaway') ? '1' : '0');
        setDelivery(channels.includes('delivery') ? '1' : '0');
        setStackable(config.stackable === true ? '1' : '0');
        setBuyQty(String(config.buy_qty ?? 2));
        setGetQty(String(config.get_qty ?? 1));
      } else {
        const productIds = (productCondition?.condition_value as Record<string, unknown> | undefined)?.product_ids;
        const categoryIds = (categoryCondition?.condition_value as Record<string, unknown> | undefined)?.category_ids;
        setScopeConfig({
          schema_version: 2,
          scope_type: productCondition ? 'products' : categoryCondition ? 'categories' : 'all',
          product_ids: Array.isArray(productIds) ? productIds : [],
          category_ids: Array.isArray(categoryIds) ? categoryIds : [],
        });
        if (min) setMinCart(String((min.condition_value as Record<string, unknown>)?.min ?? ''));
        setScopeNeedsWebReview(unsupportedLegacy);
      }
    });
  }, [id]);

  const save = async () => {
    if (!canManage) {
      setError('ليس لديك صلاحية لتنفيذ هذه العملية.');
      return;
    }
    if (scopeNeedsWebReview) {
      setError('هذا عرض قديم بنطاق مركب أو علامة تجارية. راجع نطاقه من لوحة الويب قبل الحفظ.');
      return;
    }
    const channels = [
      dineIn === '1' ? 'dine_in' : null,
      takeaway === '1' ? 'takeaway' : null,
      delivery === '1' ? 'delivery' : null,
    ].filter(Boolean);
    if (channels.length === 0) {
      setError('اختر قناة طلب واحدة على الأقل.');
      return;
    }
    setBusy(true);
    try {
      const config: Record<string, unknown> = {
        ...scopeConfig,
        schema_version: 2,
        minimum_cart_total: minCart.trim() ? Number(minCart) : null,
        minimum_item_quantity: minQuantity.trim() ? Number(minQuantity) : null,
        order_types: channels,
        stackable: stackable === '1',
      };
      if (type === 'bogo') {
        config.buy_qty = Number(buyQty) || 2;
        config.get_qty = Number(getQty) || 1;
        config.discount_percent_on_get = Number(rewardValue) || 100;
      }
      const payload: Record<string, unknown> = {
        name: name.trim(),
        type,
        reward_value: Number(rewardValue) || 0,
        start_date: startDate || new Date().toISOString().slice(0, 10),
        end_date: endDate || new Date().toISOString().slice(0, 10),
        is_active: isActive === '1',
        priority: Number(priority) || 0,
        branch_id: id ? (promotionBranchId ?? null) : (branch?.id ?? null),
        config,
        conditions: [],
      };
      if (id) await promotionsAPI.update(id, payload);
      else await promotionsAPI.create(payload);
      toast.success(id ? 'تم تحديث العرض' : 'تم إنشاء العرض');
      void hapticSuccess();
      navigation.goBack();
    } catch (err) {
      const msg = normalizeApiError(err).message;
      setError(msg);
      toast.error(msg);
      void hapticError();
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormScreenLayout
      title={id ? 'تعديل عرض' : 'عرض جديد'}
      onBack={navigation.goBack}
      onSave={canManage ? () => void save() : undefined}
      saveLoading={busy}
    >
      <FormSection title="تفاصيل العرض" icon="campaign">
        {error ? <AppInput label="خطأ" value={error} editable={false} /> : null}
        <Text style={{ color: c.textMuted, fontSize: 12 }}>
          العرض يُعاد احتسابه داخل POS والخادم. النطاق يحدد العناصر التي تحصل على الخصم، وليس مجرد شرط لتشغيله.
        </Text>
        {scopeNeedsWebReview ? <AppInput label="مراجعة مطلوبة" value="راجع نطاق العرض من لوحة الويب قبل الحفظ" editable={false} /> : null}
        <AppInput label="الاسم" value={name} onChangeText={setName} editable={canManage} />
        <AppSelect
          label="النوع"
          value={type}
          options={[
            { label: 'نسبة', value: 'percentage_discount' },
            { label: 'مبلغ ثابت', value: 'fixed_discount' },
            { label: 'BOGO', value: 'bogo' },
          ]}
          onChange={setType}
        />
        <AppInput label="قيمة المكافأة" value={rewardValue} onChangeText={setRewardValue} keyboardType="decimal-pad" editable={canManage} />
        {type === 'bogo' ? (
          <>
            <AppInput label="كمية الشراء" value={buyQty} onChangeText={setBuyQty} keyboardType="number-pad" editable={canManage} />
            <AppInput label="كمية المكافأة" value={getQty} onChangeText={setGetQty} keyboardType="number-pad" editable={canManage} />
          </>
        ) : null}
        <AppDatePicker label="تاريخ البداية" value={startDate} onChange={setStartDate} />
        <AppDatePicker label="تاريخ النهاية" value={endDate} onChange={setEndDate} />
        <AppInput label="نطاق الخصم" value={scopeConfig.scope_type === 'products' ? 'منتجات محددة' : scopeConfig.scope_type === 'categories' ? 'تصنيفات محددة' : 'الطلب بالكامل'} editable={false} />
        <AppInput label="حد أدنى لقيمة الطلب (اختياري)" value={minCart} onChangeText={setMinCart} keyboardType="decimal-pad" editable={canManage} />
        <AppInput label="أقل كمية مؤهلة (اختياري)" value={minQuantity} onChangeText={setMinQuantity} keyboardType="number-pad" editable={canManage} />
        <AppSelect label="داخل المطعم" value={dineIn} options={[{ label: 'متاح', value: '1' }, { label: 'غير متاح', value: '0' }]} onChange={setDineIn} />
        <AppSelect label="استلام من الفرع" value={takeaway} options={[{ label: 'متاح', value: '1' }, { label: 'غير متاح', value: '0' }]} onChange={setTakeaway} />
        <AppSelect label="توصيل" value={delivery} options={[{ label: 'متاح', value: '1' }, { label: 'غير متاح', value: '0' }]} onChange={setDelivery} />
        <AppSelect label="تجميعه مع عروض أخرى" value={stackable} options={[{ label: 'لا (موصى به)', value: '0' }, { label: 'نعم', value: '1' }]} onChange={setStackable} />
        <AppInput label="الأولوية" value={priority} onChangeText={setPriority} keyboardType="number-pad" editable={canManage} />
        <AppSelect label="نشط" value={isActive} options={[{ label: 'نعم', value: '1' }, { label: 'لا', value: '0' }]} onChange={setIsActive} />
      </FormSection>
      <FormSection title="تقارير" icon="assessment">
        <AppButton title="تقرير العروض" variant="secondary" onPress={() => navigation.navigate('ReportViewer', { reportId: 'marketing-promotions' })} />
      </FormSection>
    </FormScreenLayout>
  );
}
