import type { ProductOptionGroupInput, ProductPayload, PickedImage, ProductRecipeInput } from '@/types/api';

export function appendPickedImage(formData: FormData, field: string, image?: PickedImage | null) {
  if (!image?.uri) return;
  formData.append(field, {
    uri: image.uri,
    name: image.name ?? 'image.jpg',
    type: image.mimeType ?? 'image/jpeg',
  } as unknown as Blob);
}

export function appendOptionGroupsToFormData(formData: FormData, groups?: ProductOptionGroupInput[]) {
  if (!Array.isArray(groups)) return;
  groups.forEach((g, gi) => {
    if (g.id != null) formData.append(`option_groups[${gi}][id]`, String(g.id));
    formData.append(`option_groups[${gi}][title]`, g.title);
    formData.append(`option_groups[${gi}][selection_type]`, g.selection_type);
    formData.append(`option_groups[${gi}][pricing_type]`, g.pricing_type);
    if (g.pricing_type === 'group_price' && g.group_price != null) {
      formData.append(`option_groups[${gi}][group_price]`, String(g.group_price));
    }
    formData.append(`option_groups[${gi}][is_required]`, g.is_required === true ? '1' : '0');
    if (g.min_selections != null) formData.append(`option_groups[${gi}][min_selections]`, String(g.min_selections));
    if (g.max_selections != null) formData.append(`option_groups[${gi}][max_selections]`, String(g.max_selections));
    formData.append(`option_groups[${gi}][sort_order]`, String(g.sort_order ?? gi));
    formData.append(`option_groups[${gi}][is_active]`, g.is_active !== false ? '1' : '0');
    (g.options ?? []).forEach((o, oi) => {
      if (o.id != null) formData.append(`option_groups[${gi}][options][${oi}][id]`, String(o.id));
      formData.append(`option_groups[${gi}][options][${oi}][name]`, o.name);
      formData.append(`option_groups[${gi}][options][${oi}][price]`, String(o.price ?? 0));
      formData.append(`option_groups[${gi}][options][${oi}][sort_order]`, String(o.sort_order ?? oi));
      formData.append(`option_groups[${gi}][options][${oi}][is_active]`, o.is_active !== false ? '1' : '0');
    });
  });
}

export function appendRecipesToFormData(formData: FormData, recipes?: ProductRecipeInput[]) {
  if (!Array.isArray(recipes)) return;
  recipes.forEach((r, idx) => {
    if (r.id != null) formData.append(`recipes[${idx}][id]`, String(r.id));
    if (r.variant_id) formData.append(`recipes[${idx}][variant_id]`, String(r.variant_id));
    if (r.modifier_option_id != null) formData.append(`recipes[${idx}][modifier_option_id]`, String(r.modifier_option_id));
    formData.append(`recipes[${idx}][ingredient_product_id]`, String(r.ingredient_product_id));
    formData.append(`recipes[${idx}][quantity]`, String(r.quantity));
    formData.append(`recipes[${idx}][unit_id]`, String(r.unit_id));
    formData.append(`recipes[${idx}][waste_percentage]`, String(r.waste_percentage ?? 0));
    if (r.warehouse_id) formData.append(`recipes[${idx}][warehouse_id]`, String(r.warehouse_id));
    formData.append(`recipes[${idx}][is_active]`, r.is_active === false ? '0' : '1');
  });
}

