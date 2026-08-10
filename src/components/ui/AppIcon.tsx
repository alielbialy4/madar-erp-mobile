import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/useColors';
import { phosphorIconMap } from '@/constants/iconMap';

type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

interface AppIconProps {
  name: string;
  size?: number;
  color?: string;
  weight?: IconWeight;
  style?: StyleProp<TextStyle>;
}

let phosphor: Record<string, React.ComponentType<{ size: number; color: string; weight?: IconWeight }> | undefined> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  phosphor = require('phosphor-react-native');
} catch {
  phosphor = null;
}

function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function AppIcon({ name, size = 22, color, weight = 'regular', style }: AppIconProps) {
  const c = useColors();
  const iconColor = color ?? c.text;

  if (phosphor) {
    const pascalName = phosphorIconMap[name] ?? kebabToPascal(name);
    const IconComp = phosphor[pascalName] as
      | React.ComponentType<{ size: number; color: string; weight?: IconWeight; style?: StyleProp<TextStyle> }>
      | undefined;

    if (IconComp) {
      return React.createElement(IconComp, { size, color: iconColor, weight, style });
    }
  }

  const miName = name as keyof typeof MaterialIcons.glyphMap;
  return <MaterialIcons name={miName} size={size} color={iconColor} style={style} />;
}
