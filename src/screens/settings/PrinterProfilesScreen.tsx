import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { getPrinterProfiles, deletePrinterProfile } from '@/services/printing/printerProfiles';
import type { PrinterProfile } from '@/types/printing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<MoreStackParamList, 'PrinterProfiles'>;

export function PrinterProfilesScreen({ navigation }: Props) {
  const [profiles, setProfiles] = useState<PrinterProfile[]>([]);

  const load = useCallback(async () => {
    setProfiles(await getPrinterProfiles());
  }, []);

  React.useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      void load();
    });
    void load();
    return unsub;
  }, [navigation, load]);

  return (
    <AppScreen title="ملفات الطابعات" subtitle="Rongta / Xprinter شبكة — بلوتوث Android">
      <AppButton title="إضافة طابعة" onPress={() => navigation.navigate('PrinterProfileForm', {})} fullWidth />
      <AppCard>
        <AppSectionHeader title="القائمة" />
        {profiles.length === 0 ? (
          <AppListItem title="لا توجد طابعات" subtitle="أضف طابعة شبكة Ethernet (منفذ 9100) للبدء" />
        ) : (
          profiles.map((p) => (
            <AppListItem
              key={p.id}
              title={p.name}
              subtitle={`${p.role} · ${p.connection_type} · ${p.paper_width}${p.ip ? ` · ${p.ip}:${p.port}` : ''}`}
              badge={p.enabled ? undefined : <AppBadge label="معطّلة" tone="warning" />}
              onPress={() => navigation.navigate('PrinterProfileForm', { id: p.id })}
              onLongPress={async () => {
                await deletePrinterProfile(p.id);
                await load();
              }}
            />
          ))
        )}
      </AppCard>
      <View style={{ gap: 8 }}>
        <AppButton title="تشخيص الطباعة" variant="outline" onPress={() => navigation.navigate('PrinterDiagnostics')} />
        <AppButton title="قائمة انتظار الطباعة" variant="outline" onPress={() => navigation.navigate('PrintQueue')} />
      </View>
    </AppScreen>
  );
}
