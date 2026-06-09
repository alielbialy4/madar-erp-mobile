/**
 * Run: npx tsx src/utils/posTotals.spec.ts
 */
import assert from 'node:assert/strict';
import { resolvePosCatalogSettings } from './posTotals';
import type { PosCatalog } from '@/types/api';

const catalog = {
  settings: { allow_pos_discount: true },
  branch: {
    settings: {
      auto_print_receipt: true,
      customer_printer_profile_id: 'cashier-tcp-1',
      enable_kitchen_print: true,
      receipt_show_branch_name: false,
      customer_receipt_font_size: 14,
    },
  },
} as unknown as PosCatalog;

const merged = resolvePosCatalogSettings(catalog);
assert.equal(merged.auto_print_receipt, true);
assert.equal(merged.customer_printer_profile_id, 'cashier-tcp-1');
assert.equal(merged.enable_kitchen_print, true);
assert.equal(merged.receipt_show_branch_name, false);
assert.equal(merged.customer_receipt_font_size, 14);
assert.equal(merged.allow_pos_discount, true);

const noBranchPrint = resolvePosCatalogSettings({
  settings: { auto_print_receipt: false },
  branch: { settings: {} },
} as unknown as PosCatalog);
assert.equal(noBranchPrint.auto_print_receipt, false);

console.log('posTotals.spec.ts: OK');
