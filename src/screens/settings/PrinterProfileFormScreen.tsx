import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppInput, AppSectionHeader } from '@/components/ui';
import { spacing } from '@/constants/spacing';
import { getPrinterProfile, upsertPrinterProfile } from '@/services/printing/printerProfiles';
import { getConnectionCapability, recommendedConnectionForPlatform } from '@/services/printing/printerCapabilities';
import type { PrinterConnectionType, PrinterProfile, PrinterRole, PaperWidth, EscPosEncoding } from '@/types/printing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<MoreStackParamList, 'PrinterProfileForm'>;

const ROLES: PrinterRole[] = ['cashier', 'kitchen', 'bar', 'shift', 'report'];
const CONNECTIONS: PrinterConnectionType[] = ['network_tcp', 'bluetooth_android', 'airprint_ios', 'disabled'];
const WIDTHS: PaperWidth[] = ['58mm', '80mm'];
const ENCODINGS: EscPosEncoding[] = ['cp864', 'cp720', 'windows1256', 'utf8_image'];

export function PrinterProfileFormScreen({ navigation, route }: Props) {
  const id = route.params?.id;
  const [name, setName] = useState('');
  const [role, setRole] = useState<PrinterRole>('cashier');
  const [connectionType, setConnectionType] = useState<PrinterConnectionType>(recommendedConnectionForPlatform());
  const [paperWidth, setPaperWidth] = useState<PaperWidth>('80mm');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('9100');
  const [bluetoothAddress, setBluetoothAddress] = useState('');
  const [encoding, setEncoding] = useState<EscPosEncoding>('cp864');
  const [charsPerLine, setCharsPerLine] = useState('48');
  const [cutPaper, setCutPaper] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    void getPrinterProfile(id).then((p) => {
      if (!p) return;
      setName(p.name);
      setRole(p.role);
      setConnectionType(p.connection_type);
      setPaperWidth(p.paper_width);
      setIp(p.ip ?? '');
      setPort(String(p.port));
      setBluetoothAddress(p.bluetoothAddress ?? '');
      setEncoding(p.encoding);
      setCharsPerLine(String(p.characters_per_line));
      setCutPaper(p.cut_paper);
      setEnabled(p.enabled);
    });
  }, [id]);

  const cap = getConnectionCapability(connectionType);

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const profile: Partial<PrinterProfile> & { name: string; role: PrinterRole } = {
        id,
        name: name.trim() || 'طابعة',
        role,
        connection_type: connectionType,
        paper_width: paperWidth,
        ip: ip.trim() || undefined,
        port: parseInt(port, 10) || 9100,
        bluetoothAddress: bluetoothAddress.trim() || undefined,
        encoding,
        characters_per_line: parseInt(charsPerLine, 10) || (paperWidth === '58mm' ? 32 : 48),
        cut_paper: cutPaper,
        enabled,
        mode: 'escpos_text',
      };
      await upsertPrinterProfile(profile);
      navigation.goBack();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'تعذر الحفظ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen title={id ? 'تعديل طابعة' : 'طابعة جديدة'}>
      <View style={{ gap: spacing.md, paddingBottom: spacing.xxl }}>
        <AppCard>
          <AppSectionHeader title="أساسي" />
          <AppInput label="الاسم" value={name} onChangeText={setName} />
          <AppInput label="الدور (cashier/kitchen/bar/shift/report)" value={role} onChangeText={(t) => setRole((ROLES.includes(t as PrinterRole) ? t : role) as PrinterRole)} />
          <AppInput label="الاتصال" value={connectionType} onChangeText={(t) => setConnectionType((CONNECTIONS.includes(t as PrinterConnectionType) ? t : connectionType) as PrinterConnectionType)} />
          {!cap.supported && cap.reasonAr ? (
            <AppInput label="تنبيه" value={cap.reasonAr} editable={false} />
          ) : null}
          <AppInput label="عرض الورق (58mm/80mm)" value={paperWidth} onChangeText={(t) => setPaperWidth((WIDTHS.includes(t as PaperWidth) ? t : paperWidth) as PaperWidth)} />
          <AppInput label="مفعّلة (true/false)" value={String(enabled)} onChangeText={(t) => setEnabled(t !== 'false')} />
        </AppCard>
        <AppCard>
          <AppSectionHeader title="شبكة Ethernet" />
          <AppInput label="IP" value={ip} onChangeText={setIp} placeholder="192.168.1.100" />
          <AppInput label="Port" value={port} onChangeText={setPort} keyboardType="numeric" />
        </AppCard>
        <AppCard>
          <AppSectionHeader title="بلوتوث Android" />
          <AppInput label="MAC Address" value={bluetoothAddress} onChangeText={setBluetoothAddress} />
        </AppCard>
        <AppCard>
          <AppSectionHeader title="ESC/POS" />
          <AppInput label="Encoding" value={encoding} onChangeText={(t) => setEncoding((ENCODINGS.includes(t as EscPosEncoding) ? t : encoding) as EscPosEncoding)} />
          <AppInput label="أحرف في السطر" value={charsPerLine} onChangeText={setCharsPerLine} keyboardType="numeric" />
          <AppInput label="قص الورق" value={String(cutPaper)} onChangeText={(t) => setCutPaper(t !== 'false')} />
        </AppCard>
        {message ? <AppInput label="رسالة" value={message} editable={false} /> : null}
        <AppButton title="حفظ" onPress={save} loading={busy} fullWidth />
      </View>
    </AppScreen>
  );
}
