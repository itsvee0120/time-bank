import TimeBalanceCard from "@/components/TimeBalanceCard";
import TimeReportGuide from "@/components/TimeReportGuide";
import { useAuth } from "@/services/AuthContext";
import { useScroll } from "@/services/ScrollContext";
import { supabase } from "@/services/supabase";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";

const FALLBACK_AVATAR = require("@/assets/images/temp-profile-pic.png");

export default function Home() {
  const { session } = useAuth();
  const { scrollY } = useScroll();
  const username = session?.user?.user_metadata?.name ?? "User";
  const router = useRouter();
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

  const handleReportActivity = async () => {
    const url = "https://forms.gle/LhpXXSa4wnLLQu8T7";
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Could not open the form.");
    }
  };

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

      <Animated.ScrollView
        contentContainerStyle={styles.scrollViewContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        indicatorStyle="white"
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

        <TimeReportGuide />

        <View style={styles.aboutSection}>
          <Text style={styles.title}>About Houreum</Text>
          <Text style={styles.description}>
            Houreum is a Time Bank where the community comes together to share
            skills and time.
          </Text>

          <Text style={styles.subtitle}>Community Rules & Policies:</Text>
          <Text style={styles.description}>
            1. Be respectful and kind to all members{"\n"}
            2. Complete tasks you commit to{"\n"}
            3. Accurately report your hours and contributions{"\n"}
            4. Do not misuse the platform for commercial purposes
          </Text>
          <Text style={styles.description}>
            5.{" "}
            <Text style={styles.linkText} onPress={handleReportActivity}>
              Report suspicious activity
            </Text>{" "}
            to maintain trust
          </Text>

          <Text style={styles.subtitle}>Disclaimer:</Text>
          <Text style={styles.description}>
            The developers of this application are not responsible for any
            misuse of the platform, disputes between users, or the quality of
            services exchanged. Use of this platform is at your own risk.
          </Text>
          <Text style={[styles.description, { marginTop: 20 }]}>
            You can check out our{" "}
            <Text
              style={styles.linkText}
              onPress={() => router.push("/privacy-security")}
            >
              Privacy & Security policy
            </Text>{" "}
            under Settings.
          </Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  scrollViewContent: {
    padding: 20,
    alignItems: "center",
    paddingTop: 50,
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
  welcome: { fontSize: 30, fontWeight: "700", color: "#9ec5acff" },
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
  linkText: {
    color: "rgba(209, 172, 255, 0.9)",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
});
