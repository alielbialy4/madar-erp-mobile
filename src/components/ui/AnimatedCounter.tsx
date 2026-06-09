import React, { useEffect, useRef, useState } from 'react';
import { TextStyle } from 'react-native';
import { fontFamilyForWeight } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { AppText } from './AppText';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  fontSize?: number;
  fontWeight?: '400' | '500' | '700' | '800' | '900';
  color?: string;
  decimals?: number;
  style?: TextStyle | TextStyle[];
}

export function AnimatedCounter({
  value,
  duration = 700,
  prefix = '',
  suffix = '',
  fontSize = 28,
  fontWeight = '800',
  color,
  decimals = 0,
  style,
}: AnimatedCounterProps) {
  const c = useColors();
  const [display, setDisplay] = useState(0);
  const startRef = useRef(value);

  useEffect(() => {
    const start = startRef.current;
    const delta = value - start;
    if (delta === 0) return;
    startRef.current = value;

    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = start + delta * eased;

      if (Math.abs(current - value) < Math.pow(10, -decimals - 1)) {
        setDisplay(value);
      } else {
        setDisplay(current);
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);

    return () => { setDisplay(value); };
  }, [value, duration, decimals]);

  const fmt = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <AppText
      numeric
      style={[
        {
          fontFamily: fontFamilyForWeight(fontWeight),
          fontSize,
          color: color ?? c.text,
        } as TextStyle,
        style as TextStyle,
      ]}
    >
      {prefix}
      {fmt.format(display)}
      {suffix}
    </AppText>
  );
}
