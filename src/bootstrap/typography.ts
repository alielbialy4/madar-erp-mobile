/**
 * Apply Tajawal as the default font for all Text / TextInput nodes.
 * Loaded after useFonts succeeds (see FontProvider).
 */
import { Platform, Text, TextInput, type TextStyle } from 'react-native';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';

let applied = false;

export function applyGlobalTypography() {
  if (applied) return;
  applied = true;

  const defaultText: TextStyle = {
    fontFamily: fonts.regular,
    writingDirection: 'rtl',
  };

  const defaultInput: TextStyle = {
    fontFamily: fonts.medium,
    fontSize: typography.body,
    writingDirection: 'rtl',
  };

  type WithDefaultProps = { defaultProps?: { style?: TextStyle } };
  const T = Text as typeof Text & WithDefaultProps;
  const I = TextInput as typeof TextInput & WithDefaultProps;

  T.defaultProps = { ...T.defaultProps, style: defaultText };
  I.defaultProps = { ...I.defaultProps, style: defaultInput };

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const family = 'Tajawal, system-ui, sans-serif';
    document.documentElement.style.fontFamily = family;
    document.body.style.fontFamily = family;
    const root = document.getElementById('root');
    if (root) root.style.fontFamily = family;
  }
}
