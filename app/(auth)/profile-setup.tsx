import { supabase } from "@/services/supabase";
import { Database } from "@/services/supabaseTypes";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const LOGO_BACKGROUND = require("@/assets/images/login.png");
const AVAILABILITY_OPTIONS: Array<"online" | "in-person" | "both"> = [
  "online",
  "in-person",
  "both",
];

export default function ProfileSetupScreen() {
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState<
    "online" | "in-person" | "both" | null
  >(null);
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Load current user session
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Not logged in", "Please sign in first.");
        router.replace("/(auth)/login");
        return;
      }

      setUserId(user.id);
      setName(user.user_metadata?.name || "");

      // Load existing profile if any
      const { data: profile } = await supabase
        .from("users")
        .select("description, skill_sets, availability, location, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDescription(profile.description || "");
        setSkills(profile.skill_sets?.join(", ") || "");
        setAvailability(
          (profile.availability as "online" | "in-person" | "both") || null
        );
        setLocation(profile.location || "");
        setAvatarUrl(profile.avatar_url || null);
      }
    };
    loadUser();
  }, []);

  // Pick image and upload to Supabase Storage
  const pickAndUploadImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "We need access to your photos to upload a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;
      const file = result.assets[0];
      if (!file.uri || !userId) return;

      setUploading(true);

      // Fetch file as ArrayBuffer (works in Expo)
      const response = await fetch(file.uri);
      const buffer = await response.arrayBuffer();

      // Use a consistent file name per user
      const fileExt = file.uri.split(".").pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload with upsert: true to overwrite any previous avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, buffer, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrlData.publicUrl);
    } catch (error) {
      console.error("Image upload error:", error);
      Alert.alert("Upload failed", "Could not upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const submitProfile = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const payload: Database["public"]["Tables"]["users"]["Update"] = {
        name: name.trim(),
        description: description.trim() || null,
        skill_sets: skills ? skills.split(",").map((s) => s.trim()) : null,
        availability: availability || null,
        location: location.trim() || null,
        avatar_url: avatarUrl,
        is_profile_complete: true,
      };

      const { error } = await supabase
        .from("users")
        .update(payload)
        .eq("id", userId);

      if (error) {
        console.error("Profile update error:", error);
        Alert.alert("Error", error.message);
        setLoading(false);
        return;
      }

      // Force a session refresh to trigger AuthLayout re-check
      await supabase.auth.refreshSession();

      // Navigate directly - the AuthLayout will handle this correctly now
      router.replace("/(app)/home");
    } catch (err) {
      console.error("Unexpected error:", err);
      Alert.alert("Unexpected error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <Image
        source={LOGO_BACKGROUND}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Set Up Your Profile</Text>

            {/* Profile Picture */}
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.placeholderAvatar}>
                  <Text style={styles.placeholderText}>No Picture</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickAndUploadImage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.uploadButtonText}>
                    {avatarUrl ? "Change Picture" : "Upload Profile Picture"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Profile Description"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#B0B0B0"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter all relevant skills, separated by commas"
              value={skills}
              onChangeText={setSkills}
              placeholderTextColor="#B0B0B0"
              editable={!loading}
            />

            <View style={styles.availabilityContainer}>
              <Text style={styles.availabilityLabel}>Availability:</Text>
              <View style={styles.availabilityButtons}>
                {AVAILABILITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.availabilityButton,
                      availability === option &&
                        styles.availabilityButtonSelected,
                    ]}
                    onPress={() => setAvailability(option)}
                    disabled={loading}
                  >
                    <Text style={styles.availabilityButtonText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Your Location e.g., Makeshift City, LA"
              value={location}
              onChangeText={setLocation}
              placeholderTextColor="#B0B0B0"
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={submitProfile}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Saving..." : "Save Profile"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#111827" },
  backgroundImage: { position: "absolute", width: "100%", height: "100%" },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24 },
  formContainer: {
    width: "100%",
    backgroundColor: "rgba(2,23,9,0.73)",
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  placeholderAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  placeholderText: { color: "#aaa", fontSize: 14 },
  uploadButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#6366F1",
    borderRadius: 8,
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    height: 48,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  availabilityContainer: { marginBottom: 16 },
  availabilityLabel: { color: "#fff", fontSize: 16, marginBottom: 8 },
  availabilityButtons: { flexDirection: "row", justifyContent: "space-around" },
  availabilityButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  availabilityButtonSelected: {
    backgroundColor: "rgba(2,23,9,0.9)",
    borderColor: "#6366F1",
  },
  availabilityButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  button: {
    width: "100%",
    height: 48,
    backgroundColor: "rgba(2,23,9,0.73)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: "#6366F1", opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
