import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { productsAPI } from '@/api/products';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { extractArray, extractData } from '@/utils/data';
import { money } from '@/utils/format';
import { spacing, radius } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import {
  estimateRecipeRowCost,
  estimateTotalRecipeCost,
  inventoryModeOf,
  recipeScopeKey,
} from './productFormUtils';
import type { Product, ProductOptionGroupInput, ProductRecipeInput } from '@/types/api';
import { appTextAlignStart } from '@/constants/layout';

type WarehouseOption = { id: string; name: string };

type Props = {
  recipes: ProductRecipeInput[];
  onChange: (next: ProductRecipeInput[]) => void;
  warehouses: WarehouseOption[];
  productVariants: Product['variants'];
  optionGroups: ProductOptionGroupInput[];
  currentProductId?: number;
  recipeCostPreview?: number | null;
  onAddRawMaterial?: () => void;
};

const emptyRow = (): ProductRecipeInput => ({
  ingredient_product_id: 0,
  quantity: 1,
  unit_id: 0,
  waste_percentage: 0,
  warehouse_id: null,
  variant_id: null,
  modifier_option_id: null,
  is_active: true,
});

export function ProductRecipeBuilder({
  recipes,
  onChange,
  warehouses,
  productVariants,
  optionGroups,
  currentProductId,
  recipeCostPreview,
  onAddRawMaterial,
}: Props) {
  const c = useColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState<Set<number>>(new Set());

  const duplicateKeys = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of recipes) {
      if (!row.ingredient_product_id) continue;
      const key = recipeScopeKey(row);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([k]) => k));
  }, [recipes]);

  const estimatedTotal = useMemo(() => estimateTotalRecipeCost(recipes), [recipes]);

  const runSearch = useCallback(
    async (q: string) => {
      setSearchQuery(q);
      if (q.trim().length < 3) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await productsAPI.search(q.trim(), { context: 'recipe', per_page: 40 });
        const list = extractArray<Product>(res).filter(
          (p) =>
            inventoryModeOf(p) === 'stock_product' &&
            (!currentProductId || Number(p.id) !== Number(currentProductId)),
        );
        setSearchResults(list);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [currentProductId],
  );

  const ingredientOptions = useMemo(() => {
    const fromSearch = searchResults.map((p) => ({ label: p.name, value: String(p.id) }));
    const existing = recipes
      .filter((r) => r.ingredient_product_id && r.ingredient_product?.name)
      .map((r) => ({
        label: r.ingredient_product!.name,
        value: String(r.ingredient_product_id),
      }));
    const merged = new Map<string, { label: string; value: string }>();
    for (const o of [...fromSearch, ...existing]) merged.set(o.value, o);
    return [...merged.values()];
  }, [searchResults, recipes]);

  const variantOptions = useMemo(
    () => [
      { label: 'الأساسي', value: '' },
      ...(productVariants ?? []).map((v) => ({
        label: v?.name || v?.sku || `متغير #${v?.id}`,
        value: String(v?.id ?? ''),
      })),
    ].filter((o, i) => i === 0 || o.value),
    [productVariants],
  );

  const modifierOptions = useMemo(
    () => [
      { label: 'بدون إضافة', value: '' },
      ...optionGroups.flatMap((g) =>
        (g.options ?? [])
          .filter((o) => o.id != null)
          .map((o) => ({ label: `${g.title || 'مجموعة'} / ${o.name}`, value: String(o.id) })),
      ),
    ],
    [optionGroups],
  );

  const updateRow = (idx: number, patch: Partial<ProductRecipeInput>) => {
    onChange(recipes.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const selectIngredient = async (idx: number, rawValue: string) => {
    const id = Number(rawValue) || 0;
    let ingredient = searchResults.find((p) => Number(p.id) === id);
    if (!ingredient && id) {
      try {
        const res = await productsAPI.getById(id);
        ingredient = extractData<Product>(res) ?? undefined;
      } catch {
        ingredient = undefined;
      }
    }
    const unit = ingredient?.units?.find((u) => u.is_base) ?? ingredient?.units?.[0] ?? null;
    updateRow(idx, {
      ingredient_product_id: id,
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
      unit: unit ?? undefined,
    });
  };

  return (
    <View style={{ gap: spacing.md }}>
      {recipeCostPreview != null || estimatedTotal != null ? (
        <Text style={{ color: c.accent, fontWeight: '700', textAlign: appTextAlignStart }}>
          تكلفة الوصفة التقديرية: {money(recipeCostPreview ?? estimatedTotal ?? 0)}
          {recipeCostPreview != null && estimatedTotal != null && Math.abs(recipeCostPreview - estimatedTotal) > 0.01
            ? ` (محسوبة: ${money(estimatedTotal)})`
            : ''}
        </Text>
      ) : null}

      <AppInput
        label="بحث المكونات"
        value={searchQuery}
        onChangeText={(v) => void runSearch(v)}
        placeholder="اكتب 3 أحرف على الأقل"
      />
      {searching ? <Text style={{ color: c.textMuted, textAlign: appTextAlignStart }}>جاري البحث...</Text> : null}

      {recipes.map((row, idx) => {
        const isDup = row.ingredient_product_id ? duplicateKeys.has(recipeScopeKey(row)) : false;
        const rowCost = estimateRecipeRowCost(row);
        const unitOptions = [
          ...(row.ingredient_product?.units ?? []),
          ...(row.unit && !(row.ingredient_product?.units ?? []).some((u) => Number(u.id) === Number(row.unit_id))
            ? [row.unit]
            : []),
        ].map((u) => ({ label: u.is_base ? `${u.name} (أساسية)` : u.name, value: String(u.id) }));

        return (
          <View
            key={row.id ?? `recipe-${idx}`}
            style={{
              gap: spacing.sm,
              borderWidth: 1,
              borderColor: isDup ? c.danger : c.borderSubtle,
              borderRadius: radius.lg,
              padding: spacing.md,
              backgroundColor: isDup ? c.danger + '08' : c.surface,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: isDup ? c.danger : c.textMuted }}>مكون #{idx + 1}</Text>
              {rowCost > 0 ? (
                <Text style={{ color: c.textMuted, fontSize: 12 }}>≈ {money(rowCost)}</Text>
              ) : null}
            </View>
            {isDup ? (
              <Text style={{ color: c.danger, fontSize: 12, textAlign: appTextAlignStart }}>مكون مكرر في نفس النطاق</Text>
            ) : null}
            <AppSelect
              label="المكون"
              value={row.ingredient_product_id ? String(row.ingredient_product_id) : null}
              options={ingredientOptions}
              onChange={(value) => void selectIngredient(idx, value)}
            />
            <AppInput
              label="الكمية"
              value={String(row.quantity || '')}
              onChangeText={(v) => updateRow(idx, { quantity: Number(v) || 0 })}
              keyboardType="decimal-pad"
            />
            <AppSelect
              label="الوحدة"
              value={row.unit_id ? String(row.unit_id) : null}
              options={unitOptions}
              onChange={(value) => {
                const unit =
                  row.ingredient_product?.units?.find((u) => String(u.id) === String(value)) ?? row.unit ?? null;
                updateRow(idx, { unit_id: Number(value) || 0, unit: unit ?? undefined });
              }}
            />
            <AppInput
              label="هالك %"
              value={String(row.waste_percentage ?? 0)}
              onChangeText={(v) => updateRow(idx, { waste_percentage: Number(v) || 0 })}
              keyboardType="decimal-pad"
            />
            {(variantOptions.length > 1 || modifierOptions.length > 1 || warehouses.length > 0) ? (
              <>
                <Pressable
                  onPress={() => {
                    setExpandedDetails((prev) => {
                      const next = new Set(prev);
                      if (next.has(idx)) next.delete(idx);
                      else next.add(idx);
                      return next;
                    });
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Text style={{ color: c.accent, fontSize: 13 }}>تفاصيل النطاق (متغير / إضافة / مخزن)</Text>
                  <MaterialIcons
                    name={expandedDetails.has(idx) ? 'expand-less' : 'expand-more'}
                    size={20}
                    color={c.textMuted}
                  />
                </Pressable>
                {expandedDetails.has(idx) ? (
                  <>
                    {variantOptions.length > 1 ? (
                      <AppSelect
                        label="المتغير"
                        value={row.variant_id ?? ''}
                        options={variantOptions}
                        onChange={(value) => updateRow(idx, { variant_id: value || null })}
                      />
                    ) : null}
                    {modifierOptions.length > 1 ? (
                      <AppSelect
                        label="الإضافة"
                        value={row.modifier_option_id != null ? String(row.modifier_option_id) : ''}
                        options={modifierOptions}
                        onChange={(value) => updateRow(idx, { modifier_option_id: value ? Number(value) : null })}
                      />
                    ) : null}
                    {warehouses.length > 0 ? (
                      <AppSelect
                        label="المخزن"
                        value={row.warehouse_id ?? ''}
                        options={[{ label: 'مخزن البيع', value: '' }, ...warehouses.map((w) => ({ label: w.name, value: w.id }))]}
                        onChange={(value) => updateRow(idx, { warehouse_id: value || null })}
                      />
                    ) : null}
                  </>
                ) : null}
              </>
            ) : null}
            <AppButton
              title="حذف المكون"
              variant="outline"
              onPress={() => onChange(recipes.filter((_, i) => i !== idx))}
            />
          </View>
        );
      })}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <AppButton title="إضافة مكون" variant="secondary" onPress={() => onChange([...recipes, emptyRow()])} />
        {onAddRawMaterial ? (
          <AppButton title="إضافة خامة جديدة" variant="outline" onPress={onAddRawMaterial} />
        ) : null}
      </View>
    </View>
  );
}
