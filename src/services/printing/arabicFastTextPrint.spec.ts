import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildFastArabicTextBuffer,
  escPosSelectCodePageCommand,
} from './arabicFastTextPrint';
import { THERMAL_ARABIC_SELF_TEST_TABLE } from './codePageTables';

describe('arabicFastTextPrint', () => {
  it('escPosSelectCodePageCommand emits ESC t n', () => {
    assert.deepEqual(
      [...escPosSelectCodePageCommand(22)],
      [0x1b, 0x74, 0x16],
      'CP22 = PC864',
    );
    assert.deepEqual(
      [...escPosSelectCodePageCommand(17)],
      [0x1b, 0x74, 0x11],
      'CP17 = Arabic',
    );
  });

  it('buildFastArabicTextBuffer includes init, code page, Arabic bytes, cut', () => {
    const buf = buildFastArabicTextBuffer('اختبار الطباعة', {
      encoding: 'windows1256',
      codePageTableNumber: THERMAL_ARABIC_SELF_TEST_TABLE.windows1256,
    });
    assert.ok(buf.length > 10, 'buffer must not be empty');
    assert.equal(buf[0], 0x1b);
    assert.equal(buf[1], 0x40, 'ESC @ init');

    const cpIndex = buf.findIndex((b, i) => b === 0x74 && buf[i - 1] === 0x1b);
    assert.ok(cpIndex >= 0, 'ESC t code page command must be present');
    assert.equal(buf[cpIndex + 1], 17, 'windows1256 table 17');

    const hasCut = buf.includes(0x56) && buf.includes(0x1d);
    assert.ok(hasCut, 'GS V cut command expected');
  });

  it('cp864 mode selects table 22', () => {
    const buf = buildFastArabicTextBuffer('مرحبا', { encoding: 'cp864' });
    const cpIndex = buf.findIndex((b, i) => b === 0x74 && buf[i - 1] === 0x1b);
    assert.equal(buf[cpIndex + 1], 22);
  });
});
