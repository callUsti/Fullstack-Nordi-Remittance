// ============================================================================
// SCREEN HEADER - Reusable mobile screen header with back navigation
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { createThrottle } from '@/core/network/lodash-bounce';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  rightElement?: React.ReactNode;
  onBack?: () => void;
  onBackPress?: () => void;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  showBack = true,
  rightAction,
  rightElement,
  onBack,
  onBackPress,
}) => {
  const router = useRouter();
  const theme = useMobileTheme();
  const styles = createStyles(theme);

  const onBackRef = React.useRef({ onBack, onBackPress, router });
  React.useEffect(() => {
    onBackRef.current = { onBack, onBackPress, router };
  }, [onBack, onBackPress, router]);

  const handleBack = React.useMemo(() => {
    return createThrottle(
      () => {
        const { onBack: cb, onBackPress: cbPress, router: r } = onBackRef.current;
        if (cb) cb();
        else if (cbPress) cbPress();
        else r.back();
      },
      600,
      { leading: true, trailing: false },
    );
  }, []);

  React.useEffect(() => {
    return () => {
      if (handleBack && typeof (handleBack as any).cancel === 'function') {
        (handleBack as any).cancel();
      }
    };
  }, [handleBack]);

  const actionNode = rightAction || rightElement;

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </TouchableOpacity>
        )}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </View>
      {actionNode ? <View style={styles.rightSection}>{actionNode}</View> : null}
    </View>
  );
};

// ============================================================================
// SUB-NAV PILL TABS  — Horizontal scrollable top tabs (Binance-style)
// ============================================================================
interface SubNavTab {
  key: string;
  label: string;
  badge?: number;
}

interface SubNavTabsProps {
  tabs: SubNavTab[];
  activeTab?: string;
  activeKey?: string;
  onTabChange?: (key: string) => void;
  onChange?: (key: string) => void;
}

export const SubNavTabs: React.FC<SubNavTabsProps> = ({
  tabs,
  activeTab,
  activeKey,
  onTabChange,
  onChange,
}) => {
  const theme = useMobileTheme();
  const styles = createStyles(theme);
  const currentTab = activeTab ?? activeKey ?? (tabs[0] ? tabs[0].key : '');

  const onSelectRef = React.useRef({ onTabChange, onChange });
  React.useEffect(() => {
    onSelectRef.current = { onTabChange, onChange };
  }, [onTabChange, onChange]);

  const handleSelect = React.useMemo(() => {
    return createThrottle(
      (key: string) => {
        const { onTabChange: tc, onChange: oc } = onSelectRef.current;
        if (tc) tc(key);
        if (oc) oc(key);
      },
      300,
      { leading: true, trailing: false },
    );
  }, []);

  React.useEffect(() => {
    return () => {
      if (handleSelect && typeof (handleSelect as any).cancel === 'function') {
        (handleSelect as any).cancel();
      }
    };
  }, [handleSelect]);

  return (
    <View style={styles.subNavContainer}>
      <View style={styles.subNavScroll}>
        {tabs.map((tab) => {
          const isActive = tab.key === currentTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.subNavTab, isActive && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
              onPress={() => handleSelect(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.subNavLabel, { color: isActive ? theme.primary : theme.textMuted }]}>
                {tab.label}
              </Text>
              {tab.badge != null && tab.badge > 0 ? (
                <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

const createStyles = (theme: ReturnType<typeof useMobileTheme>) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'ios' ? 56 : STATUS_BAR_HEIGHT + 16,
      paddingBottom: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.background,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    titleBlock: {
      flex: 1,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 1,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    subNavContainer: {
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    subNavScroll: {
      flexDirection: 'row',
      paddingHorizontal: 16,
    },
    subNavTab: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginRight: 4,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    subNavLabel: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.1,
    },
    badge: {
      marginLeft: 5,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: '#fff',
    },
  });

export default ScreenHeader;
