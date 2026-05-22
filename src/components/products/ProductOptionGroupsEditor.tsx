import React from 'react';
import { Switch, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppButton, AppInput, AppSectionHeader, AppSelect } from '@/components/ui';
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

export function ProductOptionGroupsEditor({ value, onChange }: Props) {
  const c = useColors();
  const groups = value.length > 0 ? value : [];

  const updateGroup = (idx: number, patch: Partial<ProductOptionGroupInput>) => {
    onChange(groups.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  };

  return (
    <View style={{ gap: 12 }}>
      <AppSectionHeader
        title="مجموعات الخيارات"
        action={
          <AppButton title="إضافة مجموعة" size="sm" variant="secondary" onPress={() => onChange([...groups, newGroup()])} />
        }
      />
      {groups.length === 0 ? (
        <Text style={{ color: c.textMuted, textAlign: 'right' }}>لا توجد مجموعات خيارات</Text>
      ) : null}
      {groups.map((group, gi) => (
        <View key={gi} style={{ gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: c.text }}>إلزامي</Text>
            <Switch value={Boolean(group.is_required)} onValueChange={(is_required) => updateGroup(gi, { is_required })} />
          </View>
          {(group.options ?? []).map((opt, oi) => (
            <View key={oi} style={{ gap: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: c.borderSubtle }}>
              <AppInput
                label={`خيار ${oi + 1}`}
                value={opt.name}
                onChangeText={(name) => {
                  const options = [...(group.options ?? [])];
                  options[oi] = { ...options[oi], name };
                  updateGroup(gi, { options });
                }}
              />
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
            </View>
          ))}
          <AppButton
            title="إضافة خيار"
            size="sm"
            variant="outline"
            onPress={() => updateGroup(gi, { options: [...(group.options ?? []), newOption()] })}
          />
          <AppButton title="حذف المجموعة" size="sm" variant="danger" onPress={() => onChange(groups.filter((_, i) => i !== gi))} />
        </View>
      ))}
    </View>
  );
}
