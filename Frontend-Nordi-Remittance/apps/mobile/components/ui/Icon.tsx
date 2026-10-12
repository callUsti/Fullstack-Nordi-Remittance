import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';

export interface IconProps {
  name?: string | keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<TextStyle>;
  icon?: React.ComponentType<{ size?: number; color?: string; style?: StyleProp<TextStyle> }>;
}

export const Icon: React.FC<IconProps> = ({
  name = 'help-outline',
  size = 24,
  color = '#000',
  style,
  icon: CustomIcon,
}) => {
  if (CustomIcon) {
    return <CustomIcon size={size} color={color} style={style} />;
  }

  return (
    <Ionicons
      name={(name as keyof typeof Ionicons.glyphMap) || 'help-outline'}
      size={size}
      color={color}
      style={style}
    />
  );
};

export default Icon;
