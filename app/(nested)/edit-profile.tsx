import { useAuth } from "@/services/AuthContext";
import { supabase } from "@/services/supabase";
import { FontAwesome5 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const FALLBACK_AVATAR = require("@/assets/images/temp-profile-pic.png");
const AVAILABILITY_OPTIONS = ["online", "in-person", "both"];

export default function EditProfileScreen() {
  const { session } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [skillsets, setSkillsets] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newAvatar, setNewAvatar] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  // Delete modal state
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Fetch current profile data
  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select(
            "name, description, skill_sets, location, availability, avatar_url"
          )
          .eq("id", session.user.id)
          .single();

        if (error) throw error;

        if (data) {
          setName(data.name ?? "");
          setDescription(data.description ?? "");
          setSkillsets((data.skill_sets ?? []).join(", "));
          setLocation(data.location ?? "");
          setAvailability(data.availability ?? "");
          setAvatarUrl(data.avatar_url ?? null);
        }
      } catch (err: any) {
        console.error("Error fetching profile for editing:", err);
        Alert.alert("Error", "Could not load your profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [session?.user]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewAvatar(result.assets[0]);
    }
  };

  const handleUpdateProfile = async () => {
    if (!session?.user) return;

    setUpdating(true);
    let publicAvatarUrl = avatarUrl;

    try {
      // 1. If a new avatar is selected, upload it
      if (newAvatar) {
        const fileExt = newAvatar.uri.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;

        const formData = new FormData();
        formData.append("file", {
          uri: newAvatar.uri,
          name: fileName,
          type: newAvatar.mimeType,
        } as any);

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, formData);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        publicAvatarUrl = urlData.publicUrl;
      }

      // 2. Update the user's profile in the 'users' table
      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          description: description.trim(),
          skill_sets: skillsets
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          location: location.trim(),
          availability: availability.trim(),
          avatar_url: publicAvatarUrl,
          // This marks the profile as complete if it wasn't already
          is_profile_complete: true,
        })
        .eq("id", session.user.id);

      if (updateError) throw updateError;

      Alert.alert("Success", "Your profile has been updated.", [
        // This will correctly return the user to the 'Settings' screen,
        // because the BackButton in the header is now configured to do so.
        // Using router.back() is now the correct and consistent approach.
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error("Profile update error:", err);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.user) return;

    // Basic validation
    if (
      deleteEmail.trim().toLowerCase() !== session.user.email?.toLowerCase() ||
      !deletePassword
    ) {
      Alert.alert("Error", "Invalid email or password provided.");
      return;
    }

    setDeleting(true);

    try {
      // 1. Re-authenticate the user to confirm their identity
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: deleteEmail.trim(),
        password: deletePassword,
      });

      if (signInError) {
        throw new Error("Invalid credentials. Please try again.");
      }

      // 2. Call a Supabase Edge Function to perform the deletion.
      // This is the secure way to delete a user from `auth.users`.
      const { error: functionError } = await supabase.functions.invoke(
        "delete-user",
        {
          method: "POST",
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      // 3. On success, sign the user out locally and redirect
      await supabase.auth.signOut();
      Alert.alert(
        "Account Deleted",
        "Your account has been permanently deleted.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
      );
      setDeleteModalVisible(false);
    } catch (err: any) {
      console.error("Account deletion error:", err);
      Alert.alert(
        "Deletion Failed",
        err.message || "Could not delete your account. Please try again."
      );
    } finally {
      setDeleting(false);
      setDeletePassword(""); // Clear password field
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#9ec5acff" />
      </View>
    );
  }

  const avatarSource = newAvatar
    ? { uri: newAvatar.uri }
    : avatarUrl
    ? { uri: avatarUrl }
    : FALLBACK_AVATAR;

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
        <View style={styles.headerContainer}>
          <Text style={styles.screenTitle}>Edit Profile</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.avatarContainer}>
            <Image source={avatarSource} style={styles.avatar} />
            <TouchableOpacity
              style={styles.editButton}
              onPress={handlePickImage}
            >
              <FontAwesome5 name="camera" size={16} color="#041b0c" />
            </TouchableOpacity>
          </View>

          <Text style={styles.formLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your full name"
            placeholderTextColor="#ffffff90"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.formLabel}>About Me (Description)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us a little about yourself..."
            placeholderTextColor="#ffffff90"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.formLabel}>Skillsets</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Gardening, Web Design, Tutoring"
            placeholderTextColor="#ffffff90"
            value={skillsets}
            onChangeText={setSkillsets}
          />

          <Text style={styles.formLabel}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., City, State"
            placeholderTextColor="#ffffff90"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.formLabel}>Availability Mode</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={availability}
              onValueChange={(itemValue) => setAvailability(itemValue)}
              style={styles.picker}
              dropdownIconColor="#ffffff"
            >
              <Picker.Item label="Select a mode..." value="" />
              {AVAILABILITY_OPTIONS.map((opt) => (
                <Picker.Item
                  key={opt}
                  label={opt.charAt(0).toUpperCase() + opt.slice(1)}
                  value={opt}
                />
              ))}
            </Picker>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (updating || loading) && styles.submitButtonDisabled,
            ]}
            onPress={handleUpdateProfile}
            disabled={updating || loading}
          >
            {updating ? (
              <ActivityIndicator color="#041b0c" />
            ) : (
              <>
                <FontAwesome5
                  name="save"
                  size={20}
                  color="#041b0c"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.submitButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setDeleteModalVisible(true)}
          >
            <FontAwesome5 name="trash-alt" size={16} color="#f87171" />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Confirmation Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isDeleteModalVisible}
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <BlurView intensity={25} tint="dark" style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Your Account</Text>
              <Text style={styles.modalWarning}>
                This action is irreversible. All your data, including your time
                balance and tasks, will be permanently deleted.
              </Text>
              <Text style={styles.modalInstruction}>
                To confirm, please enter your email and password.
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Your Email"
                placeholderTextColor="#ffffff90"
                value={deleteEmail}
                onChangeText={setDeleteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Your Password"
                placeholderTextColor="#ffffff90"
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalConfirmButton,
                  deleting && styles.submitButtonDisabled,
                ]}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Confirm & Delete</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setDeletePassword(""); // Clear password on cancel
                }}
                disabled={deleting}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#041b0c",
  },
  scrollContent: { padding: 20, paddingTop: 120, alignItems: "center" },
  headerContainer: { width: "100%", marginBottom: 20, alignSelf: "flex-start" },
  screenTitle: { fontSize: 32, fontWeight: "800", color: "#9ec5acff" },
  formCard: {
    backgroundColor: "rgba(2, 23, 9, 0.65)",
    padding: 25,
    borderRadius: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ffffff30",
  },
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#9ec5acff",
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: "28%",
    backgroundColor: "#9ec5acff",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#041b0c",
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#b3d4bfff",
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
    padding: 15,
    borderRadius: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ffffff30",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 15,
  },

  pickerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ffffff30",
    justifyContent: "center",
  },
  picker: {
    color: "#ffffff",
    height: 55,
  },

  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9ec5acff",
    padding: 15,
    borderRadius: 30,
    marginTop: 30,
    height: 55,
  },
  submitButtonText: { color: "#041b0c", fontSize: 18, fontWeight: "700" },
  submitButtonDisabled: { backgroundColor: "#9ec5ac99" },
  separator: {
    height: 1,
    backgroundColor: "#ffffff30",
    marginVertical: 30,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(220, 38, 38, 0.2)",
    padding: 15,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#f87171",
  },
  deleteButtonText: {
    color: "#f87171",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#041b0c",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f87171",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#f87171",
    marginBottom: 10,
  },
  modalWarning: {
    fontSize: 14,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 20,
  },
  modalInstruction: {
    fontSize: 16,
    color: "#b3d4bfff",
    textAlign: "center",
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
    padding: 15,
    borderRadius: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ffffff30",
    width: "100%",
    marginBottom: 15,
  },
  modalButton: {
    width: "100%",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  modalConfirmButton: { backgroundColor: "#DC2626" },
  modalCancelButton: { backgroundColor: "rgba(255, 255, 255, 0.2)" },
  modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
