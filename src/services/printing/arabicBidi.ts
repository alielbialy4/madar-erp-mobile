import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

/**
 * Applies Unicode BiDi visual reordering so RTL Arabic reads correctly on
 * LTR-only thermal firmware. Call after contextual shaping (reshaper).
 */
export function applyBidiVisualOrder(line: string, baseDirection: 'rtl' | 'ltr' = 'rtl'): string {
  if (!line) return line;

  const embeddingLevels = bidi.getEmbeddingLevels(line, baseDirection);
  const chars = [...line];

  const mirrored = bidi.getMirroredCharactersMap(line, embeddingLevels);
  mirrored.forEach((replacement, index) => {
    chars[index] = replacement;
  });

  const visual = chars.join('');
  const flips = bidi.getReorderSegments(visual, embeddingLevels);
  const arr = [...visual];

  for (const [start, end] of flips) {
    let left = start;
    let right = end;
    while (left < right) {
      const tmp = arr[left];
      arr[left] = arr[right];
      arr[right] = tmp;
      left += 1;
      right -= 1;
    }
  }

  return arr.join('');
}
