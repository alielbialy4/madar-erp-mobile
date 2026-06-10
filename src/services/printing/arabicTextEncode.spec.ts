import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { encodeForPrinter } from './arabicTextEncode';
import { prepareArabicTextForEncoding } from './prepareArabicLine';

describe('arabicTextEncode', () => {
  it('windows1256 must not emit question marks for logical Arabic', () => {
    const text = 'اختبار الطباعة';
    const bytes = encodeForPrinter(text, 'windows1256');
    const questionMarks = [...bytes].filter((b) => b === 0x3f).length;
    assert.equal(questionMarks, 0, 'BiDi + logical Arabic must encode to W1256 bytes');
    assert.ok(bytes.length >= text.length, 'each Arabic letter should encode to one byte');
    const prepared = prepareArabicTextForEncoding(text, 'windows1256');
    assert.ok(!prepared.includes('\uFE8D'), 'presentation forms must not be used for W1256');
  });
});
