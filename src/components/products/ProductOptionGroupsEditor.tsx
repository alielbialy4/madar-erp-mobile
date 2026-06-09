import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { OPTION_GROUPS_HELPER_AR } from './productFormLabels';
import { flexRow } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import type { ProductOptionGroupInput, ProductOptionInput } from '@/types/api';
import { useColors } from '@/hooks/useColors';

type Props = {
  value: ProductOptionGroupInput[];
  onChange: (next: ProductOptionGroupInput[]) => void;
};

const newOption = (): ProductOptionInput => ({ name: '', price: 0, is_active: true });
const newGroup = (): ProductOptionGroupInput => ({
  title: '',
  selection_type: 'single',
  pricing_type: 'free',
  is_required: false,
  is_active: true,
  options: [newOption()],
});

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function ProductOptionGroupsEditor({ value, onChange }: Props) {
  const c = useColors();
  const groups = value.length > 0 ? value : [];
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const updateGroup = (idx: number, patch: Partial<ProductOptionGroupInput>) => {
    onChange(groups.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  };

  const addGroup = () => {
    const next = [...groups, newGroup()];
    onChange(next);
    setExpandedIndex(next.length - 1);
  };

  return (
    <View style={{ gap: spacing.md }}>
      <Text style={{ color: c.textMuted, fontSize: typography.tiny, textAlign: 'right' }}>{OPTION_GROUPS_HELPER_AR}</Text>
      <View style={{ ...flexRow, justifyContent: 'flex-end' }}>
        <AppButton title="إضافة مجموعة" size="sm" variant="secondary" onPress={addGroup} />
      </View>
      {groups.length === 0 ? (
        <Text style={{ color: c.textMuted, textAlign: 'right' }}>لا توجد مجموعات خيارات</Text>
      ) : null}
      {groups.map((group, gi) => {
        const expanded = expandedIndex === gi;
        const groupLabel = group.title.trim() || `مجموعة ${gi + 1}`;
        return (
        <View key={gi} style={{ gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: c.borderSubtle }}>
          <Pressable
            onPress={() => setExpandedIndex(expanded ? null : gi)}
            style={{ ...flexRow, alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: c.text, fontFamily: 'Tajawal-Bold', textAlign: 'right' }}>{groupLabel}</Text>
              <Text style={{ color: c.textMuted, fontSize: typography.tiny, textAlign: 'right' }}>
                {(group.options ?? []).length} خيار · {group.selection_type === 'multiple' ? 'متعدد' : 'واحد'}
              </Text>
            </View>
            <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={22} color={c.textMuted} />
          </Pressable>
          {expanded ? (
          <>
          <View style={{ ...flexRow, alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs }}>
              <Pressable onPress={() => onChange(moveItem(groups, gi, gi - 1))} disabled={gi === 0} style={{ opacity: gi === 0 ? 0.3 : 1 }}>
                <MaterialIcons name="arrow-upward" size={20} color={c.textMuted} />
              </Pressable>
              <Pressable onPress={() => onChange(moveItem(groups, gi, gi + 1))} disabled={gi === groups.length - 1} style={{ opacity: gi === groups.length - 1 ? 0.3 : 1 }}>
                <MaterialIcons name="arrow-downward" size={20} color={c.textMuted} />
              </Pressable>
          </View>
          <AppInput label="عنوان المجموعة" value={group.title} onChangeText={(title) => updateGroup(gi, { title })} />
          <AppSelect
            label="نوع الاختيار"
            value={group.selection_type}
            options={[
              { label: 'واحد', value: 'single' },
              { label: 'متعدد', value: 'multiple' },
            ]}
            onChange={(selection_type) => updateGroup(gi, { selection_type: selection_type as 'single' | 'multiple' })}
          />
          <AppSelect
            label="التسعير"
            value={group.pricing_type}
            options={[
              { label: 'مجاني', value: 'free' },
              { label: 'لكل خيار', value: 'per_option' },
              { label: 'سعر المجموعة', value: 'group_price' },
            ]}
            onChange={(pricing_type) => updateGroup(gi, { pricing_type: pricing_type as ProductOptionGroupInput['pricing_type'] })}
          />
          {group.pricing_type === 'group_price' ? (
            <AppInput
              label="سعر المجموعة"
              value={String(group.group_price ?? '')}
              onChangeText={(t) => updateGroup(gi, { group_price: Number(t) || 0 })}
              keyboardType="decimal-pad"
            />
          ) : null}
          {group.selection_type === 'multiple' ? (
            <View style={{ ...flexRow, gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="الحد الأدنى"
                  value={String(group.min_selections ?? '')}
                  onChangeText={(t) => updateGroup(gi, { min_selections: t ? Number(t) : null })}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="الحد الأقصى"
                  value={String(group.max_selections ?? '')}
                  onChangeText={(t) => updateGroup(gi, { max_selections: t ? Number(t) : null })}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          ) : null}
          <View style={{ ...flexRow, alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: c.text }}>إلزامي</Text>
            <Switch value={Boolean(group.is_required)} onValueChange={(is_required) => updateGroup(gi, { is_required })} />
          </View>
          <View style={{ ...flexRow, alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: c.text }}>نشط</Text>
            <Switch value={group.is_active !== false} onValueChange={(is_active) => updateGroup(gi, { is_active })} />
          </View>
          {(group.options ?? []).map((opt, oi) => (
            <View key={oi} style={{ gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: c.borderSubtle }}>
              <View style={{ ...flexRow, alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: c.textMuted }}>خيار {oi + 1}</Text>
                <View style={{ ...flexRow, gap: spacing.xs }}>
                  <Pressable
                    onPress={() => {
                      const options = moveItem(group.options ?? [], oi, oi - 1);
                      updateGroup(gi, { options });
                    }}
                    disabled={oi === 0}
                  >
                    <MaterialIcons name="arrow-upward" size={18} color={c.textMuted} />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const options = moveItem(group.options ?? [], oi, oi + 1);
                      updateGroup(gi, { options });
                    }}
                    disabled={oi === (group.options?.length ?? 0) - 1}
                  >
                    <MaterialIcons name="arrow-downward" size={18} color={c.textMuted} />
                  </Pressable>
                </View>
              </View>
              <AppInput
                label="اسم الخيار"
                value={opt.name}
                onChangeText={(name) => {
                  const options = [...(group.options ?? [])];
                  options[oi] = { ...options[oi], name };
                  updateGroup(gi, { options });
                }}
              />
              {group.pricing_type === 'per_option' ? (
                <AppInput
                  label="السعر"
                  value={String(opt.price ?? 0)}
                  onChangeText={(t) => {
                    const options = [...(group.options ?? [])];
                    options[oi] = { ...options[oi], price: Number(t) || 0 };
                    updateGroup(gi, { options });
                  }}
                  keyboardType="decimal-pad"
                />
              ) : null}
              <View style={{ ...flexRow, alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: c.text }}>نشط</Text>
                <Switch
                  value={opt.is_active !== false}
                  onValueChange={(is_active) => {
                    const options = [...(group.options ?? [])];
                    options[oi] = { ...options[oi], is_active };
                    updateGroup(gi, { options });
                  }}
                />
              </View>
              {(group.options?.length ?? 0) > 1 ? (
                <AppButton
                  title="حذف الخيار"
                  size="sm"
                  variant="outline"
                  onPress={() => updateGroup(gi, { options: (group.options ?? []).filter((_, i) => i !== oi) })}
                />
              ) : null}
            </View>
          ))}
          <AppButton
            title="إضافة خيار"
            size="sm"
            variant="outline"
            onPress={() => updateGroup(gi, { options: [...(group.options ?? []), newOption()] })}
          />
          <AppButton title="حذف المجموعة" size="sm" variant="danger" onPress={() => {
            onChange(groups.filter((_, i) => i !== gi));
            if (expandedIndex === gi) setExpandedIndex(null);
          }} />
          </>
          ) : null}
        </View>
      );
      })}
    </View>
  );
}
