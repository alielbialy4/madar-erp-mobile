import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { productsAPI } from '@/api/products';
import { categoriesAPI } from '@/api/categories';
import { warehousesAPI } from '@/api/inventory';
import { AppScreen } from '@/components/layout';
import { ImagePickerField } from '@/components/forms/ImagePickerField';
import { FormError } from '@/components/forms';
import { BarcodesEditor } from '@/components/products/BarcodesEditor';
import { UnitsEditor } from '@/components/products/UnitsEditor';
import { OpeningStockEditor } from '@/components/products/OpeningStockEditor';
import { ProductOptionGroupsEditor } from '@/components/products/ProductOptionGroupsEditor';
import { ProductFormSection, SwitchRow } from '@/components/products/ProductFormSection';
import { createDashboardStyles } from '@/components/dashboard/dashboardStyles';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { AppText as UiText } from '@/components/ui/AppText';
import { extractArray, extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission } from '@/utils/permissions';
import { useAuthStore } from '@/store/authStore';
import type {
  Category,
  OpeningStockInput,
  PickedImage,
  Product,
  ProductOptionGroupInput,
  ProductPayload,
  ProductUnitInput,
} from '@/types/api';
import type { ProductsStackParamList } from '@/types/navigation';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { parseApiMoneyFirst } from '@/utils/parseMoney';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductForm'>;
type Route = RouteProp<ProductsStackParamList, 'ProductForm'>;

const defaultUnits = (): ProductUnitInput[] => [{ name: 'قطعة', factor_to_base: 1, is_base: true }];

