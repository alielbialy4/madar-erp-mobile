import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { useImmersiveStore } from '@/store/immersiveStore';
import { HEADER_CHROME } from '@/constants/headerChrome';
import { elevation } from '@/constants/elevation';
import { radius, spacing } from '@/constants/spacing';

export function ImmersiveExitChip() {
  const { t } = useTranslation();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const enabled = useImmersiveStore((s) => s.enabled);
  const setEnabled = useImmersiveStore((s) => s.setEnabled);

  if (!enabled) return null;

  return (
    <Pressable
      onPress={() => setEnabled(false)}
      accessibilityRole="button"
      accessibilityLabel={t('header.exitFullscreen')}
      style={({ pressed }) => [
        styles.chip,
        {
          top: Math.max(insets.top, spacing.sm) + spacing.xs,
          backgroundColor: c.surface,
          borderColor: c.borderSubtle,
          opacity: pressed ? 0.85 : 1,
        },
        elevation(c, 'md'),
      ]}
    >
      <MaterialIcons name="fullscreen-exit" size={22} color={c.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    position: 'absolute',
    end: spacing.md,
    zIndex: 100,
    width: HEADER_CHROME.immersiveChipSize,
    height: HEADER_CHROME.immersiveChipSize,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
