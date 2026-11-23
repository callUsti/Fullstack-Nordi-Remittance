import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as LucideIcons from 'lucide-react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

export interface IconProps {
  name?: string | keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<TextStyle | ViewStyle>;
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number; style?: StyleProp<TextStyle | ViewStyle> }>;
}

function toPascalCase(str: string): string {
  return str
    .replace(/(^\w|-\w)/g, (clear) => clear.replace('-', '').toUpperCase());
}

export const Icon: React.FC<IconProps> = ({
  name = 'help-outline',
  size = 20,
  color = '#000',
  strokeWidth = 2,
  style,
  icon: CustomIcon,
}) => {
  if (CustomIcon) {
    return <CustomIcon size={size} color={color} strokeWidth={strokeWidth} style={style} />;
  }

  if (typeof name === 'string') {
    // 1. Direct Lucide match
    const LucideDirect = (LucideIcons as Record<string, any>)[name];
    if (LucideDirect) {
      return <LucideDirect size={size} color={color} strokeWidth={strokeWidth} style={style} />;
    }

    // 2. PascalCase conversion for kebab-case Lucide match (e.g., 'shield-check' -> 'ShieldCheck')
    const pascal = toPascalCase(name);
    const LucidePascal = (LucideIcons as Record<string, any>)[pascal];
    if (LucidePascal) {
      return <LucidePascal size={size} color={color} strokeWidth={strokeWidth} style={style} />;
    }

    // 3. Ionicons match
    if (name in Ionicons.glyphMap) {
      return (
        <Ionicons
          name={name as keyof typeof Ionicons.glyphMap}
          size={size}
          color={color}
          style={style as StyleProp<TextStyle>}
        />
      );
    }

    // 4. Fallback mappings
    const fallbackMap: Record<string, string> = {
      Headset: 'headset',
      User: 'person',
      Markets: 'trending-up',
      Send: 'paper-plane',
      Support: 'help-circle',
    };
    if (fallbackMap[name] && fallbackMap[name] in Ionicons.glyphMap) {
      return (
        <Ionicons
          name={fallbackMap[name] as keyof typeof Ionicons.glyphMap}
          size={size}
          color={color}
          style={style as StyleProp<TextStyle>}
        />
      );
    }
  }

  return (
    <Ionicons
      name={(name as keyof typeof Ionicons.glyphMap) || 'help-circle-outline'}
      size={size}
      color={color}
      style={style as StyleProp<TextStyle>}
    />
  );
};

export default Icon;
