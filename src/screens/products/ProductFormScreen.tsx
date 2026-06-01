import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
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
import { AppText as UiText, Text } from '@/components/ui/AppText';
import { extractArray, extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission } from '@/utils/permissions';
import { useAuthStore } from '@/store/authStore';
import type {
  Category,
  OpeningStockInput,
  PickedImage,
  Product,
  InventoryMode,
  ProductRole,
  ProductOptionGroupInput,
  ProductPayload,
  ProductRecipeInput,
  ProductUnitInput,
} from '@/types/api';
import type { ProductsStackParamList } from '@/types/navigation';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { parseApiMoneyFirst } from '@/utils/parseMoney';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductForm'>;
type Route = RouteProp<ProductsStackParamList, 'ProductForm'>;

const defaultUnits = (): ProductUnitInput[] => [{ name: 'قطعة', factor_to_base: 1, is_base: true }];
const rawMaterialUnits = (): ProductUnitInput[] => [{ name: 'kg', factor_to_base: 1, is_base: true }];

const inventoryModeOptions: Array<{ label: string; value: InventoryMode }> = [
  { label: 'مخزني', value: 'stock_product' },
  { label: 'بوصفة', value: 'recipe_product' },
  { label: 'غير مخزني', value: 'non_stock' },
];

const rawMaterialRoleOptions: Array<{ label: string; value: ProductRole }> = [
  { label: 'خامة', value: 'raw_material' },
  { label: 'مواد تغليف', value: 'packaging_material' },
  { label: 'نصف مصنع', value: 'semi_finished' },
];

function inventoryModeOf(product: Product): InventoryMode {
  return product.inventory_mode ?? (product.track_inventory === false ? 'non_stock' : 'stock_product');
}

function parseLocalDate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addMonthsToDateString(dateValue: string, monthsValue: string): string {
  const date = parseLocalDate(dateValue);
  const months = Number(monthsValue);
  if (!date || !Number.isFinite(months) || months <= 0) return '';
  const day = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() !== day) date.setDate(0);
  return formatLocalDate(date);
}

function daysUntilDate(dateValue: string): number | null {
  const date = parseLocalDate(dateValue);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
}

function expiryDaysText(days: number | null): string {
  if (days === null) return '';
  if (days < 0) return `منتهي منذ ${Math.abs(days)} يوم`;
  if (days === 0) return 'ينتهي اليوم';
  return `باقي ${days} يوم`;
}

