/**
 * Apply Tajawal as the default font for all Text / TextInput nodes.
 * Direction defaults follow APP_IS_RTL (ar → rtl, en/fr → ltr).
 */
import { Platform, Text, TextInput, type TextStyle } from 'react-native';
import { APP_IS_RTL } from '@/bootstrap/rtl';
import { textAlignStart } from '@/constants/layout';
import { fonts, resolveTajawalFontOnly } from '@/constants/fonts';
import { typography } from '@/constants/typography';

let directionDefaultsApplied = false;
let fontsApplied = false;

const WEB_FONT_FAMILY =
  'Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold, Tajawal, system-ui, sans-serif';
const WEB_FONT_ID = 'madar-tajawal-global';

type WithDefaultProps = { defaultProps?: { style?: TextStyle } };
const T = Text as typeof Text & WithDefaultProps;
const I = TextInput as typeof TextInput & WithDefaultProps;

function defaultDirectionTextStyle(): TextStyle {
  return {
    writingDirection: APP_IS_RTL ? 'rtl' : 'ltr',
    textAlign: textAlignStart.textAlign,
  };
}

function applyWebTypography() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  document.documentElement.style.fontFamily = WEB_FONT_FAMILY;
  document.body.style.fontFamily = WEB_FONT_FAMILY;
  const root = document.getElementById('root');
  if (root) root.style.fontFamily = WEB_FONT_FAMILY;

  const existing = document.getElementById(WEB_FONT_ID);
  if (existing) return;

  const style = document.createElement('style');
  style.id = WEB_FONT_ID;
  // Direction comes from html/body/root `dir` (applyWebDocumentDirection) — do not hard-lock RTL.
  style.textContent = `
    html, body, #root {
      font-family: ${WEB_FONT_FAMILY};
    }
    input, textarea, select, button {
      font-family: ${WEB_FONT_FAMILY};
    }
    [data-numeric="true"] {
      direction: ltr;
      unicode-bidi: embed;
    }
  `;
  document.head.appendChild(style);
}

/** Direction-aware text defaults — safe before fonts load. */
export function applyEarlyRtlDefaults() {
  if (directionDefaultsApplied) return;
  directionDefaultsApplied = true;

  const dirStyle = defaultDirectionTextStyle();
  T.defaultProps = { ...(T.defaultProps ?? {}), style: dirStyle };
  I.defaultProps = { ...(I.defaultProps ?? {}), style: { ...dirStyle, fontSize: typography.body } };

  applyWebTypography();
}

/** Full Tajawal defaults — call after fonts are loaded. */
export function applyGlobalTypography() {
  applyEarlyRtlDefaults();
  if (fontsApplied) return;
  fontsApplied = true;

  const defaultText: TextStyle = {
    ...resolveTajawalFontOnly(defaultDirectionTextStyle()),
  };
  const defaultInput: TextStyle = {
    ...resolveTajawalFontOnly({ fontSize: typography.body, ...defaultDirectionTextStyle() }, fonts.medium),
  };

  T.defaultProps = { ...(T.defaultProps ?? {}), style: defaultText };
  I.defaultProps = { ...(I.defaultProps ?? {}), style: defaultInput };
}
