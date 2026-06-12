import { Platform } from 'react-native';
import type { SelectOption } from '@/components/ui/AppSelect';
import type { EscPosEncoding, PaperWidth, PrinterConnectionType, PrinterRole } from '@/types/printing';
import { getConnectionCapability } from '@/services/printing/printerCapabilities';
import { normalizeFormEncoding } from '@/services/printing/printPathUtils';

export { normalizeFormEncoding };

export const PRINTER_ROLE_OPTIONS: SelectOption[] = [
  { label: 'كاشير (إيصالات)', value: 'cashier' },
  { label: 'مطبخ', value: 'kitchen' },
  { label: 'بار', value: 'bar' },
  { label: 'وردية', value: 'shift' },
  { label: 'تقارير', value: 'report' },
];

export const PRINTER_ROLE_PRIMARY: PrinterRole[] = ['cashier', 'kitchen', 'bar'];

export const PAPER_WIDTH_OPTIONS: SelectOption[] = [
  { label: '58 مم', value: '58mm' },
  { label: '80 مم', value: '80mm' },
];

export const ENCODING_OPTIONS: SelectOption[] = [
  {
    label: 'صورة — Kotlin native (TCP) / Bluetooth printPic',
    value: 'utf8_image',
  },
  {
    label: 'نص سريع — Windows-1256',
    value: 'windows1256',
  },
];

export const CODE_PAGE_PRESET_OPTIONS: SelectOption[] = [
  { label: 'Epson / معياري (CP864=37)', value: 'epson' },
  { label: 'Clone / Xprinter (CP864=22)', value: 'generic_clone' },
];

const CONNECTION_LABELS: Record<PrinterConnectionType, string> = {
  network_tcp: 'شبكة Ethernet (TCP)',
  bluetooth_android: 'بلوتوث (Android)',
  airprint_ios: 'AirPrint (iOS)',
  vendor_sdk: 'SDK الشركة',
  disabled: 'معطّل',
};

export function connectionOptionsForPlatform(): SelectOption[] {
  const candidates: PrinterConnectionType[] =
    Platform.OS === 'ios'
      ? ['network_tcp', 'airprint_ios']
      : Platform.OS === 'android'
        ? ['network_tcp', 'bluetooth_android']
        : ['disabled'];

  return candidates.map((value) => {
    const cap = getConnectionCapability(value);
    const suffix = cap.supported ? '' : ' — غير مدعوم';
    return { label: `${CONNECTION_LABELS[value]}${suffix}`, value };
  });
}

export function roleLabel(role: PrinterRole): string {
  return PRINTER_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
}

export function connectionLabel(type: PrinterConnectionType): string {
  return CONNECTION_LABELS[type] ?? type;
}

export function paperWidthLabel(width: PaperWidth): string {
  return PAPER_WIDTH_OPTIONS.find((o) => o.value === width)?.label ?? width;
}

export function encodingLabel(enc: EscPosEncoding): string {
  return ENCODING_OPTIONS.find((o) => o.value === normalizeFormEncoding(enc))?.label ?? enc;
}
