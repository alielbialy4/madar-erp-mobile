import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PrinterProfile } from '@/types/printing';
import {
  effectiveKitchenProfileForCheckout,
  effectiveReceiptProfile,
  normalizeReceiptPrintMode,
  receiptPrintPathForMode,
  shouldUseRasterForReceipt,
} from './resolvePrintPath';

const cashierImage: PrinterProfile = {
  id: '1',
  name: 'Cashier',
  role: 'cashier',
  connection_type: 'network_tcp',
  paper_width: '80mm',
  port: 9100,
  mode: 'escpos_image',
  encoding: 'utf8_image',
  characters_per_line: 48,
  cut_paper: true,
  enabled: true,
  ip: '192.168.1.10',
};

describe('resolvePrintPath', () => {
  it('normalizes receipt print mode', () => {
    assert.equal(normalizeReceiptPrintMode('fast_text'), 'fast_text');
    assert.equal(normalizeReceiptPrintMode('quality_image'), 'quality_image');
    assert.equal(normalizeReceiptPrintMode(undefined), 'quality_image');
  });

  it('forces windows1256 for fast_text receipt profile', () => {
    const effective = effectiveReceiptProfile(cashierImage, 'fast_text');
    assert.equal(effective.encoding, 'windows1256');
    assert.equal(effective.mode, 'escpos_text');
    assert.equal(effective.ip, cashierImage.ip);
    assert.equal(effective.code_page_table?.windows1256, 17);
    assert.equal(effective.code_page_table?.cp864, 22);
  });

  it('keeps image profile for quality_image mode', () => {
    const effective = effectiveReceiptProfile(cashierImage, 'quality_image');
    assert.equal(effective.encoding, 'utf8_image');
    assert.equal(effective.mode, 'escpos_image');
  });

  it('shouldUseRasterForReceipt respects mode', () => {
    assert.equal(shouldUseRasterForReceipt(cashierImage, 'fast_text'), false);
    assert.equal(shouldUseRasterForReceipt(cashierImage, 'quality_image'), true);
  });

  it('forces text kitchen profile at checkout when image encoding', () => {
    const kitchenImage: PrinterProfile = { ...cashierImage, id: '2', role: 'kitchen' };
    const effective = effectiveKitchenProfileForCheckout(kitchenImage);
    assert.equal(effective.encoding, 'windows1256');
    assert.equal(effective.mode, 'escpos_text');
  });

  it('maps print path labels by mode', () => {
    assert.equal(receiptPrintPathForMode('fast_text'), 'text_windows1256');
    assert.equal(receiptPrintPathForMode('quality_image'), 'raster');
  });
});
