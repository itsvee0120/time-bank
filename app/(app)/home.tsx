import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import TimeBalanceCard from "@/components/TimeBalanceCard";
import { useAuth } from "@/services/AuthContext";
import { supabase } from "@/services/supabase";
const FALLBACK_AVATAR = require("@/assets/images/temp-profile-pic.png");

export default function Home() {
  const { session } = useAuth();
  const username = session?.user?.user_metadata?.name ?? "User";
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoaded, setAvatarLoaded] = useState(true);
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) return;
      const { data, error } = await supabase
        .from("users")
        .select("avatar_url, time_balance")
        .eq("id", session.user.id)
        .single();

      if (!error) {
        setAvatarUrl(data?.avatar_url ?? null);
        setBalance(data?.time_balance ?? 0);
      } else {
        console.log("Error fetching user data:", error.message);
      }
    };
    fetchUserData();
  }, [session?.user?.id]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#041b0c", "rgba(2,23,9,0.55)", "rgba(2,23,9,0.2)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <BlurView
        intensity={25}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        // ✨ SMOOTHNESS FIXES ✨
        // 1. Increases scroll speed acceleration (especially noticeable on Android)
        decelerationRate="fast"
        // 2. Improves native responsiveness
        indicatorStyle="white" // Ensure scroll indicator is visible against dark background
        // 3. (Optional) For highly complex views, this optimizes rendering. Use cautiously.
        // removeClippedSubviews={true}
      >
        <View style={styles.welcomeRow}>
          <Image
            source={
              avatarUrl && avatarLoaded ? { uri: avatarUrl } : FALLBACK_AVATAR
            }
            style={styles.avatar}
            onError={() => setAvatarLoaded(false)}
          />
          <Text style={styles.welcome}>Welcome, {username}!</Text>
        </View>

        <View style={styles.cardWrapper}>
          <TimeBalanceCard balance={balance} />
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.title}>About Houreum</Text>
          <Text style={styles.description}>
            Houreum is a Time Bank where the community comes together to share
            skills and time.
          </Text>

          <Text style={styles.subtitle}>How to Get Started:</Text>
          <Text style={styles.description}>
            1. Sign up and create your profile{"\n"}
            2. Browse available tasks and requests{"\n"}
            3. Offer your time or request help{"\n"}
            4. Earn and spend your time credits
          </Text>

          <Text style={styles.subtitle}>Community Rules & Policies:</Text>
          <Text style={styles.description}>
            1. Be respectful and kind to all members{"\n"}
            2. Complete tasks you commit to{"\n"}
            3. Accurately report your hours and contributions{"\n"}
            4. Do not misuse the platform for commercial purposes{"\n"}
            5. Report suspicious activity to maintain trust
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  scrollViewContent: {
    padding: 20,
    alignItems: "center",
    paddingTop: 60,
    // Padding to clear the fixed tab bar
    paddingBottom: 150,
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    alignSelf: "flex-start",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 50,
    marginRight: 20,
    borderWidth: 2,
    borderColor: "#9ec5acff",
  },
  welcome: { fontSize: 40, fontWeight: "700", color: "#9ec5acff" },
  cardWrapper: { width: "100%", marginVertical: -10 },
  aboutSection: {
    marginTop: 25,
    backgroundColor: "rgba(2,23,9,0.55)",
    padding: 25,
    borderRadius: 40,
    width: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#b3d4bfff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#b3d4bfff",
    marginTop: 15,
    marginBottom: 5,
  },
  description: { fontSize: 16, color: "#ffffff", lineHeight: 22 },
});
