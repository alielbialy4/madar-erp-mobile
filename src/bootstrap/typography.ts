/**
 * Apply Tajawal as the default font for all Text / TextInput nodes.
 * RTL defaults apply immediately; Tajawal faces apply after useFonts (see FontProvider).
 */
import { Platform, Text, TextInput, type TextStyle } from 'react-native';
import { textAlignStart } from '@/constants/layout';
import { fonts, resolveTajawalFontOnly } from '@/constants/fonts';
import { typography } from '@/constants/typography';

let rtlDefaultsApplied = false;
let fontsApplied = false;

const WEB_FONT_FAMILY =
  'Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold, Tajawal, system-ui, sans-serif';
const WEB_FONT_ID = 'madar-tajawal-global';

type WithDefaultProps = { defaultProps?: { style?: TextStyle } };
const T = Text as typeof Text & WithDefaultProps;
const I = TextInput as typeof TextInput & WithDefaultProps;

function defaultRtlTextStyle(): TextStyle {
  return {
    writingDirection: 'rtl',
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
  style.textContent = `
    html, body, #root {
      font-family: ${WEB_FONT_FAMILY};
      direction: rtl;
    }
    input, textarea, select, button {
      font-family: ${WEB_FONT_FAMILY};
      direction: rtl;
    }
    [data-numeric="true"] {
      direction: ltr;
      unicode-bidi: embed;
    }
  `;
  document.head.appendChild(style);
}

/** RTL writing direction on all RN Text/TextInput — safe before fonts load. */
export function applyEarlyRtlDefaults() {
  if (rtlDefaultsApplied) return;
  rtlDefaultsApplied = true;

  const rtlOnly = defaultRtlTextStyle();
  T.defaultProps = { ...T.defaultProps, style: rtlOnly };
  I.defaultProps = { ...I.defaultProps, style: { ...rtlOnly, fontSize: typography.body } };

  applyWebTypography();
}

/** Full Tajawal defaults — call after fonts are loaded. */
export function applyGlobalTypography() {
  applyEarlyRtlDefaults();
  if (fontsApplied) return;
  fontsApplied = true;

  const defaultText: TextStyle = {
    ...resolveTajawalFontOnly(defaultRtlTextStyle()),
  };
  const defaultInput: TextStyle = {
    ...resolveTajawalFontOnly({ fontSize: typography.body, ...defaultRtlTextStyle() }, fonts.medium),
  };

  T.defaultProps = { ...T.defaultProps, style: defaultText };
  I.defaultProps = { ...I.defaultProps, style: defaultInput };
}
