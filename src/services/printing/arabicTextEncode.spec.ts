import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { encodeForPrinter } from './arabicTextEncode';

describe('arabicTextEncode', () => {
  it('windows1256 must not emit question marks for logical Arabic', () => {
    const text = 'اختبار الطباعة';
    const bytes = encodeForPrinter(text, 'windows1256');
    const questionMarks = [...bytes].filter((b) => b === 0x3f).length;
    assert.equal(questionMarks, 0, 'presentation-form shaping must not be applied for W1256');
    assert.ok(bytes.length >= text.length, 'each Arabic letter should encode to one byte');
  });
});
