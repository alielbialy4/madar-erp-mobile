import { Platform } from 'react-native';
import type { PrinterConnectionType, PrinterProfile } from '@/types/printing';

export type ConnectionCapability = {
  supported: boolean;
  silent: boolean;
  reasonAr?: string;
  reasonEn?: string;
};

const PLATFORM_MESSAGES: Record<PrinterConnectionType, { ios?: string; android?: string; web?: string }> = {
  network_tcp: {
    web: 'طباعة TCP غير متاحة على الويب.',
    ios: 'يتطلب إذن الشبكة المحلية ونسخة Dev/Production Build مع وحدة TCP أصلية.',
  },
  bluetooth_android: {
    ios: 'الطباعة الصامتة عبر البلوتوث غير مدعومة على iOS إلا بطابعات مدعومة أو SDK خاص.',
    android: 'مدعومة على Android فقط وتتطلب نسخة Dev/Production Build.',
    web: 'غير مدعومة على الويب.',
  },
  airprint_ios: {
    android: 'AirPrint متاح على iOS فقط.',
    web: 'غير مدعومة على الويب.',
  },
  vendor_sdk: {
    ios: 'يتطلب SDK الطابعة من الشركة المصنعة.',
    android: 'يتطلب SDK الطابعة من الشركة المصنعة.',
    web: 'غير مدعومة على الويب.',
  },
  disabled: {},
};

export function getConnectionCapability(type: PrinterConnectionType): ConnectionCapability {
  if (type === 'disabled') {
    return { supported: false, silent: false, reasonAr: 'نوع الاتصال معطّل.' };
  }
  if (type === 'network_tcp') {
    const supported = Platform.OS === 'ios' || Platform.OS === 'android';
    return {
      supported,
      silent: supported,
      reasonAr: !supported ? PLATFORM_MESSAGES.network_tcp.web : undefined,
    };
  }
  if (type === 'bluetooth_android') {
    const supported = Platform.OS === 'android';
    return {
      supported,
      silent: supported,
      reasonAr: !supported
        ? (Platform.OS === 'ios'
          ? PLATFORM_MESSAGES.bluetooth_android.ios
          : PLATFORM_MESSAGES.bluetooth_android.web)
        : PLATFORM_MESSAGES.bluetooth_android.android,
    };
  }
  if (type === 'airprint_ios') {
    const supported = Platform.OS === 'ios';
    return {
      supported,
      silent: false,
      reasonAr: !supported ? PLATFORM_MESSAGES.airprint_ios.android : 'قد تظهر نافذة الطباعة — ليست طباعة صامتة.',
    };
  }
  return { supported: false, silent: false, reasonAr: PLATFORM_MESSAGES.vendor_sdk[Platform.OS as 'ios' | 'android'] };
}

export function defaultCharsPerLine(width: PrinterProfile['paper_width']): number {
  return width === '58mm' ? 32 : 48;
}

export function recommendedConnectionForPlatform(): PrinterConnectionType {
  if (Platform.OS === 'ios') return 'network_tcp';
  if (Platform.OS === 'android') return 'network_tcp';
  return 'disabled';
}
