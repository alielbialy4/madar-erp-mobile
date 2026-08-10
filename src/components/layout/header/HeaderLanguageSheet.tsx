import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppBottomSheet } from '@/components/layout/AppBottomSheet';
import { AppText } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { useLocaleStore } from '@/store/localeStore';
import { type AppLanguage } from '@/i18n/locale';
import { flexRow, textStart } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const OPTIONS: { code: AppLanguage; label: string; hint: string }[] = [
  { code: 'ar', label: 'العربية', hint: 'Arabic' },
  { code: 'en', label: 'English', hint: 'English' },
  { code: 'fr', label: 'Français', hint: 'French' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function HeaderLanguageSheet({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const language = useLocaleStore((s) => s.language);
  const setLanguage = useLocaleStore((s) => s.setLanguage);

  return (
    <AppBottomSheet visible={visible} onClose={onClose} title={t('Language')}>
      {OPTIONS.map((option) => {
        const selected = language === option.code;
        return (
          <Pressable
            key={option.code}
            onPress={() => {
              onClose();
              void setLanguage(option.code);
            }}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: selected ? c.primarySoftMuted : pressed ? c.surfaceMuted : 'transparent',
                borderColor: selected ? c.primarySoftBorder : 'transparent',
              },
            ]}
          >
            <View
              style={[
                styles.codeWell,
                {
                  backgroundColor: selected ? c.primarySoftStrong : c.surfaceMuted,
                  borderColor: selected ? c.primarySoftBorder : c.borderSubtle,
                },
              ]}
            >
              <AppText
                style={[
                  styles.code,
                  { color: selected ? c.primarySoftForeground : c.textMuted },
                ]}
              >
                {option.code.toUpperCase()}
              </AppText>
            </View>
            <View style={styles.copy}>
              <AppText style={[styles.label, { color: c.text }]}>{option.label}</AppText>
              <AppText style={[styles.hint, { color: c.textMuted }]}>{option.hint}</AppText>
            </View>
            {selected ? <MaterialIcons name="check" size={20} color={c.primarySoftForeground} /> : null}
          </Pressable>
        );
      })}
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  codeWell: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  code: { fontFamily: fonts.bold, fontSize: typography.caption },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  label: { ...textStart, fontFamily: fonts.medium, fontSize: typography.body },
  hint: { ...textStart, fontFamily: fonts.regular, fontSize: typography.caption },
});
