import i18n from '@/i18n';
import ar from '@/i18n/locales/ar.json';
import en from '@/i18n/locales/en.json';

const enCatalog = en as Record<string, string>;

let arabicToKey: Map<string, string> | null = null;

function hasArabic(value: string): boolean {
  return /[\u0600-\u06FF]/.test(value);
}

function normalizeArabicLabel(value: string): string {
  return value
    .replace(/[\u064B-\u065F\u0670]/g, '') // tashkeel
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\s\.…؟!,:;]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Higher is better — prefer real web keys with proper EN over mobile.scan / Arabic keys. */
function scoreKey(key: string): number {
  let score = 0;
  if (/^(nav|auth|header|dashboard|settings|common|labels|ui)\./.test(key)) score += 120;
  if (/^[A-Za-z]/.test(key) && !key.startsWith('mobile.')) score += 60;
  if (key.startsWith('mobile.scan.')) score -= 90;
  if (key.startsWith('mobile.')) score -= 20;
  if (hasArabic(key)) score -= 140;
  const enValue = enCatalog[key];
  if (typeof enValue === 'string' && enValue.trim()) {
    score += hasArabic(enValue) ? -70 : 50;
  }
  score -= Math.min(key.length, 80) * 0.02;
  return score;
}

function buildArabicIndex(): Map<string, string> {
  const map = new Map<string, string>();
  const candidates = new Map<string, string[]>();

  const add = (lookup: string, key: string) => {
    if (!lookup) return;
    const list = candidates.get(lookup) ?? [];
    list.push(key);
    candidates.set(lookup, list);
  };

  for (const [key, value] of Object.entries(ar as Record<string, string>)) {
    if (typeof value !== 'string' || !value.trim()) continue;
    if (!hasArabic(value)) continue;
    add(value.trim(), key);
    add(normalizeArabicLabel(value), key);
  }

  for (const [value, keys] of candidates) {
    const ranked = [...keys].sort((a, b) => scoreKey(b) - scoreKey(a));
    map.set(value, ranked[0]!);
  }
  return map;
}

function activeLang(): string {
  return (i18n.language || 'ar').split('-')[0] || 'ar';
}

function translatedValue(key: string): string {
  const out = i18n.t(key, { defaultValue: '' });
  return typeof out === 'string' ? out : String(out ?? '');
}

/** True when this key yields a usable string for the active language. */
function keyWorksForLang(key: string): boolean {
  const lang = activeLang();
  const value = translatedValue(key);
  if (!value || value === key) return false;
  if (lang !== 'ar' && hasArabic(value)) return false;
  return true;
}

function resolveKey(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  if (!arabicToKey) arabicToKey = buildArabicIndex();

  const fromIndex =
    arabicToKey.get(text) ?? arabicToKey.get(normalizeArabicLabel(text)) ?? null;

  // Arabic-as-key entries often still hold Arabic in EN/FR — don't prefer them blindly.
  if (i18n.exists(text) && keyWorksForLang(text)) {
    return text;
  }

  if (fromIndex && keyWorksForLang(fromIndex)) {
    return fromIndex;
  }

  if (fromIndex) return fromIndex;
  if (i18n.exists(text)) return text;
  return null;
}

/**
 * Translate a UI string like the web: prefer i18n keys; also resolve
 * hardcoded Arabic that already exists in the shared locale dictionary.
 */
export function tu(input: string, options?: Record<string, unknown>): string {
  const key = resolveKey(input);
  if (!key) return input;
  const out = i18n.t(key, options);
  if (typeof out !== 'string') return String(out ?? input);
  // Last resort: if EN/FR still Arabic, keep looking via normalized reverse index only once.
  if (activeLang() !== 'ar' && hasArabic(out) && hasArabic(input)) {
    if (!arabicToKey) arabicToKey = buildArabicIndex();
    const alt = arabicToKey.get(normalizeArabicLabel(input));
    if (alt && alt !== key && keyWorksForLang(alt)) {
      const altOut = i18n.t(alt, options);
      if (typeof altOut === 'string' && !hasArabic(altOut)) return altOut;
    }
  }
  return out;
}

/** Drop cached reverse index after locale packs hot-reload in dev. */
export function resetTuCache(): void {
  arabicToKey = null;
}
