import React from 'react';
import { Pressable, View } from 'react-native';
import { useBranchStore } from '@/store/branchStore';
import { AppChip, AppText } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { flexRow, textStart } from '@/constants/layout';

type Props = {
  branchId: string;
  onChange: (branchId: string) => void;
  allowAll?: boolean;
};

export function ReportBranchFilter({ branchId, onChange, allowAll = true }: Props) {
  const c = useColors();
  const branches = useBranchStore((s) => s.branches);
  const viewMode = useBranchStore((s) => s.viewMode);

  if (viewMode !== 'global' && branches.length <= 1) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <AppText style={textStart}>الفرع</AppText>
      <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
        {allowAll ? (
          <AppChip label="جميع الفروع" active={!branchId} onPress={() => onChange('')} />
        ) : null}
        {branches.map((branch) => (
          <AppChip
            key={branch.id}
            label={branch.name}
            active={branchId === branch.id}
            onPress={() => onChange(branch.id)}
          />
        ))}
      </View>
      {viewMode === 'branch' && !branchId ? (
        <Pressable onPress={() => onChange(branches[0]?.id ?? '')}>
          <AppText style={{ color: c.warning, ...textStart, fontSize: 12 }}>يُستخدم الفرع النشط تلقائياً عند التطبيق</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
