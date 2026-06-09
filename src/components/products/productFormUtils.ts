import type {
  InventoryMode,
  Product,
  ProductOptionGroupInput,
  ProductRecipeInput,
  ProductRole,
  ProductUnitInput,
} from '@/types/api';
import { parseApiMoneyFirst } from '@/utils/parseMoney';

export type ProductFormCoreState = {
  name: string;
  description: string;
  categoryId: string | null;
  barcodes: string[];
  costPrice: string;
  sellingPrice: string;
  minStockAlert: string;
  inventoryMode: InventoryMode;
  productRole: ProductRole;
  isSellable: boolean;
  isPurchasable: boolean;
  isRecipeIngredient: boolean;
  trackInventory: boolean;
  trackExpiry: boolean;
  active: boolean;
  featured: boolean;
  isPromotional: boolean;
  promotionalPrice: string;
  promoStart: string;
  promoEnd: string;
  units: ProductUnitInput[];
};

export function inventoryModeOf(product: Product): InventoryMode {
  return product.inventory_mode ?? (product.track_inventory === false ? 'non_stock' : 'stock_product');
}

export function generateEan13Barcode(): string {
  const base = '200' + String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, '0');
  const digits = base.split('').map((d) => Number(d));
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return base + String(check);
}

export function roleDefaults(role: ProductRole): Pick<
  ProductFormCoreState,
  | 'productRole'
  | 'inventoryMode'
  | 'trackInventory'
  | 'trackExpiry'
  | 'isSellable'
  | 'isPurchasable'
  | 'isRecipeIngredient'
  | 'minStockAlert'
> {
  if (role === 'service') {
    return {
      productRole: 'service',
      inventoryMode: 'non_stock',
      trackInventory: false,
      trackExpiry: false,
      isSellable: true,
      isPurchasable: false,
      isRecipeIngredient: false,
      minStockAlert: '0',
    };
  }
  if (role === 'raw_material' || role === 'packaging_material' || role === 'semi_finished') {
    return {
      productRole: role,
      inventoryMode: 'stock_product',
      trackInventory: true,
      trackExpiry: false,
      isSellable: false,
      isPurchasable: true,
      isRecipeIngredient: true,
      minStockAlert: '5',
    };
  }
  return {
    productRole: 'sellable_product',
    inventoryMode: 'stock_product',
    trackInventory: true,
    trackExpiry: false,
    isSellable: true,
    isPurchasable: true,
    isRecipeIngredient: false,
    minStockAlert: '5',
  };
}

export function applyInventoryModeChange(
  current: ProductFormCoreState,
  nextMode: InventoryMode,
  rawMaterialMode: boolean,
): Partial<ProductFormCoreState> {
  if (rawMaterialMode) {
    return { inventoryMode: 'stock_product', trackInventory: true };
  }
  if (nextMode === 'recipe_product') {
    return {
      inventoryMode: nextMode,
      productRole: 'sellable_product',
      trackInventory: false,
      trackExpiry: false,
      isSellable: true,
      isPurchasable: false,
      isRecipeIngredient: false,
      minStockAlert: '0',
    };
  }
  if (nextMode === 'non_stock') {
    return roleDefaults('service');
  }
  const tracks = nextMode === 'stock_product';
  return {
    inventoryMode: nextMode,
    trackInventory: tracks,
    trackExpiry: tracks ? current.trackExpiry : false,
    minStockAlert: tracks ? current.minStockAlert || '5' : '0',
    productRole: current.productRole === 'service' ? 'sellable_product' : current.productRole,
    isSellable: current.productRole === 'service' ? true : current.isSellable,
  };
}

export function recipeScopeKey(row: ProductRecipeInput): string {
  return [
    row.ingredient_product_id,
    row.variant_id || '',
    row.modifier_option_id ?? '',
    row.warehouse_id || '',
  ].join('|');
}

export function normalizeRecipesForSave(
  recipes: ProductRecipeInput[],
  inventoryMode: InventoryMode,
  rawMaterialMode: boolean,
  active: boolean,
): { rows: ProductRecipeInput[]; error: string | null } {
  if (rawMaterialMode || inventoryMode !== 'recipe_product') return { rows: [], error: null };
  const rows: ProductRecipeInput[] = [];
  const seen = new Set<string>();
  for (const row of recipes) {
    const touched = Boolean(
      row.ingredient_product_id || row.unit_id || row.variant_id || row.modifier_option_id || row.warehouse_id,
    );
    if (!touched) continue;
    if (!row.ingredient_product_id || !row.unit_id || Number(row.quantity) <= 0) {
      return { rows: [], error: 'أكمل بيانات مكونات الوصفة أو احذف الصف الفارغ' };
    }
    const key = recipeScopeKey(row);
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
}

export function validateOptionGroups(groups: ProductOptionGroupInput[]): string | null {
  for (const g of groups) {
    if (!g.title?.trim()) return 'عنوان مجموعة الخيارات مطلوب';
    if (!Array.isArray(g.options) || g.options.length === 0) return 'كل مجموعة يجب أن تحتوي خياراً واحداً على الأقل';
    if (g.pricing_type === 'group_price' && (g.group_price == null || Number(g.group_price) < 0)) {
      return 'سعر المجموعة مطلوب عند اختيار تسعير موحّد';
    }
    if (g.is_required && g.selection_type === 'multiple' && (g.min_selections ?? 1) < 1) {
      return 'المجموعات الإلزامية المتعددة تحتاج حداً أدنى 1';
    }
  }
  return null;
}

export function parseLocalDate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addMonthsToDateString(dateValue: string, monthsValue: string): string {
  const date = parseLocalDate(dateValue);
  const months = Number(monthsValue);
  if (!date || !Number.isFinite(months) || months <= 0) return '';
  const day = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() !== day) date.setDate(0);
  return formatLocalDate(date);
}

export function daysUntilDate(dateValue: string): number | null {
  const date = parseLocalDate(dateValue);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
}

export function expiryDaysText(days: number | null): string {
  if (days === null) return '';
  if (days < 0) return `منتهي منذ ${Math.abs(days)} يوم`;
  if (days === 0) return 'ينتهي اليوم';
  return `باقي ${days} يوم`;
}

export function estimateRecipeRowCost(row: ProductRecipeInput): number {
  if (!row.ingredient_product_id || Number(row.quantity) <= 0) return 0;
  const unitCost = Number(
    parseApiMoneyFirst(row.ingredient_product?.avg_cost ?? row.ingredient_product?.cost_price) ?? 0,
  );
  const waste = Number(row.waste_percentage ?? 0);
  const qty = Number(row.quantity) * (1 + waste / 100);
  return unitCost * qty;
}

export function estimateTotalRecipeCost(recipes: ProductRecipeInput[]): number | null {
  let total = 0;
  for (const row of recipes) {
    total += estimateRecipeRowCost(row);
  }
  return total > 0 ? Math.round(total * 100) / 100 : null;
}

export const defaultUnits = (): ProductUnitInput[] => [{ name: 'قطعة', factor_to_base: 1, is_base: true }];
export const rawMaterialUnits = (): ProductUnitInput[] => [{ name: 'kg', factor_to_base: 1, is_base: true }];

export function isRawMaterialRole(role?: string | null): boolean {
  return ['raw_material', 'packaging_material', 'semi_finished'].includes(String(role ?? ''));
}
