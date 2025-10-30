import { useAuth } from "@/services/AuthContext";
import { Redirect, Tabs } from "expo-router";
import React from "react"; // Removed useState import
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import TabBar from "@/components/TabBar";
// Removed ScrollContext import

const LOGO_BACKGROUND = require("@/assets/images/home.png");

export default function AppLayout() {
  const { session, loading: authLoading } = useAuth();
  // Removed const [scrollY, setScrollY] = useState(0);

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#448f61ff" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    // Removed ScrollProvider wrapper
    <View style={styles.container}>
      <Image
        source={LOGO_BACKGROUND}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <Tabs
        screenOptions={{ tabBarShowLabel: false, headerShown: false }}
        // Pass the standard TabBar props only
        tabBar={(props) => <TabBar {...props} />}
      >
        {/* Simple Tabs.Screen definition */}
        <Tabs.Screen name="home" options={{ title: "Home" }} />

        <Tabs.Screen name="dashboard" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827" },
  backgroundImage: { position: "absolute", width: "100%", height: "100%" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
  },
});
