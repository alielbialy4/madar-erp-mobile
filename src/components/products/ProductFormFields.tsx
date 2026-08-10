import React, { useMemo } from 'react';
import { View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ImagePickerField } from '@/components/forms/ImagePickerField';
import { FormError } from '@/components/forms';
import { BarcodesEditor } from '@/components/products/BarcodesEditor';
import { UnitsEditor } from '@/components/products/UnitsEditor';
import { OpeningStockEditor } from '@/components/products/OpeningStockEditor';
import { ProductInventoryModeCards } from '@/components/products/ProductInventoryModeCards';
import { CollapsibleFormSection } from '@/components/products/CollapsibleFormSection';
import { ProductFormSummaryStrip } from '@/components/products/ProductFormSummaryStrip';
import { FormNavRow } from '@/components/products/FormNavRow';
import { SwitchRow } from '@/components/products/ProductFormSection';
import type { ProductFormSectionKey } from '@/components/products/ProductFormContext';
import {
  RAW_MATERIAL_ROLE_OPTIONS,
  SELLABLE_ROLE_OPTIONS,
  STORAGE_TYPE_OPTIONS,
  TRACK_EXPIRY_HELPER_AR,
  inventoryModeContextHint,
} from '@/components/products/productFormLabels';
import { estimateTotalRecipeCost, expiryDaysText } from '@/components/products/productFormUtils';
import type { ProductFormState } from '@/hooks/useProductForm';
import { AppDatePicker, AppInput, AppSelect } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { money } from '@/utils/format';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import type { ProductsStackParamList } from '@/types/navigation';
import { appTextAlignStart } from '@/constants/layout';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductForm'>;

type Props = {
  form: ProductFormState;
  navigation: Nav;
  contentRef: React.RefObject<View | null>;
  sectionRefs: React.MutableRefObject<Partial<Record<ProductFormSectionKey, View | null>>>;
  expandedSections: Partial<Record<ProductFormSectionKey, boolean>>;
  onSectionExpandedChange: (key: ProductFormSectionKey, expanded: boolean) => void;
};

function setSectionRef(
  refs: React.MutableRefObject<Partial<Record<ProductFormSectionKey, View | null>>>,
  key: ProductFormSectionKey,
  node: View | null,
) {
  refs.current[key] = node;
}

