/**
 * RTL bootstrap — must load before any UI (imported first from App.tsx).
 * Direction follows the persisted app language (ar → RTL, en/fr → LTR).
 * Locale hydration may call forceRTL + reload when direction must change.
 */
import { I18nManager, Platform } from 'react-native';

I18nManager.allowRTL(true);

/** After reload, mirrors I18nManager; default Arabic expect RTL until hydrate/reload. */
export const APP_IS_RTL = I18nManager.isRTL;

export function getAppIsRtl(): boolean {
  return I18nManager.isRTL;
}

export function applyWebDocumentDirection(language: string, rtl: boolean) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const html = document.documentElement;
  const body = document.body;
  const dir = rtl ? 'rtl' : 'ltr';
  html.setAttribute('dir', dir);
  html.setAttribute('lang', language);
  body?.setAttribute('dir', dir);
  const root = document.getElementById('root');
  root?.setAttribute('dir', dir);
}

/** Ensure native RTL flag matches language; returns true if a reload is required. */
export function ensureNativeRtl(rtl: boolean): boolean {
  I18nManager.allowRTL(true);
  if (I18nManager.isRTL === rtl) return false;
  I18nManager.forceRTL(rtl);
  return true;
}
