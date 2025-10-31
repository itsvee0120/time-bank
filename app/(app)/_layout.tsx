import TabBar from "@/components/TabBar";
import { useScroll } from "@/services/ScrollContext";
import { Tabs } from "expo-router";
import React from "react";

export default function TabsLayout() {
  const { scrollY } = useScroll();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      // Pass the shared scrollY value to the TabBar
      tabBar={(props) => <TabBar {...props} scrollY={scrollY} />}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
