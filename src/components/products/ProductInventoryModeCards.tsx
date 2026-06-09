import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { INVENTORY_MODE_HINTS } from './productFormLabels';
import { textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import type { InventoryMode } from '@/types/api';

const MODES: InventoryMode[] = ['stock_product', 'recipe_product', 'non_stock'];

type Props = {
  value: InventoryMode;
  onChange: (mode: InventoryMode) => void;
};

export function ProductInventoryModeCards({ value, onChange }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.list}>
      {MODES.map((mode) => {
        const hint = INVENTORY_MODE_HINTS[mode];
        const selected = value === mode;
        return (
          <Pressable
            key={mode}
            onPress={() => onChange(mode)}
            style={[styles.card, selected && styles.cardSelected]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons
                name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={20}
                color={selected ? c.accent : c.textMuted}
              />
              <Text style={[styles.title, selected && { color: c.accent }]}>{hint.title}</Text>
            </View>
            <Text style={styles.body}>{hint.body}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    list: { gap: spacing.sm },
    card: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
    },
    cardSelected: {
      borderColor: c.accentBorder,
      backgroundColor: c.softPrimary,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      ...textStart,
      flex: 1,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.text,
    },
    body: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.regular,
      color: c.textMuted,
      lineHeight: 18,
      paddingStart: spacing.xl,
    },
  });
}
