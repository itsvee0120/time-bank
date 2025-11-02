import React from "react";
import { Tabs } from "expo-router";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import TabBar from "@/components/TabBar";
import { useScroll } from "@/services/ScrollContext";

export default function TabsLayout() {
  const { scrollY } = useScroll();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#041b0c", // optional styling
        },
      }}
      tabBar={(props: BottomTabBarProps) => (
        <TabBar {...props} scrollY={scrollY} />
      )}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