export function ProductFormFields({
  form,
  navigation,
  contentRef,
  sectionRefs,
  expandedSections,
  onSectionExpandedChange,
}: Props) {
  const c = useColors();
  const f = form;

  const isStockMode = f.rawMaterialMode || f.inventoryMode === 'stock_product';
  const showRecipeNav = !f.rawMaterialMode && f.inventoryMode === 'recipe_product';
  const showModifiersNav = !f.rawMaterialMode;

  const canEditSellable = !f.rawMaterialMode && (f.productRole === 'sellable_product' || f.inventoryMode === 'recipe_product');
  const canEditPurchasable = !f.rawMaterialMode && f.productRole !== 'service' && f.inventoryMode !== 'recipe_product';
  const canEditRecipeIngredient =
    !f.rawMaterialMode && !['raw_material', 'packaging_material', 'semi_finished'].includes(f.productRole);

  const recipeCount = f.recipes.filter((r) => r.ingredient_product_id).length;
  const recipeCost = f.recipeCostPreview ?? estimateTotalRecipeCost(f.recipes);
  const modifierCount = f.optionGroups.filter((g) => g.title.trim()).length;

  const recipeSubtitle = useMemo(() => {
    if (recipeCount === 0) return 'أضف مكونات الخصم عند البيع';
    const costPart = recipeCost != null ? ` · ${money(recipeCost)}` : '';
    return `${recipeCount} مكون${costPart}`;
  }, [recipeCount, recipeCost]);

  const modifiersSubtitle = useMemo(() => {
    if (modifierCount === 0) return 'حجم، إضافات، تخصيصات نقطة البيع';
    return `${modifierCount} مجموعة`;
  }, [modifierCount]);

  const inventoryHint = f.rawMaterialMode
    ? 'الخامة منتج مخزني — تُخصم من المخزون عند الاستخدام في الوصفات أو التصنيع.'
    : inventoryModeContextHint(f.inventoryMode);

  const sectionError = (key: ProductFormSectionKey) =>
    f.errorSectionKey === key ? f.sectionError : null;

  return (
    <View ref={contentRef} style={{ gap: spacing.md }}>
      <ProductFormSummaryStrip form={f} />

      <CollapsibleFormSection
        ref={(node) => setSectionRef(sectionRefs, 'basics', node)}
        sectionKey="basics"
        title="البيانات الأساسية"
        subtitle={f.rawMaterialMode ? 'الاسم والباركود والصورة' : 'الصورة والاسم والتصنيف'}
        icon="inventory-2"
        expanded={expandedSections.basics ?? true}
        onExpandedChange={(v) => onSectionExpandedChange('basics', v)}
        hasError={f.errorSectionKey === 'basics'}
        defaultExpanded
      >
        <ImagePickerField
          label={f.rawMaterialMode ? 'صورة الخامة' : 'صورة المنتج'}
          value={f.image}
          remoteUrl={f.remoteImage}
          onChange={f.setImage}
        />
        <AppInput label={f.rawMaterialMode ? 'اسم الخامة' : 'الاسم'} value={f.name} onChangeText={f.setName} />
        {!f.rawMaterialMode ? (
          <AppSelect
            label="التصنيف"
            value={f.categoryId}
            options={f.categories.map((cat) => ({ label: cat.name, value: String(cat.id) }))}
            onChange={f.setCategoryId}
          />
        ) : null}
        <BarcodesEditor value={f.barcodes} onChange={f.setBarcodes} embedded />
        <SwitchRow
          label={f.rawMaterialMode ? 'نشط للاستخدام' : 'نشط في نقطة البيع'}
          value={f.active}
          onValueChange={f.setActive}
        />
        {!f.rawMaterialMode ? (
          <SwitchRow label="منتج مميز" value={f.featured} onValueChange={f.setFeatured} />
        ) : null}
        {sectionError('basics') ? <FormError message={sectionError('basics')!} /> : null}
      </CollapsibleFormSection>

      <CollapsibleFormSection
        ref={(node) => setSectionRef(sectionRefs, 'pricing', node)}
        sectionKey="pricing"
        title={f.rawMaterialMode ? 'التكلفة' : 'التسعير'}
        subtitle={f.rawMaterialMode ? 'تكلفة الشراء' : 'التكلفة والبيع والعروض'}
        icon="payments"
        expanded={expandedSections.pricing ?? true}
        onExpandedChange={(v) => onSectionExpandedChange('pricing', v)}
        hasError={f.errorSectionKey === 'pricing'}
        defaultExpanded
      >
        <AppInput label="سعر التكلفة" value={f.costPrice} onChangeText={f.setCostPrice} keyboardType="decimal-pad" />
        {!f.rawMaterialMode ? (
          <AppInput label="سعر البيع" value={f.sellingPrice} onChangeText={f.setSellingPrice} keyboardType="decimal-pad" />
        ) : null}
        {!f.rawMaterialMode ? (
          <SwitchRow label="عرض ترويجي" value={f.isPromotional} onValueChange={f.setIsPromotional} />
        ) : null}
        {!f.rawMaterialMode && f.isPromotional ? (
          <>
            <AppInput
              label="سعر الترويج"
              value={f.promotionalPrice}
              onChangeText={f.setPromotionalPrice}
              keyboardType="decimal-pad"
            />
            <AppDatePicker label="بداية العرض" value={f.promoStart} onChange={f.setPromoStart} />
            <AppDatePicker
              label="نهاية العرض"
              value={f.promoEnd}
              onChange={f.setPromoEnd}
              minimumDate={f.promoStart ? new Date(f.promoStart) : undefined}
            />
          </>
        ) : null}
        {sectionError('pricing') ? <FormError message={sectionError('pricing')!} /> : null}
      </CollapsibleFormSection>

      <CollapsibleFormSection
        ref={(node) => setSectionRef(sectionRefs, 'inventory', node)}
        sectionKey="inventory"
        title="المخزون والوحدات"
        subtitle="نوع المخزون والوحدات والرصيد الافتتاحي"
        icon="warehouse"
        expanded={expandedSections.inventory ?? true}
        onExpandedChange={(v) => onSectionExpandedChange('inventory', v)}
        hasError={f.errorSectionKey === 'inventory'}
        defaultExpanded
      >
        <Text style={{ color: c.textMuted, fontSize: typography.tiny, textAlign: appTextAlignStart }}>{inventoryHint}</Text>
        {!f.rawMaterialMode ? (
          <ProductInventoryModeCards value={f.inventoryMode} onChange={f.setInventoryMode} />
        ) : null}
        {isStockMode ? (
          <>
            <SwitchRow
              label="تتبع الصلاحية"
              value={f.trackExpiry}
              onValueChange={f.setTrackExpiry}
            />
            <Text style={{ color: c.textMuted, fontSize: typography.tiny, textAlign: appTextAlignStart }}>{TRACK_EXPIRY_HELPER_AR}</Text>
            <AppInput
              label="حد تنبيه المخزون"
              value={f.minStockAlert}
              onChangeText={f.setMinStockAlert}
              keyboardType="number-pad"
            />
          </>
        ) : null}
        <UnitsEditor value={f.units} onChange={f.setUnits} embedded />
        {!f.isEdit && isStockMode && f.warehouses.length > 0 ? (
          <OpeningStockEditor
            value={f.openingStock}
            onChange={f.setOpeningStock}
            warehouses={f.warehouses}
            units={f.units}
            embedded
          />
        ) : null}
        {sectionError('inventory') ? <FormError message={sectionError('inventory')!} /> : null}
      </CollapsibleFormSection>

      {f.rawMaterialMode ? (
        <CollapsibleFormSection
          ref={(node) => setSectionRef(sectionRefs, 'rawDetails', node)}
          sectionKey="rawDetails"
          title="تفاصيل الخامة"
          subtitle="التخزين والمورد والمواصفات"
          icon="science"
          expanded={expandedSections.rawDetails ?? true}
          onExpandedChange={(v) => onSectionExpandedChange('rawDetails', v)}
          hasError={f.errorSectionKey === 'rawDetails'}
          defaultExpanded
        >
          <SwitchRow label="تتبع الدفعات" value={f.trackBatch} onValueChange={f.setTrackBatch} />
          <AppSelect
            label="نوع التخزين"
            value={f.storageType}
            options={[{ label: '—', value: '' }, ...STORAGE_TYPE_OPTIONS]}
            onChange={(v) => f.setStorageType(v || null)}
          />
          {f.suppliers.length > 0 ? (
            <AppSelect
              label="المورد المفضل"
              value={f.preferredSupplierId}
              options={[{ label: '—', value: '' }, ...f.suppliers.map((s) => ({ label: s.name, value: String(s.id) }))]}
              onChange={(v) => f.setPreferredSupplierId(v || null)}
            />
          ) : null}
          {f.warehouses.length > 0 ? (
            <AppSelect
              label="المخزن الافتراضي"
              value={f.defaultWarehouseId}
              options={[{ label: '—', value: '' }, ...f.warehouses.map((w) => ({ label: w.name, value: w.id }))]}
              onChange={(v) => f.setDefaultWarehouseId(v || null)}
            />
          ) : null}
          <AppInput label="العلامة التجارية" value={f.specBrand} onChangeText={f.setSpecBrand} />
          <AppInput label="الدرجة" value={f.specGrade} onChangeText={f.setSpecGrade} />
          <AppInput label="المنشأ" value={f.specOrigin} onChangeText={f.setSpecOrigin} />
          <AppDatePicker label="تاريخ الإنتاج" value={f.productionDate} onChange={f.updateProductionDate} />
          <AppInput
            label="مدة الصلاحية بالشهور"
            value={f.shelfLifeMonths}
            onChangeText={f.updateShelfLifeMonths}
            keyboardType="number-pad"
          />
          <AppDatePicker label="تاريخ الانتهاء" value={f.expiryDate} onChange={f.setExpiryDate} />
          {f.expiryDate ? (
            <Text style={{ color: c.textMuted, textAlign: appTextAlignStart }}>{expiryDaysText(f.expiryDays)}</Text>
          ) : null}
        </CollapsibleFormSection>
      ) : null}

      <CollapsibleFormSection
        ref={(node) => setSectionRef(sectionRefs, 'advanced', node)}
        sectionKey="advanced"
        title="إعدادات متقدمة"
        subtitle="دور المنتج وإعدادات البيع والشراء"
        icon="tune"
        expanded={expandedSections.advanced ?? false}
        onExpandedChange={(v) => onSectionExpandedChange('advanced', v)}
        defaultExpanded={false}
      >
        {f.rawMaterialMode ? (
          <AppSelect
            label="نوع الخامة"
            value={f.productRole}
            options={[...RAW_MATERIAL_ROLE_OPTIONS]}
            onChange={(value) => f.applyProductRole(value as typeof f.productRole)}
          />
        ) : (
          <>
            <AppSelect
              label="دور المنتج"
              value={f.productRole}
              options={[...SELLABLE_ROLE_OPTIONS]}
              onChange={(value) => f.applyProductRole(value as typeof f.productRole)}
            />
            <SwitchRow
              label="يظهر في نقطة البيع"
              value={f.isSellable}
              onValueChange={f.setIsSellable}
              disabled={!canEditSellable}
            />
            <SwitchRow
              label="قابل للشراء"
              value={f.isPurchasable}
              onValueChange={f.setIsPurchasable}
              disabled={!canEditPurchasable}
            />
            <SwitchRow
              label="مكون وصفة"
              value={f.isRecipeIngredient}
              onValueChange={f.setIsRecipeIngredient}
              disabled={!canEditRecipeIngredient}
            />
          </>
        )}
      </CollapsibleFormSection>

      {showRecipeNav ? (
        <View ref={(node) => setSectionRef(sectionRefs, 'recipe', node)}>
          <FormNavRow
            title="مكونات الوصفة"
            subtitle={recipeSubtitle}
            onPress={() => navigation.navigate('ProductFormRecipe')}
            hasError={f.errorSectionKey === 'recipe'}
          />
          {f.errorSectionKey === 'recipe' && f.sectionError ? <FormError message={f.sectionError} /> : null}
        </View>
      ) : null}

      {showModifiersNav ? (
        <View ref={(node) => setSectionRef(sectionRefs, 'modifiers', node)}>
          <FormNavRow
            title="مجموعات الخيارات"
            subtitle={modifiersSubtitle}
            onPress={() => navigation.navigate('ProductFormModifiers')}
            hasError={f.errorSectionKey === 'modifiers'}
          />
          {f.errorSectionKey === 'modifiers' && f.sectionError ? <FormError message={f.sectionError} /> : null}
        </View>
      ) : null}

      <CollapsibleFormSection
        ref={(node) => setSectionRef(sectionRefs, 'extra', node)}
        sectionKey="extra"
        title="بيانات إضافية"
        subtitle="وصف المنتج"
        icon="notes"
        expanded={expandedSections.extra ?? false}
        onExpandedChange={(v) => onSectionExpandedChange('extra', v)}
        defaultExpanded={false}
      >
        <AppInput label="الوصف" value={f.description} onChangeText={f.setDescription} multiline />
      </CollapsibleFormSection>

      <FormError message={f.formError} />
    </View>
  );
}
