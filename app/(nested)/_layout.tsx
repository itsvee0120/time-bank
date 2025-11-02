import { Stack } from "expo-router";
import React from "react";

export default function NestedLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        // Add a smooth fade animation for all screens in this stack
        animation: "slide_from_right",
        headerShown: false,
      }}
    >
      <Stack.Screen name="edit-profile" options={{}} />

      <Stack.Screen
        name="settings"
        options={
          {
            // Note: This navigates to a screen in a different (tab) layout.
          }
        }
      />
    </Stack>
  );
}
