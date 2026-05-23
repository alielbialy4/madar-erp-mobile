/**
 * Apply Tajawal as the default font for all Text / TextInput nodes.
 * Loaded after useFonts succeeds (see FontProvider).
 */
import { Platform, Text, TextInput, type TextStyle } from 'react-native';
import { fonts, resolveTajawalStyle } from '@/constants/fonts';
import { typography } from '@/constants/typography';

let applied = false;

const WEB_FONT_FAMILY =
  'Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold, Tajawal, system-ui, sans-serif';
const WEB_FONT_ID = 'madar-tajawal-global';

function applyWebTypography() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  document.documentElement.style.fontFamily = WEB_FONT_FAMILY;
  document.body.style.fontFamily = WEB_FONT_FAMILY;
  const root = document.getElementById('root');
  if (root) root.style.fontFamily = WEB_FONT_FAMILY;

  if (document.getElementById(WEB_FONT_ID)) return;

  const style = document.createElement('style');
  style.id = WEB_FONT_ID;
  style.textContent = `
    html, body, #root {
      font-family: ${WEB_FONT_FAMILY};
    }
    input, textarea, select, button {
      font-family: ${WEB_FONT_FAMILY};
    }
  `;
  document.head.appendChild(style);
}

export function applyGlobalTypography() {
  if (applied) return;
  applied = true;

  const defaultText: TextStyle = resolveTajawalStyle({ writingDirection: 'rtl' });

  const defaultInput: TextStyle = {
    ...resolveTajawalStyle({ fontSize: typography.body, writingDirection: 'rtl' }, fonts.medium),
  };

  type WithDefaultProps = { defaultProps?: { style?: TextStyle } };
  const T = Text as typeof Text & WithDefaultProps;
  const I = TextInput as typeof TextInput & WithDefaultProps;

  T.defaultProps = { ...T.defaultProps, style: defaultText };
  I.defaultProps = { ...I.defaultProps, style: defaultInput };

  applyWebTypography();
}
