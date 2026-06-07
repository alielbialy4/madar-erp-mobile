import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { ListScreenLayout } from '@/components/layout';
import { AppButton, AppDomainCard, AppSwipeRow } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { getPrinterProfiles, deletePrinterProfile } from '@/services/printing/printerProfiles';
import type { PrinterProfile } from '@/types/printing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';

type Props = NativeStackScreenProps<MoreStackParamList, 'PrinterProfiles'>;

export function PrinterProfilesScreen({ navigation }: Props) {
  const [profiles, setProfiles] = useState<PrinterProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProfiles(await getPrinterProfiles());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      void load();
    });
    void load();
    return unsub;
  }, [navigation, load]);

  return (
    <ListScreenLayout
      title="ملفات الطابعات"
      subtitle="Rongta / Xprinter شبكة — بلوتوث Android"
      onRefresh={load}
      refreshing={loading}
      fab={{ onPress: () => navigation.navigate('PrinterProfileForm', {}), label: 'إضافة طابعة' }}
      hero={{
        eyebrow: 'النظام',
        title: 'ملفات الطابعات',
        subtitle: 'Rongta / Xprinter شبكة — بلوتوث Android',
        stats: [{ label: 'الطابعات', value: profiles.length }],
        compact: true,
      }}
    >
      <ResourceList
        data={profiles}
        loading={loading}
        emptyTitle="لا توجد طابعات"
        emptyCtaLabel="إضافة طابعة"
        onEmptyCta={() => navigation.navigate('PrinterProfileForm', {})}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const card = (
            <AppDomainCard
              title={item.name}
              subtitle={`${item.role} · ${item.connection_type} · ${item.paper_width}${item.ip ? ` · ${item.ip}:${item.port}` : ''}`}
              badgeLabel={item.enabled ? undefined : 'معطّلة'}
              badgeTone={item.enabled ? undefined : 'warning'}
              leadingIcon="print"
              onPress={() => navigation.navigate('PrinterProfileForm', { id: item.id })}
            />
          );
          return (
            <AppSwipeRow
              rightActions={[
                { label: 'حذف', icon: 'delete', tone: 'danger', onPress: () => { void deletePrinterProfile(item.id).then(load); } },
              ]}
            >
              {card}
            </AppSwipeRow>
          );
        }}
      />
      <View style={{ gap: spacing.sm, paddingTop: spacing.md }}>
        <AppButton title="تشخيص الطباعة" variant="outline" onPress={() => navigation.navigate('PrinterDiagnostics')} />
        <AppButton title="قائمة انتظار الطباعة" variant="outline" onPress={() => navigation.navigate('PrintQueue')} />
      </View>
    </ListScreenLayout>
  );
}
