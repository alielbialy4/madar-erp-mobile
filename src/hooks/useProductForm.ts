import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ProductFormSectionKey, ProductFormValidationError } from '@/components/products/ProductFormContext';
import { productsAPI } from '@/api/products';
import { categoriesAPI } from '@/api/categories';
import { warehousesAPI } from '@/api/inventory';
import { suppliersAPI } from '@/api/suppliers';
import {
  addMonthsToDateString,
  applyInventoryModeChange,
  daysUntilDate,
  defaultUnits,
  inventoryModeOf,
  isRawMaterialRole,
  normalizeRecipesForSave,
  rawMaterialUnits,
  roleDefaults,
  validateOptionGroups,
} from '@/components/products/productFormUtils';
import { extractArray, extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { parseApiMoneyFirst } from '@/utils/parseMoney';
import type {
  Category,
  InventoryMode,
  OpeningStockInput,
  PickedImage,
  Product,
  ProductOptionGroupInput,
  ProductPayload,
  ProductRecipeInput,
  ProductRole,
  ProductUnitInput,
} from '@/types/api';

type Options = {
  id?: number;
  initialRawMaterial?: boolean;
};

export function useProductForm({ id, initialRawMaterial }: Options) {
  const isEdit = Boolean(id);
  const [rawMaterialMode, setRawMaterialMode] = useState(initialRawMaterial ?? false);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [errorSectionKey, setErrorSectionKey] = useState<ProductFormSectionKey | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [barcodes, setBarcodes] = useState<string[]>(['']);
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('5');
  const [inventoryMode, setInventoryModeState] = useState<InventoryMode>('stock_product');
  const [productRole, setProductRole] = useState<ProductRole>(initialRawMaterial ? 'raw_material' : 'sellable_product');
  const [isSellable, setIsSellable] = useState(true);
  const [isPurchasable, setIsPurchasable] = useState(true);
  const [isRecipeIngredient, setIsRecipeIngredient] = useState(false);
  const [trackInventory, setTrackInventory] = useState(true);
  const [trackExpiry, setTrackExpiry] = useState(false);
  const [trackBatch, setTrackBatch] = useState(false);
  const [storageType, setStorageType] = useState<string | null>(null);
  const [preferredSupplierId, setPreferredSupplierId] = useState<string | null>(null);
  const [defaultWarehouseId, setDefaultWarehouseId] = useState<string | null>(null);
  const [specBrand, setSpecBrand] = useState('');
  const [specGrade, setSpecGrade] = useState('');
  const [specOrigin, setSpecOrigin] = useState('');
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
  const [units, setUnits] = useState<ProductUnitInput[]>(() => (initialRawMaterial ? rawMaterialUnits() : defaultUnits()));
  const [openingStock, setOpeningStock] = useState<OpeningStockInput[]>([]);
  const [optionGroups, setOptionGroups] = useState<ProductOptionGroupInput[]>([]);
  const [recipes, setRecipes] = useState<ProductRecipeInput[]>([]);
  const [productVariants, setProductVariants] = useState<Product['variants']>([]);
  const [recipeCostPreview, setRecipeCostPreview] = useState<number | null>(null);

  const setInventoryMode = useCallback(
    (mode: InventoryMode) => {
      const patch = applyInventoryModeChange(
        {
          name,
          description,
          categoryId,
          barcodes,
          costPrice,
          sellingPrice,
          minStockAlert,
          inventoryMode,
          productRole,
          isSellable,
          isPurchasable,
          isRecipeIngredient,
          trackInventory,
          trackExpiry,
          active,
          featured,
          isPromotional,
          promotionalPrice,
          promoStart,
          promoEnd,
          units,
        },
        mode,
        rawMaterialMode,
      );
      if (patch.inventoryMode) setInventoryModeState(patch.inventoryMode);
      if (patch.trackInventory != null) setTrackInventory(patch.trackInventory);
      if (patch.trackExpiry != null) setTrackExpiry(patch.trackExpiry);
      if (patch.minStockAlert != null) setMinStockAlert(patch.minStockAlert);
      if (patch.productRole) setProductRole(patch.productRole);
      if (patch.isSellable != null) setIsSellable(patch.isSellable);
      if (patch.isPurchasable != null) setIsPurchasable(patch.isPurchasable);
      if (patch.isRecipeIngredient != null) setIsRecipeIngredient(patch.isRecipeIngredient);
      if (mode !== 'stock_product') setOpeningStock([]);
    },
    [
      rawMaterialMode,
      name,
      description,
      categoryId,
      barcodes,
      costPrice,
      sellingPrice,
      minStockAlert,
      inventoryMode,
      productRole,
      isSellable,
      isPurchasable,
      isRecipeIngredient,
      trackInventory,
      trackExpiry,
      active,
      featured,
      isPromotional,
      promotionalPrice,
      promoStart,
      promoEnd,
      units,
    ],
  );

  const applyProductRole = useCallback(
    (role: ProductRole) => {
      const defaults = roleDefaults(role);
      setProductRole(defaults.productRole);
      setInventoryModeState(defaults.inventoryMode);
      setTrackInventory(defaults.trackInventory);
      setTrackExpiry(defaults.trackExpiry);
      setIsSellable(defaults.isSellable);
      setIsPurchasable(defaults.isPurchasable);
      setIsRecipeIngredient(defaults.isRecipeIngredient);
      setMinStockAlert(defaults.minStockAlert);
      if (role === 'service') setOpeningStock([]);
      if (isRawMaterialRole(role)) setRawMaterialMode(true);
    },
    [],
  );

  const expiryDays = useMemo(() => daysUntilDate(expiryDate), [expiryDate]);

  const updateProductionDate = useCallback(
    (value: string) => {
      setProductionDate(value);
      if (value && shelfLifeMonths) {
        const calculated = addMonthsToDateString(value, shelfLifeMonths);
        if (calculated) setExpiryDate(calculated);
      }
    },
    [shelfLifeMonths],
  );

  const updateShelfLifeMonths = useCallback(
    (value: string) => {
      setShelfLifeMonths(value);
      if (productionDate && value) {
        const calculated = addMonthsToDateString(productionDate, value);
        if (calculated) setExpiryDate(calculated);
      }
    },
    [productionDate],
  );

  useEffect(() => {
    if (!rawMaterialMode) return;
    setInventoryModeState('stock_product');
    setTrackInventory(true);
    setSellingPrice('0');
    setFeatured(false);
    setIsPromotional(false);
    setIsSellable(false);
    setIsPurchasable(true);
    setIsRecipeIngredient(true);
  }, [rawMaterialMode]);

  useEffect(() => {
    categoriesAPI.getAll({ per_page: 200 }).then((res) => setCategories(extractArray<Category>(res))).catch(() => {});
    warehousesAPI.list({ active_only: true }).then((res) => {
      setWarehouses(extractArray<{ id: string; name: string }>(res).map((w) => ({ id: String(w.id), name: String(w.name) })));
    }).catch(() => {});
    suppliersAPI.getAll({ per_page: 200, active_only: true }).then((res) => {
      setSuppliers(extractArray<{ id: number; name: string }>(res).map((s) => ({ id: Number(s.id), name: String(s.name) })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productsAPI
      .getById(id)
      .then((res) => {
        const p = extractData<Product>(res);
        if (!p) return;
        const loadedRole = (p.product_role ?? 'sellable_product') as ProductRole;
        const loadedIsRaw = isRawMaterialRole(loadedRole);
        setRawMaterialMode((prev) => prev || loadedIsRaw);
        setProductRole(loadedIsRaw ? loadedRole : loadedRole === 'service' ? 'service' : loadedRole);
        setIsSellable(p.is_sellable ?? (loadedRole !== 'service' && !loadedIsRaw));
        setIsPurchasable(p.is_purchasable ?? !loadedIsRaw);
        setIsRecipeIngredient(p.is_recipe_ingredient ?? loadedIsRaw);
        setName(p.name);
        setDescription(p.description ?? '');
        setCategoryId(loadedIsRaw ? null : p.category_id ? String(p.category_id) : null);
        const specs = p.specs && typeof p.specs === 'object' ? (p.specs as Record<string, unknown>) : {};
        setTrackBatch(Boolean(p.track_batch));
        setStorageType(p.storage_type ? String(p.storage_type) : null);
        setPreferredSupplierId(p.preferred_supplier_id != null ? String(p.preferred_supplier_id) : null);
        setDefaultWarehouseId(p.default_warehouse_id != null ? String(p.default_warehouse_id) : null);
        setSpecBrand(specs.brand ? String(specs.brand) : '');
        setSpecGrade(specs.grade ? String(specs.grade) : '');
        setSpecOrigin(specs.origin ? String(specs.origin) : '');
        setRecipeCostPreview(p.recipe_costing?.recipe_cost != null ? Number(p.recipe_costing.recipe_cost) : null);
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
            min_selections: g.min_selections ?? null,
            max_selections: g.max_selections ?? null,
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

  const buildPayload = useCallback(
    (normalizedRecipes: ProductRecipeInput[]): ProductPayload => {
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
            ...(specBrand.trim() ? { brand: specBrand.trim() } : {}),
            ...(specGrade.trim() ? { grade: specGrade.trim() } : {}),
            ...(specOrigin.trim() ? { origin: specOrigin.trim() } : {}),
          }
        : undefined;

      const normalizedGroups = rawMaterialMode ? [] : optionGroups.filter((g) => g.title.trim());

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
        product_role: rawMaterialMode
          ? productRole
          : effectiveInventoryMode === 'non_stock'
            ? 'service'
            : productRole === 'service'
              ? 'sellable_product'
              : productRole,
        is_sellable: rawMaterialMode ? false : isSellable,
        is_purchasable: rawMaterialMode ? true : isPurchasable,
        is_recipe_ingredient: rawMaterialMode ? true : isRecipeIngredient,
        track_inventory: isStockMode,
        track_expiry: isStockMode && trackExpiry,
        track_batch: rawMaterialMode ? trackBatch : undefined,
        storage_type: rawMaterialMode && storageType ? storageType : undefined,
        preferred_supplier_id: rawMaterialMode && preferredSupplierId ? Number(preferredSupplierId) : undefined,
        default_warehouse_id: rawMaterialMode && defaultWarehouseId ? defaultWarehouseId : undefined,
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
        option_groups: isEdit && !rawMaterialMode ? normalizedGroups : rawMaterialMode ? [] : normalizedGroups.length ? normalizedGroups : undefined,
        recipes: !rawMaterialMode && effectiveInventoryMode === 'recipe_product' ? normalizedRecipes : undefined,
      };
    },
    [
      barcodes,
      units,
      rawMaterialMode,
      inventoryMode,
      shelfLifeMonths,
      productionDate,
      expiryDate,
      specBrand,
      specGrade,
      specOrigin,
      name,
      description,
      categoryId,
      costPrice,
      sellingPrice,
      minStockAlert,
      productRole,
      isSellable,
      isPurchasable,
      isRecipeIngredient,
      trackExpiry,
      trackBatch,
      storageType,
      preferredSupplierId,
      defaultWarehouseId,
      active,
      featured,
      isPromotional,
      promotionalPrice,
      promoStart,
      promoEnd,
      image,
      openingStock,
      optionGroups,
      isEdit,
    ],
  );

  const validate = useCallback((): ProductFormValidationError | null => {
    if (name.trim().length < 2) {
      return { message: rawMaterialMode ? 'اسم الخامة مطلوب' : 'اسم المنتج مطلوب', sectionKey: 'basics' };
    }
    if (!rawMaterialMode && !categoryId) return { message: 'اختر التصنيف', sectionKey: 'basics' };
    if (!rawMaterialMode && Number(sellingPrice) <= 0) return { message: 'سعر البيع مطلوب', sectionKey: 'pricing' };
    if (!rawMaterialMode && isPromotional && Number(promotionalPrice) <= 0) {
      return { message: 'سعر الترويج مطلوب', sectionKey: 'pricing' };
    }
    if (!rawMaterialMode && isPromotional && promoStart && promoEnd) {
      const start = new Date(promoStart);
      const end = new Date(promoEnd);
      if (start > end) return { message: 'تاريخ بداية العرض يجب أن يكون قبل النهاية', sectionKey: 'pricing' };
    }
    const bases = units.filter((u) => u.is_base);
    if (bases.length !== 1) return { message: 'حدد وحدة أساسية واحدة', sectionKey: 'inventory' };
    const recipeValidation = normalizeRecipesForSave(recipes, inventoryMode, rawMaterialMode, active);
    if (recipeValidation.error) return { message: recipeValidation.error, sectionKey: 'recipe' };
    if (!rawMaterialMode) {
      const groupErr = validateOptionGroups(optionGroups.filter((g) => g.title.trim()));
      if (groupErr) return { message: groupErr, sectionKey: 'modifiers' };
    }
    return null;
  }, [
    name,
    rawMaterialMode,
    categoryId,
    sellingPrice,
    isPromotional,
    promotionalPrice,
    promoStart,
    promoEnd,
    units,
    recipes,
    inventoryMode,
    active,
    optionGroups,
  ]);

  const save = useCallback(async (): Promise<ProductFormValidationError | null> => {
    const err = validate();
    if (err) {
      setFormError(err.message);
      setSectionError(err.message);
      setErrorSectionKey(err.sectionKey);
      return err;
    }
    setSubmitting(true);
    setFormError(null);
    setSectionError(null);
    setErrorSectionKey(null);
    try {
      const recipeResult = normalizeRecipesForSave(recipes, inventoryMode, rawMaterialMode, active);
      if (recipeResult.error) {
        const recipeErr: ProductFormValidationError = { message: recipeResult.error, sectionKey: 'recipe' };
        setFormError(recipeErr.message);
        setSectionError(recipeErr.message);
        setErrorSectionKey(recipeErr.sectionKey);
        return recipeErr;
      }
      const payload = buildPayload(recipeResult.rows);
      if (isEdit && id) await productsAPI.update(id, payload);
      else await productsAPI.create(payload);
      return null;
    } catch (e) {
      setFormError(normalizeApiError(e).message);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [validate, recipes, inventoryMode, rawMaterialMode, active, buildPayload, isEdit, id]);

  return {
    productId: id,
    isEdit,
    rawMaterialMode,
    loading,
    submitting,
    formError,
    sectionError,
    errorSectionKey,
    setFormError,
    setErrorSectionKey,
    categories,
    warehouses,
    suppliers,
    name,
    setName,
    description,
    setDescription,
    categoryId,
    setCategoryId,
    barcodes,
    setBarcodes,
    costPrice,
    setCostPrice,
    sellingPrice,
    setSellingPrice,
    minStockAlert,
    setMinStockAlert,
    inventoryMode,
    setInventoryMode,
    productRole,
    applyProductRole,
    setProductRole,
    isSellable,
    setIsSellable,
    isPurchasable,
    setIsPurchasable,
    isRecipeIngredient,
    setIsRecipeIngredient,
    trackInventory,
    trackExpiry,
    setTrackExpiry,
    trackBatch,
    setTrackBatch,
    storageType,
    setStorageType,
    preferredSupplierId,
    setPreferredSupplierId,
    defaultWarehouseId,
    setDefaultWarehouseId,
    specBrand,
    setSpecBrand,
    specGrade,
    setSpecGrade,
    specOrigin,
    setSpecOrigin,
    productionDate,
    updateProductionDate,
    expiryDate,
    setExpiryDate,
    shelfLifeMonths,
    updateShelfLifeMonths,
    expiryDays,
    active,
    setActive,
    featured,
    setFeatured,
    isPromotional,
    setIsPromotional,
    promotionalPrice,
    setPromotionalPrice,
    promoStart,
    setPromoStart,
    promoEnd,
    setPromoEnd,
    image,
    setImage,
    remoteImage,
    units,
    setUnits,
    openingStock,
    setOpeningStock,
    optionGroups,
    setOptionGroups,
    recipes,
    setRecipes,
    productVariants,
    recipeCostPreview,
    save,
  };
}

export type ProductFormState = ReturnType<typeof useProductForm>;
