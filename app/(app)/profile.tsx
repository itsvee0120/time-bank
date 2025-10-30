import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/services/supabase";
import { Database } from "@/services/supabaseTypes";
import { useAuth } from "@/services/AuthContext";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export default function ProfilePage() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [session]);

  const fetchProfile = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle(); // ✅ Use maybeSingle() instead of single()

      if (error) {
        console.error("Profile fetch error:", error);
        Alert.alert("Error", error.message);
        setProfile(null);
      } else if (data) {
        setProfile(data);
      } else {
        console.log("No profile found for user");
        setProfile(null);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Sign Out Error", error.message);
    } else {
      router.replace("/(auth)/login");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.name?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.name || "User"}</Text>
        <Text style={styles.email}>
          {profile?.email || session?.user?.email || "No email"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Info</Text>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Time Balance</Text>
          <Text style={styles.value}>{profile?.time_balance || 0} hours</Text>
        </View>

        {profile?.location && (
          <View style={styles.infoCard}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{profile.location}</Text>
          </View>
        )}

        {profile?.availability && (
          <View style={styles.infoCard}>
            <Text style={styles.label}>Availability</Text>
            <Text style={styles.value}>{profile.availability}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, styles.signOutButton]}
        onPress={handleSignOut}
      >
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
  },
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#1F2937",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  label: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: "#fff",
  },
  button: {
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  signOutButton: {
    backgroundColor: "#DC2626",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
