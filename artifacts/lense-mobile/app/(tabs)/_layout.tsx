import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const isIOS = Platform.OS === "ios";

function VoltFAB({ focused, voltColor, inkColor }: { focused: boolean; voltColor: string; inkColor: string }) {
  return (
    <View
      style={{
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: focused ? "#aee62e" : voltColor,
        alignItems: "center",
        justifyContent: "center",
        marginTop: -22,
        shadowColor: voltColor,
        shadowOpacity: 0.55,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
      }}
    >
      <Feather name="plus" size={28} color={inkColor} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const C = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.volt,
        tabBarInactiveTintColor: C.textTertiary,
        tabBarStyle: {
          height: 84 + (isIOS ? insets.bottom : 0),
          backgroundColor: C.surface2,
          borderTopWidth: 1,
          borderTopColor: C.border,
          elevation: 0,
          position: "absolute",
          overflow: "visible",
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_600SemiBold",
          marginBottom: isIOS ? 0 : 6,
        },
        tabBarIconStyle: { marginTop: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size }) => (
            <Feather name="trending-up" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analyze"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => <VoltFAB focused={focused} voltColor={C.volt} inkColor={C.ink} />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Coach",
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
