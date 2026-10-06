import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import useThemeStore from '@nordi/shared/store/theme.store';

export default function TabLayout() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,

          tabBarStyle: {
            backgroundColor: isDarkMode ? '#0F172A' : '#fff',
            borderTopWidth: 1,
            borderTopColor: isDarkMode ? '#334155' : '#e5e5e5',
            height: Platform.OS === 'ios' ? 85 : 65,
            paddingBottom: Platform.OS === 'ios' ? 25 : 10,
            paddingTop: 10
          },
          tabBarActiveTintColor: isDarkMode ? '#60A5FA' : '#2563eb',
          tabBarInactiveTintColor: isDarkMode ? '#94A3B8' : '#64748b'
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ size, color }) => <Ionicons name="home" size={size} color={color} />
          }}
        />
        <Tabs.Screen
          name="access"
          options={{
            title: 'My Access',
            tabBarIcon: ({ size, color }) => <Ionicons name="key" size={size} color={color} />
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scan',
            tabBarIcon: ({ size, color }) => <Ionicons name="scan" size={size} color={color} />
          }}
        />
        <Tabs.Screen
          name="support"
          options={{
            title: 'Support',
            tabBarIcon: ({ size, color }) => <Ionicons name="help-circle" size={size} color={color} />
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ size, color }) => <Ionicons name="person" size={size} color={color} />
          }}
        />
      </Tabs>
    </View>
  );
}