export function ProductFormScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_products');
  const id = route.params?.id;
  const isEdit = Boolean(id);
  const [rawMaterialMode, setRawMaterialMode] = useState(route.params?.mode === 'raw_material');

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
  const [inventoryMode, setInventoryModeState] = useState<InventoryMode>('stock_product');
  const [productRole, setProductRole] = useState<ProductRole>(route.params?.mode === 'raw_material' ? 'raw_material' : 'sellable_product');
  const [trackInventory, setTrackInventory] = useState(true);
  const [trackExpiry, setTrackExpiry] = useState(false);
  const [productionDate, setProductionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [shelfLifeMonths, setShelfLifeMonths] = useState('');
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [isPromotional, setIsPromotional] = useState(false);
  const [promotionalPrice, setPromotionalPrice] = useState('');
  const [promoStart, setPromoStart] = useState('');
  const [promoEnd, setPromoEnd] = useState('');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [remoteImage, setRemoteImage] = useState<string | null>(null);
  const [units, setUnits] = useState<ProductUnitInput[]>(() => (route.params?.mode === 'raw_material' ? rawMaterialUnits() : defaultUnits()));
  const [openingStock, setOpeningStock] = useState<OpeningStockInput[]>([]);
  const [optionGroups, setOptionGroups] = useState<ProductOptionGroupInput[]>([]);
  const [recipes, setRecipes] = useState<ProductRecipeInput[]>([]);
  const [ingredientProducts, setIngredientProducts] = useState<Product[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [productVariants, setProductVariants] = useState<Product['variants']>([]);

  const setInventoryMode = (mode: InventoryMode) => {
    if (rawMaterialMode) {
      setInventoryModeState('stock_product');
      setTrackInventory(true);
      return;
    }
    setInventoryModeState(mode);
    const tracks = mode === 'stock_product';
    setTrackInventory(tracks);
    if (!tracks) {
      setTrackExpiry(false);
      setOpeningStock([]);
    }
  };

  const expiryDays = useMemo(() => daysUntilDate(expiryDate), [expiryDate]);

  const updateProductionDate = (value: string) => {
    setProductionDate(value);
    if (value && shelfLifeMonths) {
      const calculated = addMonthsToDateString(value, shelfLifeMonths);
      if (calculated) setExpiryDate(calculated);
    }
  };

  const updateShelfLifeMonths = (value: string) => {
    setShelfLifeMonths(value);
    if (productionDate && value) {
      const calculated = addMonthsToDateString(productionDate, value);
      if (calculated) setExpiryDate(calculated);
    }
  };

  useEffect(() => {
    if (!rawMaterialMode) return;
    setInventoryModeState('stock_product');
    setTrackInventory(true);
    setSellingPrice('0');
    setFeatured(false);
    setIsPromotional(false);
  }, [rawMaterialMode]);

  useEffect(() => {
    categoriesAPI.getAll({ per_page: 200 }).then((res) => setCategories(extractArray<Category>(res))).catch(() => {});
    warehousesAPI.list({ active_only: true }).then((res) => {
      setWarehouses(
        extractArray<{ id: string; name: string }>(res).map((w) => ({ id: String(w.id), name: String(w.name) })),
      );
    }).catch(() => {});
    productsAPI.getAll({ per_page: 200, context: 'recipe' }).then((res) => {
      const list = extractArray<Product>(res)
        .filter((p) => inventoryModeOf(p) === 'stock_product')
        .filter((p) => !id || Number(p.id) !== Number(id));
      setIngredientProducts(list);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productsAPI
      .getById(id)
      .then((res) => {
        const p = extractData<Product>(res);
        if (!p) return;
        const loadedRole = (p.product_role ?? 'sellable_product') as ProductRole;
        const loadedIsRaw = ['raw_material', 'packaging_material', 'semi_finished'].includes(loadedRole);
        setRawMaterialMode((prev) => prev || loadedIsRaw);
        setProductRole(loadedIsRaw ? loadedRole : loadedRole === 'service' ? 'sellable_product' : loadedRole);
        setName(p.name);
        setDescription(p.description ?? '');
        setCategoryId(loadedIsRaw ? null : p.category_id ? String(p.category_id) : null);
        const specs = p.specs && typeof p.specs === 'object' ? p.specs : {};
        setProductionDate(specs.production_date ? String(specs.production_date) : '');
        setExpiryDate(specs.expiry_date ? String(specs.expiry_date) : '');
        setShelfLifeMonths(
          specs.shelf_life_months
            ? String(specs.shelf_life_months)
            : p.default_shelf_life_days != null && Number(p.default_shelf_life_days) > 0
              ? String(Math.round(Number(p.default_shelf_life_days) / 30))
              : '',
        );
        const bc = (p.barcodes ?? []).filter(Boolean) as string[];
        setBarcodes(bc.length > 0 ? bc : p.barcode ? [p.barcode] : ['']);
        setCostPrice(String(parseApiMoneyFirst(p.cost_price) ?? 0));
        setSellingPrice(String(parseApiMoneyFirst(p.selling_price) ?? 0));
        setMinStockAlert(String(p.min_stock_alert ?? 0));
        const mode = inventoryModeOf(p);
        setInventoryModeState(mode);
        setTrackInventory(mode === 'stock_product');
        setTrackExpiry(mode === 'stock_product' && Boolean(p.track_expiry));
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
        setProductVariants(p.variants ?? []);
        setRecipes(
          (p.recipes ?? []).map((row) => ({
            id: row.id,
            variant_id: row.variant_id ?? null,
            modifier_option_id: row.modifier_option_id ?? null,
            ingredient_product_id: Number(row.ingredient_product_id ?? 0),
            ingredient_product: row.ingredient_product ?? undefined,
            quantity: Number(row.quantity ?? 0),
            unit_id: Number(row.unit_id ?? 0),
            unit: row.unit ?? undefined,
            waste_percentage: Number(row.waste_percentage ?? 0),
            warehouse_id: row.warehouse_id ?? null,
            is_active: row.is_active !== false,
          })),
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

  const filteredIngredientOptions = useMemo(() => {
    const q = ingredientSearch.trim().toLowerCase();
    return ingredientProducts
      .filter((p) => !q || p.name.toLowerCase().includes(q) || String(p.barcode ?? '').includes(q))
      .slice(0, 40)
      .map((p) => ({ label: p.name, value: String(p.id) }));
  }, [ingredientProducts, ingredientSearch]);

  const variantOptions = useMemo(
    () => [
      { label: 'الأساسي', value: '' },
      ...(productVariants ?? []).map((variant) => ({
        label: variant?.name || variant?.sku || `متغير #${variant?.id}`,
        value: String(variant?.id ?? ''),
      })),
    ].filter((option, index) => index === 0 || option.value),
    [productVariants],
  );

  const modifierOptions = useMemo(
    () => [
      { label: 'بدون إضافة', value: '' },
      ...optionGroups.flatMap((group) =>
        (group.options ?? [])
          .filter((option) => option.id != null)
          .map((option) => ({
            label: `${group.title || 'مجموعة'} / ${option.name || 'خيار'}`,
            value: String(option.id),
          })),
      ),
    ],
    [optionGroups],
  );

  const updateRecipeRow = (idx: number, patch: Partial<ProductRecipeInput>) => {
    setRecipes((prev) => prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, ...patch } : row)));
  };

  const addRecipeRow = () => {
    setRecipes((prev) => [
      ...prev,
      {
        ingredient_product_id: 0,
        quantity: 1,
        unit_id: 0,
        waste_percentage: 0,
        warehouse_id: null,
        variant_id: null,
        modifier_option_id: null,
        is_active: true,
      },
    ]);
  };

  const selectRecipeIngredient = (idx: number, rawValue: string) => {
    const ingredient = ingredientProducts.find((p) => String(p.id) === String(rawValue));
    const unit = ingredient?.units?.find((u) => u.is_base) ?? ingredient?.units?.[0] ?? null;
    updateRecipeRow(idx, {
      ingredient_product_id: Number(rawValue) || 0,
      ingredient_product: ingredient
        ? {
            id: ingredient.id,
            name: ingredient.name,
            avg_cost: ingredient.cost_price,
            cost_price: ingredient.cost_price,
            units: ingredient.units,
          }
        : undefined,
      unit_id: unit?.id ?? 0,
      unit,
    });
  };

  const normalizeRecipesForSave = (): { rows: ProductRecipeInput[]; error: string | null } => {
    if (rawMaterialMode || inventoryMode !== 'recipe_product') return { rows: [], error: null };
    const rows: ProductRecipeInput[] = [];
    const seen = new Set<string>();
    for (const row of recipes) {
      const touched = Boolean(row.ingredient_product_id || row.unit_id || row.variant_id || row.modifier_option_id || row.warehouse_id);
      if (!touched) continue;
      if (!row.ingredient_product_id || !row.unit_id || Number(row.quantity) <= 0) {
        return { rows: [], error: 'أكمل بيانات مكونات الوصفة أو احذف الصف الفارغ' };
      }
      const key = [
        row.ingredient_product_id,
        row.variant_id || '',
        row.modifier_option_id ?? '',
        row.warehouse_id || '',
      ].join('|');
      if (seen.has(key)) return { rows: [], error: 'لا يمكن تكرار نفس المكون داخل نفس نطاق الوصفة' };
      seen.add(key);
      rows.push({
        id: row.id,
        ingredient_product_id: Number(row.ingredient_product_id),
        quantity: Number(row.quantity),
        unit_id: Number(row.unit_id),
        waste_percentage: Number(row.waste_percentage ?? 0),
        variant_id: row.variant_id || null,
        modifier_option_id: row.modifier_option_id != null ? Number(row.modifier_option_id) : null,
        warehouse_id: row.warehouse_id || null,
        is_active: row.is_active !== false,
      });
    }
    if (active && !rows.some((row) => row.is_active !== false && row.modifier_option_id == null)) {
      return { rows: [], error: 'يجب إضافة مكون أساسي واحد على الأقل للمنتج بوصفة' };
    }
    return { rows, error: null };
  };

  const buildPayload = (normalizedRecipes: ProductRecipeInput[]): ProductPayload => {
    const cleanBarcodes = barcodes.map((b) => b.trim()).filter(Boolean);
    const cleanUnits = units.filter((u) => u.name.trim());
    const baseUnits = cleanUnits.length > 0 ? cleanUnits : rawMaterialMode ? rawMaterialUnits() : defaultUnits();
    const effectiveInventoryMode: InventoryMode = rawMaterialMode ? 'stock_product' : inventoryMode;
    const isStockMode = effectiveInventoryMode === 'stock_product';
    const shelfMonthsNumber = Number(shelfLifeMonths) || 0;
    const rawSpecs = rawMaterialMode
      ? {
          ...(productionDate ? { production_date: productionDate } : {}),
          ...(expiryDate ? { expiry_date: expiryDate } : {}),
          ...(shelfMonthsNumber > 0 ? { shelf_life_months: shelfMonthsNumber } : {}),
        }
      : undefined;
    return {
      name: name.trim(),
      description: description.trim() || undefined,
      category_id: rawMaterialMode ? null : categoryId ? Number(categoryId) : undefined,
      barcodes: cleanBarcodes,
      barcode: cleanBarcodes[0],
      cost_price: Number(costPrice) || 0,
      selling_price: rawMaterialMode ? 0 : Number(sellingPrice) || 0,
      min_stock_alert: isStockMode ? Number(minStockAlert) || 0 : 0,
      inventory_mode: effectiveInventoryMode,
      product_role: rawMaterialMode ? productRole : effectiveInventoryMode === 'non_stock' ? 'service' : 'sellable_product',
      is_sellable: rawMaterialMode ? false : undefined,
      is_purchasable: rawMaterialMode ? true : effectiveInventoryMode === 'recipe_product' ? false : undefined,
      is_recipe_ingredient: rawMaterialMode ? true : undefined,
      track_inventory: isStockMode,
      track_expiry: isStockMode && trackExpiry,
      preferred_supplier_id: rawMaterialMode ? null : undefined,
      default_warehouse_id: rawMaterialMode ? null : undefined,
      default_shelf_life_days: rawMaterialMode && shelfMonthsNumber > 0 ? Math.round(shelfMonthsNumber * 30) : undefined,
      specs: rawSpecs,
      active,
      featured: rawMaterialMode ? false : featured,
      is_promotional: rawMaterialMode ? false : isPromotional,
      promotional_price: !rawMaterialMode && isPromotional ? Number(promotionalPrice) || 0 : undefined,
      promotional_start_date: !rawMaterialMode && isPromotional && promoStart ? promoStart : undefined,
      promotional_end_date: !rawMaterialMode && isPromotional && promoEnd ? promoEnd : undefined,
      image,
      units: baseUnits,
      opening_stock: !isEdit && isStockMode ? openingStock.filter((r) => r.warehouse_id) : undefined,
      option_groups: rawMaterialMode ? [] : optionGroups.filter((g) => g.title.trim()),
      recipes: !rawMaterialMode && effectiveInventoryMode === 'recipe_product' ? normalizedRecipes : undefined,
    };
  };

  const validate = (): string | null => {
    if (name.trim().length < 2) return rawMaterialMode ? 'اسم الخامة مطلوب' : 'اسم المنتج مطلوب';
    if (!rawMaterialMode && !categoryId) return 'اختر التصنيف';
    if (!rawMaterialMode && Number(sellingPrice) <= 0) return 'سعر البيع مطلوب';
    if (!rawMaterialMode && isPromotional && Number(promotionalPrice) <= 0) return 'سعر الترويج مطلوب';
    const bases = units.filter((u) => u.is_base);
    if (bases.length !== 1) return 'حدد وحدة أساسية واحدة';
    const recipeValidation = normalizeRecipesForSave();
    if (recipeValidation.error) return recipeValidation.error;
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
      const recipeResult = normalizeRecipesForSave();
      if (recipeResult.error) {
        setFormError(recipeResult.error);
        return;
      }
      const payload = buildPayload(recipeResult.rows);
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
        <Text style={ds.heroTitle}>
          {rawMaterialMode ? (isEdit ? 'تعديل خامة' : 'خامة جديدة') : isEdit ? 'تعديل منتج' : 'منتج جديد'}
        </Text>
        <Text style={ds.heroSubtitle}>
          {rawMaterialMode ? 'بيانات الشراء والوحدات والتتبع المخزني للخامة.' : 'البيانات الأساسية والأسعار والمخزون والخيارات في أقسام منظمة.'}
        </Text>
      </View>
    </View>
  );

  return (
    <AppScreen title={rawMaterialMode ? (isEdit ? 'تعديل خامة' : 'إضافة خامة') : isEdit ? 'تعديل منتج' : 'إضافة منتج'} onBack={navigation.goBack} scroll contentStyle={{ padding: 0 }}>
      {loading ? (
        <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
          <ActivityIndicator color={c.accent} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>{formHero}</View>

          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg, marginTop: spacing.md }}>
            <ProductFormSection title="البيانات الأساسية" subtitle={rawMaterialMode ? 'الاسم والكود' : 'الصورة والاسم والتصنيف'} icon="inventory-2">
              <ImagePickerField label={rawMaterialMode ? 'صورة الخامة' : 'صورة المنتج'} value={image} remoteUrl={remoteImage} onChange={setImage} />
              <AppInput label={rawMaterialMode ? 'اسم الخامة' : 'الاسم'} value={name} onChangeText={setName} />
              {!rawMaterialMode ? (
                <AppSelect
                  label="التصنيف"
                  value={categoryId}
                  options={categories.map((cat) => ({ label: cat.name, value: String(cat.id) }))}
                  onChange={setCategoryId}
                />
              ) : null}
              <BarcodesEditor value={barcodes} onChange={setBarcodes} />
              <SwitchRow label={rawMaterialMode ? 'نشط للاستخدام' : 'نشط في نقطة البيع'} value={active} onValueChange={setActive} />
              {!rawMaterialMode ? <SwitchRow label="منتج مميز" value={featured} onValueChange={setFeatured} /> : null}
            </ProductFormSection>

            <ProductFormSection title={rawMaterialMode ? 'التكلفة' : 'الأسعار'} subtitle={rawMaterialMode ? 'تكلفة الشراء والمتوسط الافتتاحي' : 'التكلفة والبيع والعروض'} icon="sell">
              <AppInput label="سعر التكلفة" value={costPrice} onChangeText={setCostPrice} keyboardType="decimal-pad" />
              {!rawMaterialMode ? <AppInput label="سعر البيع" value={sellingPrice} onChangeText={setSellingPrice} keyboardType="decimal-pad" /> : null}
              {!rawMaterialMode ? <SwitchRow label="عرض ترويجي" value={isPromotional} onValueChange={setIsPromotional} /> : null}
              {!rawMaterialMode && isPromotional ? (
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
              {rawMaterialMode ? (
                <AppSelect
                  label="نوع الخامة"
                  value={productRole}
                  options={rawMaterialRoleOptions}
                  onChange={(value) => setProductRole(value as ProductRole)}
                />
              ) : (
                <AppSelect
                  label="نوع المخزون"
                  value={inventoryMode}
                  options={inventoryModeOptions}
                  onChange={(value) => setInventoryMode(value as InventoryMode)}
                />
              )}
              <SwitchRow
                label="تتبع الصلاحية"
                value={inventoryMode === 'stock_product' && trackExpiry}
                onValueChange={(value) => inventoryMode === 'stock_product' && setTrackExpiry(value)}
              />
              {trackInventory ? (
                <AppInput
                  label="حد تنبيه المخزون"
                  value={minStockAlert}
                  onChangeText={setMinStockAlert}
                  keyboardType="number-pad"
                />
              ) : null}
              {rawMaterialMode ? (
                <>
                  <AppInput label="تاريخ الإنتاج" value={productionDate} onChangeText={updateProductionDate} placeholder="YYYY-MM-DD" />
                  <AppInput
                    label="مدة الصلاحية بالشهور"
                    value={shelfLifeMonths}
                    onChangeText={updateShelfLifeMonths}
                    keyboardType="number-pad"
                  />
                  <AppInput label="تاريخ الانتهاء" value={expiryDate} onChangeText={setExpiryDate} placeholder="YYYY-MM-DD" />
                  {expiryDate ? <UiText style={{ color: c.textMuted }}>{expiryDaysText(expiryDays)}</UiText> : null}
                </>
              ) : null}
              <UnitsEditor value={units} onChange={setUnits} />
              {!isEdit && trackInventory && warehouses.length > 0 ? (
                <OpeningStockEditor value={openingStock} onChange={setOpeningStock} warehouses={warehouses} units={units} />
              ) : null}
            </ProductFormSection>

            {!rawMaterialMode && inventoryMode === 'recipe_product' ? (
              <ProductFormSection title="الوصفة" subtitle="مكونات الخصم عند البيع" icon="restaurant">
                <AppInput
                  label="بحث المكونات"
                  value={ingredientSearch}
                  onChangeText={setIngredientSearch}
                  placeholder="اسم أو باركود"
                />
                {recipes.map((row, idx) => {
                  const unitOptions = [
                    ...(row.ingredient_product?.units ?? []),
                    ...(row.unit && !(row.ingredient_product?.units ?? []).some((unit) => Number(unit.id) === Number(row.unit_id))
                      ? [row.unit]
                      : []),
                  ].map((unit) => ({ label: unit.is_base ? `${unit.name} (أساسية)` : unit.name, value: String(unit.id) }));
                  return (
                    <View
                      key={row.id ?? `${row.ingredient_product_id || 'new'}-${idx}`}
                      style={{ gap: spacing.sm, borderWidth: 1, borderColor: c.borderSubtle, borderRadius: 14, padding: spacing.md }}
                    >
                      <UiText style={{ color: c.textMuted }}>مكون #{idx + 1}</UiText>
                      <AppSelect
                        label="المكون"
                        value={row.ingredient_product_id ? String(row.ingredient_product_id) : null}
                        options={filteredIngredientOptions}
                        onChange={(value) => selectRecipeIngredient(idx, value)}
                      />
                      <AppInput
                        label="الكمية"
                        value={String(row.quantity || '')}
                        onChangeText={(value) => updateRecipeRow(idx, { quantity: Number(value) || 0 })}
                        keyboardType="decimal-pad"
                      />
                      <AppSelect
                        label="الوحدة"
                        value={row.unit_id ? String(row.unit_id) : null}
                        options={unitOptions}
                        onChange={(value) => {
                          const unit = row.ingredient_product?.units?.find((u) => String(u.id) === String(value)) ?? row.unit ?? null;
                          updateRecipeRow(idx, { unit_id: Number(value) || 0, unit });
                        }}
                      />
                      <AppInput
                        label="هالك %"
                        value={String(row.waste_percentage ?? 0)}
                        onChangeText={(value) => updateRecipeRow(idx, { waste_percentage: Number(value) || 0 })}
                        keyboardType="decimal-pad"
                      />
                      {variantOptions.length > 1 ? (
                        <AppSelect
                          label="المتغير"
                          value={row.variant_id ?? ''}
                          options={variantOptions}
                          onChange={(value) => updateRecipeRow(idx, { variant_id: value || null })}
                        />
                      ) : null}
                      {modifierOptions.length > 1 ? (
                        <AppSelect
                          label="الإضافة"
                          value={row.modifier_option_id != null ? String(row.modifier_option_id) : ''}
                          options={modifierOptions}
                          onChange={(value) => updateRecipeRow(idx, { modifier_option_id: value ? Number(value) : null })}
                        />
                      ) : null}
                      {warehouses.length > 0 ? (
                        <AppSelect
                          label="المخزن"
                          value={row.warehouse_id ?? ''}
                          options={[{ label: 'مخزن البيع', value: '' }, ...warehouses.map((w) => ({ label: w.name, value: w.id }))]}
                          onChange={(value) => updateRecipeRow(idx, { warehouse_id: value || null })}
                        />
                      ) : null}
                      <AppButton
                        title="حذف المكون"
                        variant="outline"
                        onPress={() => setRecipes((prev) => prev.filter((_, rowIdx) => rowIdx !== idx))}
                      />
                    </View>
                  );
                })}
                <AppButton title="إضافة مكون" variant="secondary" onPress={addRecipeRow} />
              </ProductFormSection>
            ) : null}

            <ProductFormSection title="بيانات إضافية" subtitle={rawMaterialMode ? 'ملاحظات داخلية للخامة' : 'الوصف والموديفايرز'} icon="tune">
              <AppInput label="الوصف" value={description} onChangeText={setDescription} multiline />
              {!rawMaterialMode ? <ProductOptionGroupsEditor value={optionGroups} onChange={setOptionGroups} /> : null}
            </ProductFormSection>

            <FormError message={formError} />
            <AppButton title={isEdit ? 'حفظ التعديلات' : rawMaterialMode ? 'إنشاء الخامة' : 'إنشاء المنتج'} onPress={() => void save()} loading={submitting} />
          </View>
        </ScrollView>
      )}
    </AppScreen>
  );
}
