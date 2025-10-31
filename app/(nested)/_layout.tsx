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
      {/*
        The default `headerLeft` above will apply to any screen not explicitly defined below.
        This includes:
        - [id].tsx (Task Details)
        - my-requests.tsx
        - report-time.tsx
        - requests.tsx
        - tasks-available.tsx
        - user/[id].tsx
      */}

      {/* Override back button for edit-profile to go to settings */}
      <Stack.Screen name="edit-profile" options={{}} />

      {/* Override back button for settings to go to the main profile tab */}
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
