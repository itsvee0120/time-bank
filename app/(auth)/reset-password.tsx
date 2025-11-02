import { supabase } from "@/services/supabase";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkValid, setLinkValid] = useState(false);

  const params = useLocalSearchParams();
  const token = params?.token_hash as string | undefined;

  // Step 1: verify recovery token & user existence
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        Alert.alert("Invalid Link", "User doesn’t exist.");
        router.replace("/(auth)/login");
        return;
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "recovery",
        });

        if (error) throw error;

        if (!data?.user) {
          Alert.alert("Invalid Link", "User doesn’t exist.");
          router.replace("/(auth)/login");
          return;
        }

        // Token valid and user exists
        setLinkValid(true);
      } catch (err: any) {
        console.error("Recovery token error:", err);
        Alert.alert("Invalid Link", "User doesn’t exist or link expired.");
        router.replace("/(auth)/login");
      }
    };

    verifyToken();
  }, [token]);

  // Step 2: update password with the recovery token
  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 8 characters long."
      );
      return;
    }

    if (!token) {
      Alert.alert("Invalid Link", "User doesn’t exist.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser(
        { password: newPassword },
        { accessToken: token } as any
      );

      if (error) throw error;

      Alert.alert("Success", "Your password has been updated!");
      router.replace("/(auth)/login");
    } catch (err: any) {
      console.error("Password update error:", err);
      Alert.alert(
        "Error",
        err.message.includes("invalid") || err.message.includes("expired")
          ? "User doesn’t exist or link expired."
          : err.message || "Failed to update password"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!linkValid) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#9ec5acff" />
        <Text style={styles.loaderText}>Validating reset link...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.outerContainer}
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

// Styles
const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#111827" },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  formContainer: {
    width: "100%",
    backgroundColor: "rgba(2, 23, 9, 0.73)",
    borderRadius: 12,
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#B0B0B0",
    marginBottom: 32,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 52,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    fontSize: 16,
  },
  button: {
    width: "100%",
    height: 52,
    backgroundColor: "#9ec5acff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: "#041b0c",
    fontSize: 16,
    fontWeight: "600",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#041b0c",
    padding: 24,
  },
  loaderText: {
    marginTop: 20,
    color: "#9ec5acff",
    fontSize: 16,
  },
});
