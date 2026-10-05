// ============================================================================
// AVATAR COMPONENT - User profile image with initials fallback in React Native
// ============================================================================

import React, { useState } from 'react';
import { View, Text, Image, ViewProps } from 'react-native';
import { cn } from '@utils/cn';
import { User } from 'lucide-react-native';

// ========================
// TYPES
// ========================
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

export interface AvatarProps extends ViewProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  statusPosition?: 'top-right' | 'bottom-right';
  className?: string;
}

// ========================
// SIZE CONFIG
// ========================
const sizeConfig: Record<
  AvatarSize,
  {
    container: string;
    text: string;
    iconSize: number;
    statusSize: string;
  }
> = {
  xs: { container: 'w-6 h-6', text: 'text-[9px]', iconSize: 12, statusSize: 'w-2 h-2 border' },
  sm: { container: 'w-8 h-8', text: 'text-xs', iconSize: 16, statusSize: 'w-2.5 h-2.5 border' },
  md: { container: 'w-10 h-10', text: 'text-sm', iconSize: 20, statusSize: 'w-3 h-3 border-2' },
  lg: { container: 'w-12 h-12', text: 'text-base font-semibold', iconSize: 24, statusSize: 'w-3.5 h-3.5 border-2' },
  xl: { container: 'w-16 h-16', text: 'text-xl font-bold', iconSize: 32, statusSize: 'w-4 h-4 border-2' },
  '2xl': { container: 'w-24 h-24', text: 'text-2xl font-bold', iconSize: 44, statusSize: 'w-5 h-5 border-2' },
  '3xl': { container: 'w-32 h-32', text: 'text-4xl font-bold', iconSize: 56, statusSize: 'w-6 h-6 border-4' },
};

const statusColors: Record<AvatarStatus, string> = {
  online: 'bg-success-500',
  offline: 'bg-neutral-400',
  busy: 'bg-error-500',
  away: 'bg-warning-500',
};

const getInitials = (name?: string): string => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  statusPosition = 'bottom-right',
  className,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const config = sizeConfig[size];
  const initials = getInitials(name);

  return (
    <View
      className={cn(
        'relative rounded-full items-center justify-center bg-primary-100 dark:bg-primary-900/40 border border-primary-200/50 dark:border-primary-800/50 overflow-hidden',
        config.container,
        className,
      )}
      {...props}
    >
      {src && !hasError ? (
        <Image
          source={{ uri: src }}
          onError={() => setHasError(true)}
          className="w-full h-full rounded-full"
          resizeMode="cover"
        />
      ) : initials ? (
        <Text className={cn('text-primary-700 dark:text-primary-300 font-bold', config.text)}>
          {initials}
        </Text>
      ) : (
        <User size={config.iconSize} color="#3B82F6" />
      )}

      {status && (
        <View
          className={cn(
            'absolute rounded-full border-white dark:border-neutral-900',
            config.statusSize,
            statusColors[status],
            statusPosition === 'top-right' ? 'top-0 right-0' : 'bottom-0 right-0',
          )}
        />
      )}
    </View>
  );
};

export interface AvatarGroupProps extends ViewProps {
  avatars: Array<{ src?: string; name?: string }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 4,
  size = 'sm',
  className,
  ...props
}) => {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;
  const config = sizeConfig[size];

  return (
    <View className={cn('flex-row items-center', className)} {...props}>
      {visible.map((av, index) => (
        <View
          key={index}
          style={{ marginLeft: index > 0 ? -8 : 0, zIndex: visible.length - index }}
          className="border-2 border-white dark:border-neutral-900 rounded-full"
        >
          <Avatar src={av.src} name={av.name} size={size} />
        </View>
      ))}

      {remaining > 0 && (
        <View
          style={{ marginLeft: -8, zIndex: 0 }}
          className={cn(
            'rounded-full bg-neutral-200 dark:bg-neutral-700 items-center justify-center border-2 border-white dark:border-neutral-900',
            config.container,
          )}
        >
          <Text className={cn('text-neutral-700 dark:text-neutral-300 font-semibold', config.text)}>
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
};

export default Avatar;
