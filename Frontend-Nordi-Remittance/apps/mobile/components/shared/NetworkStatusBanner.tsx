import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useNetworkStatus } from '../../../mobile2/src/hooks/useNetworkStatus';
import type { NetworkQuality } from '../../../mobile2/src/core/network/network';

interface BannerConfig {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
  backgroundColor: string;
  textColor: string;
  autoDismissMs?: number;
}

const BANNER_MAP: Record<string, BannerConfig> = {
  offline: {
    icon: 'cloud-offline',
    message: "You're offline. Showing cached data.",
    backgroundColor: '#dc2626',
    textColor: '#ffffff',
  },
  poor: {
    icon: 'warning',
    message: 'Poor connection detected. Some data may be delayed.',
    backgroundColor: '#d97706',
    textColor: '#ffffff',
  },
  slow: {
    icon: 'wifi',
    message: 'Slow connection detected. Data may take longer to load.',
    backgroundColor: '#f59e0b',
    textColor: '#ffffff',
  },
  recovered: {
    icon: 'checkmark-circle',
    message: 'Connection restored. Refreshing data…',
    backgroundColor: '#059669',
    textColor: '#ffffff',
    autoDismissMs: 3000,
  },
};

export const NetworkStatusBanner: React.FC = () => {
  const { quality, isOnline } = useNetworkStatus();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [config, setConfig] = useState<BannerConfig | null>(null);
  const prevQualityRef = useRef<NetworkQuality>(quality);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevQualityRef.current;
    prevQualityRef.current = quality;

    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    let nextConfig: BannerConfig | null = null;

    if (quality === 'offline') {
      nextConfig = BANNER_MAP.offline;
      setDismissed(false);
    } else if (quality === 'poor') {
      nextConfig = BANNER_MAP.poor;
      setDismissed(false);
    } else if (quality === 'slow') {
      nextConfig = BANNER_MAP.slow;
      setDismissed(false);
    } else if (
      (prev === 'offline' || prev === 'poor' || prev === 'slow') &&
      quality === 'good'
    ) {
      nextConfig = BANNER_MAP.recovered;
      setDismissed(false);
    }

    setConfig(nextConfig);
    setVisible(!!nextConfig && !dismissed);

    if (nextConfig?.autoDismissMs) {
      dismissTimerRef.current = setTimeout(() => {
        setVisible(false);
        setConfig(null);
      }, nextConfig.autoDismissMs);
    }

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [quality, isOnline, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
  };

  if (!visible || !config) return null;

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={[styles.container, { backgroundColor: config.backgroundColor }]}
    >
      <Ionicons name={config.icon} size={18} color={config.textColor} style={styles.icon} />
      <Text style={[styles.message, { color: config.textColor }]}>{config.message}</Text>
      {quality !== 'offline' && (
        <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
          <Ionicons name="close" size={18} color={config.textColor} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default NetworkStatusBanner;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 9998,
  },
  icon: {
    marginRight: 8,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});
