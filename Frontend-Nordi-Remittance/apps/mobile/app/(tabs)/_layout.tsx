import { Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import { LucideIcons } from "@/constants/icons";
import { Platform, View, Animated, StyleSheet, Easing } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Icon } from "@/components/ui/Icon";

import { permissionHandler } from "@/core/utils/permission-handler";

export default function TabLayout() {
  const backgroundColor = useThemeColor({}, "background");
  const tabBarBg = useThemeColor({}, "surface"); // Tab bar background
  const activeColor = useThemeColor({}, "tabBarActive");
  const inactiveColor = useThemeColor({}, "tabBarInactive");
  const activeIconBg = useThemeColor({}, "text"); // Dark circle for active icon context
  const focusedIconColor = useThemeColor({}, "background"); // Icon color (inverse of circle)
  const borderColor = useThemeColor({}, "border");

  useEffect(() => {
    // Initialize permissions on home screen entry
    const checkPermissions = async () => {
      await permissionHandler.checkOrRequest("camera");
    };

    const timer = setTimeout(() => {
      checkPermissions();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          borderTopWidth: 1,
          backgroundColor: tabBarBg,
          borderTopColor: borderColor,
          height: Platform.OS === "ios" ? 90 : 70,
          paddingBottom: Platform.OS === "ios" ? 30 : 15,
          paddingTop: 10,
          paddingHorizontal: 4,
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarItemStyle: {
          borderRadius: 14,
          marginHorizontal: 1,
          paddingVertical: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              iconName="Home"
              focused={focused}
              activeIconBg={activeIconBg}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              backgroundColor={backgroundColor}
              focusedIconColor={focusedIconColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="access"
        options={{
          title: "My Access",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              iconName="ShieldCheck"
              focused={focused}
              activeIconBg={activeIconBg}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              backgroundColor={backgroundColor}
              focusedIconColor={focusedIconColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              iconName="QrCode"
              focused={focused}
              activeIconBg={activeIconBg}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              backgroundColor={backgroundColor}
              focusedIconColor={focusedIconColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: "Support",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              iconName="Headset"
              focused={focused}
              activeIconBg={activeIconBg}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              backgroundColor={backgroundColor}
              focusedIconColor={focusedIconColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              iconName="User"
              focused={focused}
              activeIconBg={activeIconBg}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              backgroundColor={backgroundColor}
              focusedIconColor={focusedIconColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="markets"
        options={{
          title: "Markets",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              iconName="TrendingUp"
              focused={focused}
              activeIconBg={activeIconBg}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              backgroundColor={backgroundColor}
              focusedIconColor={focusedIconColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="send"
        options={{
          title: "Send",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              iconName="Send"
              focused={focused}
              activeIconBg={activeIconBg}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              backgroundColor={backgroundColor}
              focusedIconColor={focusedIconColor}
            />
          ),
        }}
      />
    </Tabs>
  );
}

// Animated Tab icon component
const TabIcon = React.memo(
  ({
    iconName,
    focused,
    activeIconBg,
    activeColor,
    inactiveColor,
    backgroundColor,
    focusedIconColor,
  }: {
    iconName: string;
    focused: boolean;
    activeIconBg: string;
    activeColor: string;
    inactiveColor: string;
    backgroundColor: string;
    focusedIconColor: string;
  }) => {
    const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

    useEffect(() => {
      Animated.timing(progress, {
        toValue: focused ? 1 : 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, [focused, progress]);

    const bgScale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.96, 1.02],
    });
    const bgOpacity = progress;
    const iconScale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.08],
    });
    const dotTranslateY = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [6, 0],
    });

    return (
      <View style={styles.iconWrapper}>
        <Animated.View
          style={[
            styles.bgCircle,
            {
              backgroundColor: activeIconBg,
              opacity: bgOpacity,
              transform: [{ scale: bgScale }],
            },
          ]}
        />

        <Animated.View style={{ transform: [{ scale: iconScale }], zIndex: 2 }}>
          <Icon
            name={iconName as any}
            size={20}
            color={focused ? focusedIconColor : inactiveColor}
            strokeWidth={focused ? 2 : 1.5}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: activeIconBg, // Same as circle
              opacity: bgOpacity,
              transform: [{ translateY: dotTranslateY }],
              borderColor: backgroundColor, // Match screen bg? Or transparent?
            },
          ]}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  iconWrapper: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  bgCircle: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    // subtle border to define shape on light backgrounds
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  dot: {
    position: "absolute",
    bottom: -6,
    width: 6,
    height: 6,
    borderRadius: 3,
    // small white border so dot reads on dark nav backgrounds
    borderWidth: 1,
  },
});