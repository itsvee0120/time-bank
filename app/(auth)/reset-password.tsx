import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/services/supabase";

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkValid, setLinkValid] = useState(false);

  const params = useLocalSearchParams();
  const token = params?.token_hash as string | undefined; // Supabase sends token_hash

  // Check if token exists (link is valid)
  useEffect(() => {
    if (!token) {
      Alert.alert("Invalid Link", "No reset token found.");
      router.replace("/(auth)/login");
      return;
    }
    setLinkValid(true);
  }, [token]);

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 8 characters long."
      );
      return;
    }

    setLoading(true);
    try {
      // Supabase automatically uses the recovery session from the deep link
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Alert.alert("Success", "Your password has been updated!");
      router.replace("/(auth)/login");
    } catch (err: any) {
      console.error("Password update error:", err);
      Alert.alert("Error", err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (!linkValid) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#9ec5acff" />
        <Text style={styles.text}>Validating reset link...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your new password below</Text>

          <TextInput
            style={styles.input}
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholderTextColor="#B0B0B0"
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleUpdatePassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Saving..." : "Update Password"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#041b0c",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scrollContent: { flexGrow: 1, justifyContent: "center", width: "100%" },
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
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#B0B0B0",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    width: "100%",
    height: 48,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    fontSize: 16,
  },
  button: {
    width: "100%",
    height: 48,
    backgroundColor: "#9ec5acff",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: "#041b0c",
    fontSize: 16,
    fontWeight: "600",
  },
  text: { marginTop: 20, color: "#9ec5acff", fontSize: 16 },
});
