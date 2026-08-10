import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { HEADER_CHROME } from '@/constants/headerChrome';
import { fonts } from '@/constants/fonts';
import { radius } from '@/constants/spacing';

type Props = {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  badge?: number;
  disabled?: boolean;
  selected?: boolean;
};

export function HeaderGhostIcon({ label, icon, onPress, badge, disabled, selected }: Props) {
  const c = useColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled), selected: Boolean(selected) }}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: pressed || selected ? c.surfaceMuted : 'transparent',
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      <MaterialIcons
        name={icon}
        size={HEADER_CHROME.actionIconSize}
        color={selected ? c.primarySoftForeground : c.text}
      />
      {badge ? (
        <View style={[styles.badge, { backgroundColor: c.danger, borderColor: c.surfaceHeader }]}>
          <AppText style={[styles.badgeText, { color: c.onPrimary }]}>
            {badge > 99 ? '99+' : badge}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: HEADER_CHROME.actionSize,
    height: HEADER_CHROME.actionSize,
    borderRadius: HEADER_CHROME.actionRadius,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    end: -2,
    minWidth: 16,
    height: 16,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 8, lineHeight: 10 },
});
