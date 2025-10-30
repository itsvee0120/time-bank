import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image, // Import Image component
} from "react-native";
import { Link, router } from "expo-router";
// Removed LinearGradient import
import { supabase } from "@/services/supabase";

// Define the path to your logo
const LOGO_BACKGROUND = require("@/assets/images/login.png");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      Alert.alert("Validation Error", "Please enter your email");
      return false;
    }
    if (!password) {
      Alert.alert("Validation Error", "Please enter your password");
      return false;
    }
    return true;
  };

  async function signIn() {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          Alert.alert(
            "Email Not Confirmed",
            "Please confirm your email before logging in.",
            [
              {
                text: "Resend Email",
                onPress: async () => {
                  const { error: resendError } = await supabase.auth.resend({
                    type: "signup",
                    email: email.trim(),
                  });
                  if (resendError) Alert.alert("Error", resendError.message);
                  else Alert.alert("Email Sent", "Confirmation email resent.");
                },
              },
              { text: "OK", style: "cancel" },
            ]
          );
        } else {
          Alert.alert("Login Error", error.message);
        }
        setLoading(false);
        return;
      }

      // Success - AuthLayout will handle navigation
      // Don't call router.replace here
    } catch (err) {
      console.error("SignIn error:", err);
      Alert.alert("Login Error", "Unexpected error occurred.");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmationEmail() {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert(
          "Email Sent",
          "Confirmation email has been resent. Please check your inbox."
        );
      }
    } catch (err) {
      console.error("Resend error:", err);
      Alert.alert("Error", "Failed to resend confirmation email");
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      Alert.alert(
        "Enter Email",
        "Please enter your email address first, then tap 'Forgot Password?' again."
      );
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: undefined, // Set your deep link URL here
        }
      );

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert(
          "Check Your Email",
          "Password reset instructions have been sent to your email."
        );
      }
    } catch (err) {
      console.error("Password reset error:", err);
      Alert.alert("Error", "Failed to send password reset email");
    }
  }

  return (
    <View style={styles.outerContainer}>
      <Image
        source={LOGO_BACKGROUND}
        style={styles.backgroundImage}
        resizeMode="cover" // Ensure the image covers the whole screen
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <TextInput
              style={styles.input}
              onChangeText={setEmail}
              value={email}
              placeholder="Email"
              placeholderTextColor="#B0B0B0"
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              onChangeText={setPassword}
              value={password}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor="#B0B0B0"
              autoCapitalize="none"
              editable={!loading}
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={resetPassword}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              disabled={loading}
              onPress={signIn}
            >
              <Text style={styles.buttonText}>
                {loading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity disabled={loading}>
                  <Text style={styles.linkText}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#111827", // Fallback background color
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    left: 0,
    top: 0,
  },
  // Removed topCircleOverlay and bottomCircleOverlay styles
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "transparent",
  },
  formContainer: {
    width: "100%",
    // Retain dark semi-transparent overlay for legibility
    backgroundColor: "rgba(2, 23, 9, 0.73)",
    borderRadius: 12,
    padding: 20,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#84d1a2f3",
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    width: "100%",
    height: 48,
    backgroundColor: "rgba(2, 23, 9, 0.73)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: "#6366F1",
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#D0D0D0",
    fontSize: 14,
  },
  linkText: {
    color: "#84d1a2f3",
    fontSize: 14,
    fontWeight: "600",
  },
});
