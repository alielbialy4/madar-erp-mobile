import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { ListScreenLayout } from '@/components/layout';
import { AppSwipeRow, AppText as Text } from '@/components/ui';
import { DenseRow } from '@/components/madar';
import { AppBadge } from '@/components/ui/AppBadge';
import { ResourceList } from '@/components/lists';
import { roleLabel, connectionLabel } from '@/constants/printerFormOptions';
import {
  deletePrinterProfile,
  getPrinterProfilesStrict,
  migrateLegacyProfilesToBranch,
  migratePrinterEncodingV2,
} from '@/services/printing/printerProfiles';
import { useBranchStore } from '@/store/branchStore';
import type { PrinterProfile } from '@/types/printing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

type Props = NativeStackScreenProps<MoreStackParamList, 'PrinterProfiles'>;

export function PrinterProfilesScreen({ navigation, route }: Props) {
  const routeBranchId = route.params?.branchId;
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const branchId = routeBranchId ?? activeBranch?.id ?? '';
  const c = useColors();
  const [profiles, setProfiles] = useState<PrinterProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!branchId) {
      setProfiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      await migrateLegacyProfilesToBranch(branchId);
      await migratePrinterEncodingV2();
      setProfiles(await getPrinterProfilesStrict(branchId));
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  React.useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      void load();
    });
    void load();
    return unsub;
  }, [navigation, load]);

  const branchMismatch = routeBranchId && activeBranch?.id && routeBranchId !== activeBranch.id;

  if (!branchId) {
    return (
      <ListScreenLayout title="طابعات الفرع" onBack={navigation.goBack}>
        <Text style={{ color: c.textMuted }}>اختر فرعاً من قائمة الفروع أولاً.</Text>
      </ListScreenLayout>
    );
  }

  return (
    <ListScreenLayout
      title="طابعات الفرع"
      subtitle={branchMismatch ? 'POS يعمل على فرع آخر' : undefined}
      onBack={navigation.goBack}
      onRefresh={load}
      refreshing={loading}
      fab={{
        onPress: () => navigation.navigate('PrinterProfileForm', { branchId }),
        label: 'إضافة طابعة',
      }}
      hero={{
        eyebrow: 'الفرع',
        title: 'طابعات الفرع',
        stats: [{ label: 'الطابعات', value: profiles.length }],
        compact: true,
      }}
    >
      {branchMismatch ? (
        <View style={{ marginBottom: spacing.sm, padding: spacing.sm, backgroundColor: c.surfaceMuted, borderRadius: 8 }}>
          <Text style={{ color: c.warning }}>
            أنت تعدّل طابعات فرع مختلف عن الفرع النشط في POS ({activeBranch?.name}).
          </Text>
        </View>
      ) : null}
      <ResourceList
        data={profiles}
        loading={loading}
        emptyTitle="لا توجد طابعات لهذا الفرع"
        emptyCtaLabel="إضافة طابعة"
        onEmptyCta={() => navigation.navigate('PrinterProfileForm', { branchId })}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const card = (
            <DenseRow
              primary={item.name}
              secondary={`${roleLabel(item.role)} · ${connectionLabel(item.connection_type)} · ${item.paper_width}${item.ip ? ` · ${item.ip}:${item.port}` : ''}`}
              status={item.enabled ? undefined : <AppBadge label="معطّلة" tone="warning" />}
              onPress={() => navigation.navigate('PrinterProfileForm', { id: item.id, branchId })}
            />
          );
          return (
            <AppSwipeRow
              rightActions={[
                {
                  label: 'حذف',
                  icon: 'delete',
                  tone: 'danger',
                  onPress: () => {
                    void deletePrinterProfile(item.id).then(load);
                  },
                },
              ]}
            >
              {card}
            </AppSwipeRow>
          );
        }}
      />
    </ListScreenLayout>
  );
}
