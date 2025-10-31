import { supabase } from "@/services/supabase";
import { Database } from "@/services/supabaseTypes";
import { FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

const FALLBACK_AVATAR = require("@/assets/images/temp-profile-pic.png");

export default function UserProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoaded, setAvatarLoaded] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("User Profile fetch error:", error);
          Alert.alert("Error", "Could not load user profile.");
          setProfile(null);
        } else {
          setProfile(data);
          setAvatarUrl(data.avatar_url ?? null);
        }
      } catch (err) {
        console.error("Unexpected error fetching user profile:", err);
        Alert.alert("Error", "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#9ec5acff" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.name}>User not found.</Text>
      </View>
    );
  }

  const avatarSource =
    avatarUrl && avatarLoaded ? { uri: avatarUrl } : FALLBACK_AVATAR;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#041b0c", "rgba(2,23,9,0.55)", "rgba(2,23,9,0.2)"]}
        style={StyleSheet.absoluteFillObject}
      />
      <BlurView
        intensity={25}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>User Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <Image
            source={avatarSource}
            style={styles.avatar}
            onError={() => setAvatarLoaded(false)}
          />
          <Text style={styles.name}>{profile.name || "User"}</Text>
          <Text style={styles.email}>{profile.email || "No email"}</Text>
          {profile.description && (
            <>
              <View style={styles.separator} />
              <Text style={styles.description}>{profile.description}</Text>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Details</Text>

          {profile.skill_sets && profile.skill_sets.length > 0 && (
            <View style={styles.infoCard}>
              <FontAwesome5 name="tools" style={styles.infoIcon} />
              <Text style={styles.label}>Skills</Text>
              <View style={styles.skillsContainer}>
                {profile.skill_sets.map((skill) => (
                  <View key={skill} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {profile.location && (
            <View style={styles.infoCard}>
              <FontAwesome5 name="map-marker-alt" style={styles.infoIcon} />
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>{profile.location}</Text>
            </View>
          )}

          {profile.availability && (
            <View style={styles.infoCard}>
              <FontAwesome5 name="laptop-house" style={styles.infoIcon} />
              <Text style={styles.label}>Availability</Text>
              <Text style={styles.value}>{profile.availability}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#041b0c",
  },
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 80, paddingBottom: 120 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  screenTitle: { fontSize: 24, fontWeight: "700", color: "#9ec5acff" },
  profileCard: {
    backgroundColor: "rgba(2, 23, 9, 0.65)",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#ffffff30",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#9ec5acff",
  },
  name: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 6 },
  email: { fontSize: 16, color: "#ffffffa0" },
  separator: {
    height: 1,
    backgroundColor: "#ffffff30",
    marginVertical: 20,
    width: "100%",
  },
  description: {
    fontSize: 16,
    color: "#ffffff",
    lineHeight: 24,
    textAlign: "center",
  },
  section: { width: "100%" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#b3d4bfff",
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2, 23, 9, 0.55)",
    padding: 20,
    borderRadius: 15,
    marginBottom: 12,
  },
  infoIcon: { color: "#9ec5acff", fontSize: 16, width: 25 },
  label: { fontSize: 16, color: "#ffffffa0", width: 110 },
  value: { fontSize: 16, color: "#fff", fontWeight: "600", flex: 1 },
  skillsContainer: { flexDirection: "row", flexWrap: "wrap", flex: 1 },
  skillTag: {
    backgroundColor: "rgba(52, 211, 153, 0.2)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: { color: "#aaffcbff", fontSize: 14 },
});