export function buildProductFormData(data: ProductPayload, forUpdate = false): FormData {
  const formData = new FormData();
  if (forUpdate) formData.append('_method', 'PUT');
  formData.append('name', data.name);
  const barcodes = Array.isArray(data.barcodes) ? data.barcodes.filter(Boolean) : [];
  if (barcodes.length > 0) {
    barcodes.forEach((b) => formData.append('barcodes[]', b));
    formData.append('barcode', barcodes[0]);
  } else if (data.barcode) {
    formData.append('barcode', data.barcode);
  }
  if (data.description) formData.append('description', data.description);
  if (data.category_id !== undefined) formData.append('category_id', data.category_id == null ? '' : String(data.category_id));
  formData.append('cost_price', String(data.cost_price));
  formData.append('selling_price', String(data.selling_price));
  const mode = data.inventory_mode ?? (data.track_inventory === false ? 'non_stock' : 'stock_product');
  const tracks = mode === 'stock_product';
  formData.append('inventory_mode', mode);
  formData.append('product_role', data.product_role ?? (mode === 'non_stock' ? 'service' : 'sellable_product'));
  if (data.is_sellable !== undefined) formData.append('is_sellable', data.is_sellable ? '1' : '0');
  if (data.is_purchasable !== undefined) formData.append('is_purchasable', data.is_purchasable ? '1' : '0');
  if (data.is_recipe_ingredient !== undefined) formData.append('is_recipe_ingredient', data.is_recipe_ingredient ? '1' : '0');
  formData.append('track_inventory', tracks ? '1' : '0');
  formData.append('track_expiry', tracks && data.track_expiry === true ? '1' : '0');
  if (data.track_batch !== undefined) formData.append('track_batch', data.track_batch ? '1' : '0');
  if (data.preferred_supplier_id !== undefined) {
    formData.append('preferred_supplier_id', data.preferred_supplier_id == null ? '' : String(data.preferred_supplier_id));
  }
  if (data.default_warehouse_id !== undefined) {
    formData.append('default_warehouse_id', data.default_warehouse_id == null ? '' : data.default_warehouse_id);
  }
  if (data.storage_type) formData.append('storage_type', data.storage_type);
  if (data.default_shelf_life_days != null) formData.append('default_shelf_life_days', String(data.default_shelf_life_days));
  if (data.specs) {
    Object.entries(data.specs).forEach(([key, value]) => {
      if (!key || value === null || value === undefined || String(value).trim() === '') return;
      formData.append(`specs[${key}]`, String(value));
    });
  }
  formData.append('min_stock_alert', String(tracks ? data.min_stock_alert : 0));
  formData.append('active', data.active === true ? '1' : '0');
  formData.append('featured', data.featured === true ? '1' : '0');
  formData.append('is_promotional', data.is_promotional === true ? '1' : '0');
  if (data.is_promotional && data.promotional_price != null) {
    formData.append('promotional_price', String(data.promotional_price));
  }
  if (data.is_promotional && data.promotional_start_date) {
    formData.append('promotional_start_date', data.promotional_start_date);
  }
  if (data.is_promotional && data.promotional_end_date) {
    formData.append('promotional_end_date', data.promotional_end_date);
  }
  appendPickedImage(formData, 'image', data.image);
  (data.units ?? []).forEach((u, idx) => {
    if (u.id) formData.append(`units[${idx}][id]`, String(u.id));
    formData.append(`units[${idx}][name]`, u.name);
    formData.append(`units[${idx}][factor_to_base]`, String(u.factor_to_base));
    formData.append(`units[${idx}][is_base]`, u.is_base ? '1' : '0');
    if (u.barcode) formData.append(`units[${idx}][barcode]`, u.barcode);
  });
  if (tracks && Array.isArray(data.opening_stock)) {
    data.opening_stock.forEach((row, idx) => {
      formData.append(`opening_stock[${idx}][warehouse_id]`, row.warehouse_id);
      formData.append(`opening_stock[${idx}][quantity]`, String(row.quantity));
      if (row.unit_index !== undefined) {
        formData.append(`opening_stock[${idx}][unit_index]`, String(row.unit_index));
      }
    });
  }
  appendOptionGroupsToFormData(formData, data.option_groups);
  if (mode === 'recipe_product') {
    if (Array.isArray(data.recipes) && data.recipes.length > 0) appendRecipesToFormData(formData, data.recipes);
    else formData.append('recipes_clear', '1');
  }
  return formData;
}

export type CategoryPayload = {
  name: string;
  description?: string;
  active?: boolean;
  image?: PickedImage | null;
};

export function buildCategoryFormData(data: CategoryPayload, forUpdate = false): FormData {
  const formData = new FormData();
  if (forUpdate) formData.append('_method', 'PUT');
  formData.append('name', data.name);
  if (data.description) formData.append('description', data.description);
  if (data.active !== undefined) formData.append('active', String(Number(data.active)));
  appendPickedImage(formData, 'image', data.image);
  return formData;
}
