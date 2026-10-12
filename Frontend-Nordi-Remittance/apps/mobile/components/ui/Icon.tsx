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

export const Icon: React.FC<IconProps> = ({
  name = 'help-outline',
  size = 24,
  color = '#000',
  strokeWidth = 2,
  style,
  icon: CustomIcon,
}) => {
  if (CustomIcon) {
    return <CustomIcon size={size} color={color} strokeWidth={strokeWidth} style={style} />;
  }

  // Support Lucide icons by name
  if (typeof name === 'string') {
    const LucideComponent = (LucideIcons as Record<string, any>)[name];
    if (LucideComponent) {
      return <LucideComponent size={size} color={color} strokeWidth={strokeWidth} style={style} />;
    }
  }

  return (
    <Ionicons
      name={(name as keyof typeof Ionicons.glyphMap) || 'help-outline'}
      size={size}
      color={color}
      style={style as StyleProp<TextStyle>}
    />
  );
};

export default Icon;