export function ProductFormScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_products');
  const id = route.params?.id;
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [barcodes, setBarcodes] = useState<string[]>(['']);
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('0');
  const [trackInventory, setTrackInventory] = useState(true);
  const [trackExpiry, setTrackExpiry] = useState(false);
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [isPromotional, setIsPromotional] = useState(false);
  const [promotionalPrice, setPromotionalPrice] = useState('');
  const [promoStart, setPromoStart] = useState('');
  const [promoEnd, setPromoEnd] = useState('');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [remoteImage, setRemoteImage] = useState<string | null>(null);
  const [units, setUnits] = useState<ProductUnitInput[]>(defaultUnits());
  const [openingStock, setOpeningStock] = useState<OpeningStockInput[]>([]);
  const [optionGroups, setOptionGroups] = useState<ProductOptionGroupInput[]>([]);

  useEffect(() => {
    categoriesAPI.getAll({ per_page: 200 }).then((res) => setCategories(extractArray<Category>(res))).catch(() => {});
    if (!isEdit) {
      warehousesAPI.list({ active_only: true }).then((res) => {
        setWarehouses(
          extractArray<{ id: string; name: string }>(res).map((w) => ({ id: String(w.id), name: String(w.name) })),
        );
      }).catch(() => {});
    }
  }, [isEdit]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productsAPI
      .getById(id)
      .then((res) => {
        const p = extractData<Product>(res);
        if (!p) return;
        setName(p.name);
        setDescription(p.description ?? '');
        setCategoryId(p.category_id ? String(p.category_id) : null);
        const bc = (p.barcodes ?? []).filter(Boolean) as string[];
        setBarcodes(bc.length > 0 ? bc : p.barcode ? [p.barcode] : ['']);
        setCostPrice(String(parseApiMoneyFirst(p.cost_price) ?? 0));
        setSellingPrice(String(parseApiMoneyFirst(p.selling_price) ?? 0));
        setMinStockAlert(String(p.min_stock_alert ?? 0));
        setTrackInventory(p.track_inventory !== false);
        setTrackExpiry(Boolean(p.track_expiry));
        setActive(p.active !== false && p.is_active !== false);
        setFeatured(Boolean(p.featured));
        setIsPromotional(Boolean(p.is_promotional));
        setPromotionalPrice(String(parseApiMoneyFirst(p.promotional_price) ?? ''));
        setPromoStart(p.promotional_start_date ?? '');
        setPromoEnd(p.promotional_end_date ?? '');
        setRemoteImage(p.image ?? null);
        setUnits(
          (p.units ?? []).length > 0
            ? p.units!.map((u) => ({
                id: u.id,
                name: u.name,
                factor_to_base: Number(u.factor_to_base ?? 1),
                is_base: Boolean(u.is_base),
                barcode: u.barcode ?? undefined,
              }))
            : defaultUnits(),
        );
        setOptionGroups(
          (p.option_groups ?? []).map((g) => ({
            id: g.id,
            title: g.title ?? g.name ?? '',
            selection_type: g.selection_type,
            pricing_type: g.pricing_type,
            group_price: g.group_price != null ? Number(g.group_price) : null,
            is_required: Boolean(g.is_required),
            is_active: g.is_active !== false,
            options: (g.options ?? []).map((o) => ({
              id: o.id,
              name: o.name,
              price: Number(o.price ?? 0),
              is_active: o.is_active !== false,
            })),
          })),
        );
      })
      .catch((err) => setFormError(normalizeApiError(err).message))
      .finally(() => setLoading(false));
  }, [id]);

  const buildPayload = (): ProductPayload => {
    const cleanBarcodes = barcodes.map((b) => b.trim()).filter(Boolean);
    const cleanUnits = units.filter((u) => u.name.trim());
    const baseUnits = cleanUnits.length > 0 ? cleanUnits : defaultUnits();
    return {
      name: name.trim(),
      description: description.trim() || undefined,
      category_id: categoryId ? Number(categoryId) : undefined,
      barcodes: cleanBarcodes,
      barcode: cleanBarcodes[0],
      cost_price: Number(costPrice) || 0,
      selling_price: Number(sellingPrice) || 0,
      min_stock_alert: Number(minStockAlert) || 0,
      track_inventory: trackInventory,
      track_expiry: trackExpiry,
      active,
      featured,
      is_promotional: isPromotional,
      promotional_price: isPromotional ? Number(promotionalPrice) || 0 : undefined,
      promotional_start_date: isPromotional && promoStart ? promoStart : undefined,
      promotional_end_date: isPromotional && promoEnd ? promoEnd : undefined,
      image,
      units: baseUnits,
      opening_stock: !isEdit && trackInventory ? openingStock.filter((r) => r.warehouse_id) : undefined,
      option_groups: optionGroups.filter((g) => g.title.trim()),
    };
  };

  const validate = (): string | null => {
    if (name.trim().length < 2) return 'اسم المنتج مطلوب';
    if (!categoryId) return 'اختر التصنيف';
    if (Number(sellingPrice) <= 0) return 'سعر البيع مطلوب';
    if (isPromotional && Number(promotionalPrice) <= 0) return 'سعر الترويج مطلوب';
    const bases = units.filter((u) => u.is_base);
    if (bases.length !== 1) return 'حدد وحدة أساسية واحدة';
    return null;
  };

  const save = async () => {
    if (!canManage) return;
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = buildPayload();
      if (isEdit && id) await productsAPI.update(id, payload);
      else await productsAPI.create(payload);
      navigation.goBack();
    } catch (e) {
      setFormError(normalizeApiError(e).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <AppScreen title="المنتج" onBack={navigation.goBack}>
        <UiText style={{ color: c.textMuted, textAlign: 'center' }}>ليس لديك صلاحية إدارة المنتجات</UiText>
      </AppScreen>
    );
  }

  const formHero = (
    <View style={ds.heroOuter}>
      <View style={ds.heroAccent} />
      <View style={ds.heroBody}>
        <Text style={ds.heroEyebrow}>{isEdit ? 'تعديل' : 'إنشاء'}</Text>
        <Text style={ds.heroTitle}>{isEdit ? 'تعديل منتج' : 'منتج جديد'}</Text>
        <Text style={ds.heroSubtitle}>البيانات الأساسية والأسعار والمخزون والخيارات في أقسام منظمة.</Text>
      </View>
    </View>
  );

  return (
    <AppScreen title={isEdit ? 'تعديل منتج' : 'إضافة منتج'} onBack={navigation.goBack} scroll contentStyle={{ padding: 0 }}>
      {loading ? (
        <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
          <ActivityIndicator color={c.accent} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>{formHero}</View>

          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg, marginTop: spacing.md }}>
            <ProductFormSection title="البيانات الأساسية" subtitle="الصورة والاسم والتصنيف" icon="inventory-2">
              <ImagePickerField label="صورة المنتج" value={image} remoteUrl={remoteImage} onChange={setImage} />
              <AppInput label="الاسم" value={name} onChangeText={setName} />
              <AppSelect
                label="التصنيف"
                value={categoryId}
                options={categories.map((cat) => ({ label: cat.name, value: String(cat.id) }))}
                onChange={setCategoryId}
              />
              <BarcodesEditor value={barcodes} onChange={setBarcodes} />
              <SwitchRow label="نشط في نقطة البيع" value={active} onValueChange={setActive} />
              <SwitchRow label="منتج مميز" value={featured} onValueChange={setFeatured} />
            </ProductFormSection>

            <ProductFormSection title="الأسعار" subtitle="التكلفة والبيع والعروض" icon="sell">
              <AppInput label="سعر التكلفة" value={costPrice} onChangeText={setCostPrice} keyboardType="decimal-pad" />
              <AppInput label="سعر البيع" value={sellingPrice} onChangeText={setSellingPrice} keyboardType="decimal-pad" />
              <SwitchRow label="عرض ترويجي" value={isPromotional} onValueChange={setIsPromotional} />
              {isPromotional ? (
                <>
                  <AppInput
                    label="سعر الترويج"
                    value={promotionalPrice}
                    onChangeText={setPromotionalPrice}
                    keyboardType="decimal-pad"
                  />
                  <AppInput label="بداية العرض" value={promoStart} onChangeText={setPromoStart} placeholder="YYYY-MM-DD" />
                  <AppInput label="نهاية العرض" value={promoEnd} onChangeText={setPromoEnd} placeholder="YYYY-MM-DD" />
                </>
              ) : null}
            </ProductFormSection>

            <ProductFormSection title="المخزون والوحدات" subtitle="التتبع والتنبيهات" icon="inventory">
              <SwitchRow
                label="تتبع المخزون"
                hint="أوقفه للخدمات غير المخزنة"
                value={trackInventory}
                onValueChange={setTrackInventory}
              />
              <SwitchRow label="تتبع الصلاحية" value={trackExpiry} onValueChange={setTrackExpiry} />
              {trackInventory ? (
                <AppInput
                  label="حد تنبيه المخزون"
                  value={minStockAlert}
                  onChangeText={setMinStockAlert}
                  keyboardType="number-pad"
                />
              ) : null}
              <UnitsEditor value={units} onChange={setUnits} />
              {!isEdit && trackInventory && warehouses.length > 0 ? (
                <OpeningStockEditor value={openingStock} onChange={setOpeningStock} warehouses={warehouses} units={units} />
              ) : null}
            </ProductFormSection>

            <ProductFormSection title="بيانات إضافية" subtitle="الوصف والموديفايرز" icon="tune">
              <AppInput label="الوصف" value={description} onChangeText={setDescription} multiline />
              <ProductOptionGroupsEditor value={optionGroups} onChange={setOptionGroups} />
            </ProductFormSection>

            <FormError message={formError} />
            <AppButton title={isEdit ? 'حفظ التعديلات' : 'إنشاء المنتج'} onPress={() => void save()} loading={submitting} />
          </View>
        </ScrollView>
      )}
    </AppScreen>
  );
}
