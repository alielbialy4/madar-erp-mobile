import React from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { reorderRulesAPI } from '@/api/reorderRules';
import { ResourceListScreen } from '@/components/inventory/ResourceListScreen';
import type { MoreStackParamList } from '@/types/navigation';
import { asText, numberText } from '@/utils/format';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'ReorderRulesList'>;

export function ReorderRulesListScreen({ navigation }: { navigation: Nav }) {
  return (
    <ResourceListScreen
      title="قواعد إعادة الطلب"
      subtitle="حدود إعادة التوريد لكل منتج."
      loader={(params) => reorderRulesAPI.list(params)}
      onBack={navigation.goBack}
      headerAction={{ label: 'قاعدة جديدة', onPress: () => navigation.navigate('ReorderRuleForm', {}) }}
      onItemPress={(row) => navigation.navigate('ReorderRuleForm', { id: Number(row.id) })}
      mapRow={(row) => {
        const product = row.product as Record<string, unknown> | undefined;
        return {
          title: asText(row.product_name ?? product?.name, 'منتج'),
          subtitle: `حد: ${numberText(row.threshold)} → إعادة إلى ${numberText(row.reorder_to)}`,
          badgeLabel: row.is_active === false ? 'معطّل' : 'نشط',
          badgeTone: row.is_active === false ? 'warning' : 'success',
          icon: 'rule',
        };
      }}
      emptyTitle="لا توجد قواعد"
    />
  );
}
