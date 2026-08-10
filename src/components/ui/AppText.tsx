import React from 'react';
import { Platform, StyleSheet, Text as RNText, TextProps, TextStyle, type StyleProp } from 'react-native';
import { appWritingDirection, textAlignEnd, textAlignStart, textCenter, textLtr } from '@/constants/layout';
import { resolveTajawalFontOnly } from '@/constants/fonts';
import { useTu } from '@/i18n/useTu';

type TextAlignProp = 'start' | 'end' | 'center';

type AppTextProps = TextProps & {
  numeric?: boolean;
  align?: TextAlignProp;
  /** When true (default), translate string children via locale dictionary. */
  translate?: boolean;
};

function alignmentForProp(align: TextAlignProp): TextStyle {
  switch (align) {
    case 'center':
      return textCenter;
    case 'end':
      return textAlignEnd;
    default:
      return textAlignStart;
  }
}

function translateNode(
  node: React.ReactNode,
  tx: (s: string) => string,
  enabled: boolean,
): React.ReactNode {
  if (!enabled || node == null || typeof node === 'boolean') return node;
  if (typeof node === 'string') return tx(node);
  if (typeof node === 'number') return node;
  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <React.Fragment key={index}>{translateNode(child, tx, enabled)}</React.Fragment>
    ));
  }
  return node;
}

export function AppText({ style, numeric, align, translate = true, children, ...props }: AppTextProps) {
  const tx = useTu();
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const fontStyle = resolveTajawalFontOnly(style as StyleProp<TextStyle>);

  const writingDirection =
    flat?.writingDirection ?? (numeric ? 'ltr' : appWritingDirection);

  const trailingStyle: TextStyle | undefined = (() => {
    if (align != null) return alignmentForProp(align);
    if (numeric) return flat?.textAlign == null ? textLtr : undefined;
    if (flat?.textAlign === 'center') return undefined;
    // Physical left/right in caller styles win; otherwise use logical start.
    if (flat?.textAlign === 'left' || flat?.textAlign === 'right') return undefined;
    return textAlignStart;
  })();

  const webNumericAttrs =
    Platform.OS === 'web' && numeric
      ? ({ dataSet: { numeric: 'true' } } as TextProps)
      : undefined;

  const content = translateNode(children, tx, translate && !numeric);

  return (
    <RNText
      {...props}
      {...webNumericAttrs}
      style={[fontStyle, { writingDirection }, trailingStyle]}
    >
      {content}
    </RNText>
  );
}

export const Text = AppText;

export { fonts as appFonts } from '@/constants/fonts';
