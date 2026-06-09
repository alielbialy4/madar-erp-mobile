/**
 * RTL bootstrap — must load before any UI (imported first from App.tsx).
 * Arabic-only app: forceRTL for layout mirroring + document direction on web.
 */
import { I18nManager, Platform } from 'react-native';

export const APP_IS_RTL = true;

function applyWebDocumentRtl() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const html = document.documentElement;
  const body = document.body;
  html.setAttribute('dir', 'rtl');
  html.setAttribute('lang', 'ar');
  body?.setAttribute('dir', 'rtl');
  const root = document.getElementById('root');
  root?.setAttribute('dir', 'rtl');
}

function applyNativeRtl() {
  I18nManager.allowRTL(true);
  if (!I18nManager.isRTL) {
    I18nManager.forceRTL(true);
  }
  // Do not enable swapLeftAndRightInRTL — stacks with forceRTL on some builds.
}

applyNativeRtl();
applyWebDocumentRtl();
