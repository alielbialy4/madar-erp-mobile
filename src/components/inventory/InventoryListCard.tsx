import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { createInventoryUiStyles } from '@/components/inventory/inventoryUiStyles';
import { chevronForwardIcon } from '@/utils/rtl';
import type { InventoryCardModel } from './inventoryRowUtils';

type Props = InventoryCardModel & {
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress?: () => void;
};

export function InventoryListCard({ title, subtitle, meta, badgeLabel, badgeTone, icon = 'inventory-2', onPress }: Props) {
  const c = useColors();
  const styles = useMemo(() => createCategoryStyles(c), [c]);
  const ui = useMemo(() => createInventoryUiStyles(c), [c]);

  const body = (
    <View style={styles.categoryCard}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.cardPressable, pressed && onPress && { opacity: 0.92 }]}
      >
        <View style={styles.cardTop}>
          <View style={styles.thumbPlaceholder}>
            <MaterialIcons name={icon} size={28} color={c.textCaption} />
          </View>
          <View style={styles.cardBody}>
            <View style={ui.badgeTitleRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {title}
              </Text>
              {badgeLabel ? <AppBadge label={badgeLabel} tone={badgeTone ?? 'default'} /> : null}
            </View>
            {subtitle ? (
              <Text style={styles.cardDesc} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
            {meta ? <Text style={styles.cardMeta}>{meta}</Text> : null}
          </View>
          {onPress ? <MaterialIcons name={chevronForwardIcon()} size={22} color={c.textCaption} /> : null}
        </View>
      </Pressable>
    </View>
  );

  return body;
}
