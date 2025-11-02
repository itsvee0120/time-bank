import { Stack, Redirect } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/services/AuthContext";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useSegments } from "expo-router";

export default function AuthLayout() {
  const { session, loading: authLoading } = useAuth();
  const segments = useSegments();
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const hasCheckedProfile = useRef(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!session?.user) {
        setProfileComplete(null);
        hasCheckedProfile.current = false;
        return;
      }

      // Only check once per session change
      if (hasCheckedProfile.current) return;

      setCheckingProfile(true);
      try {
        const { data: profile, error } = await supabase
          .from("users")
          .select("is_profile_complete")
          .eq("id", session.user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching profile:", error);
          setProfileComplete(false);
        } else {
          setProfileComplete(profile?.is_profile_complete ?? false);
        }

        hasCheckedProfile.current = true;
      } catch (err) {
        console.error("Unexpected error:", err);
        setProfileComplete(false);
        hasCheckedProfile.current = true;
      } finally {
        setCheckingProfile(false);
      }
    };

    if (!authLoading) {
      checkProfile();
    }
  }, [session?.user?.id, authLoading]); // Only depend on user ID and auth loading

  // Show loader while checking
  if (authLoading || checkingProfile) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#84d1a2" />
      </View>
    );
  }

  const inAuthGroup = segments[0] === "(auth)";

  // Authenticated user with complete profile → go to app
  if (session && profileComplete === true) {
    return <Redirect href="/(app)/home" />;
  }

  // Authenticated user with incomplete profile → go to profile-setup
  if (session && profileComplete === false) {
    const currentScreen = segments[segments.length - 1];
    if (currentScreen !== "profile-setup") {
      return <Redirect href="/(auth)/profile-setup" />;
    }
  }

  // Not authenticated → stay in auth screens
  if (!session && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  // Render the stack
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
  },
});
