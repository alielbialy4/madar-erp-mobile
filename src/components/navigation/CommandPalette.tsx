import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppInput, AppText as Text } from '@/components/ui';
import { flexRow, textStart } from '@/constants/layout';
import type { AppColors } from '@/constants/colors';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { resolveSidebarIcon } from '@/constants/sidebarIcons';
import { filterNavCatalog, type NavCatalogEntry } from '@/navigation/navCatalog';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';
import { chevronForwardIcon } from '@/utils/rtl';

type Props = {
  visible: boolean;
  onClose: () => void;
  entries: NavCatalogEntry[];
  onSelect: (entry: NavCatalogEntry) => void;
};

export function CommandPalette({ visible, onClose, entries, onSelect }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const filtered = useMemo(() => filterNavCatalog(entries, query), [entries, query]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top + spacing.md }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>بحث سريع</Text>
          <Text style={styles.subtitle}>ابحث عن أي شاشة في النظام</Text>
          <AppInput
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث عن شاشة..."
            autoFocus
            returnKeyType="search"
          />
          <FlatList
            data={filtered.slice(0, 40)}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>لا توجد نتائج — جرّب كلمة أخرى</Text>
            }
            renderItem={({ item }) => (
              <PaletteRow
                entry={item}
                styles={styles}
                c={c}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              />
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

function PaletteRow({
  entry,
  onPress,
  styles,
  c,
}: {
  entry: NavCatalogEntry;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  c: AppColors;
}) {
  const icon = resolveSidebarIcon(entry.icon);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.rowIcon}>
        <MaterialIcons name={icon} size={20} color={c.accent} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{entry.label}</Text>
        <Text style={styles.rowSection}>{entry.section}</Text>
      </View>
      <MaterialIcons name={chevronForwardIcon()} size={20} color={c.textCaption} />
    </Pressable>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: c.overlay,
      paddingHorizontal: spacing.md,
    },
    sheet: {
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: spacing.lg,
      maxHeight: '78%',
      gap: spacing.sm,
    },
    title: {
      ...textStart,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
    },
    subtitle: {
      ...textStart,
      fontSize: typography.tiny,
      color: c.textMuted,
      marginBottom: spacing.xs,
    },
    list: { marginTop: spacing.sm },
    row: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    rowPressed: { backgroundColor: c.surfaceMuted },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.lg,
      backgroundColor: c.softPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: { flex: 1, gap: 2 },
    rowLabel: {
      ...textStart,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.text,
    },
    rowSection: {
      ...textStart,
      fontSize: typography.tiny,
      color: c.textMuted,
    },
    empty: {
      ...textStart,
      textAlign: 'center',
      padding: spacing.xl,
      color: c.textMuted,
    },
  });
}

export type { SidebarNavAction };
