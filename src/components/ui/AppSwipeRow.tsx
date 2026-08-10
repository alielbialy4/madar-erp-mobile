import React, { useRef } from 'react';
import { Pressable, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { AppText } from './AppText';

type Action = {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  tone?: 'default' | 'danger';
  onPress: () => void;
};

type Props = {
  children: React.ReactNode;
  rightActions?: Action[];
  leftActions?: Action[];
};

function ActionButton({ action, align }: { action: Action; align: 'start' | 'end' }) {
  const c = useColors();
  const bg = action.tone === 'danger' ? c.danger : c.primary;
  return (
    <Pressable
      onPress={action.onPress}
      style={{
        backgroundColor: bg,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        borderRadius: radius.lg,
        marginStart: align === 'end' ? spacing.sm : 0,
        marginEnd: align === 'start' ? spacing.sm : 0,
        minWidth: 72,
      }}
      accessibilityLabel={action.label}
    >
      {action.icon ? <MaterialIcons name={action.icon} size={20} color={c.primaryForeground} /> : null}
      <AppText style={{ color: c.primaryForeground, fontFamily: fonts.bold, fontSize: 11, marginTop: 2 }}>{action.label}</AppText>
    </Pressable>
  );
}

export function AppSwipeRow({ children, rightActions, leftActions }: Props) {
  const ref = useRef<Swipeable>(null);

  const renderActions = (actions: Action[], align: 'start' | 'end') => (
    <View style={{ ...flexRow, alignItems: 'center', marginVertical: spacing.xs }}>
      {actions.map((action) => (
        <ActionButton key={action.label} action={action} align={align} />
      ))}
    </View>
  );

  return (
    <Swipeable
      ref={ref}
      friction={2}
      overshootFriction={8}
      renderRightActions={rightActions?.length ? () => renderActions(rightActions, 'end') : undefined}
      renderLeftActions={leftActions?.length ? () => renderActions(leftActions, 'start') : undefined}
      onSwipeableOpen={() => {
        // auto-close after action handled by caller
      }}
    >
      {children}
    </Swipeable>
  );
}
