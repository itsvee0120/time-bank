import { supabase } from "@/services/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
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

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password: string) => {
    if (!passwordChecks.length) return "Password must be at least 8 characters";
    if (!passwordChecks.uppercase)
      return "Password must contain an uppercase letter";
    if (!passwordChecks.lowercase)
      return "Password must contain a lowercase letter";
    if (!passwordChecks.number) return "Password must contain a number";
    if (!passwordChecks.special)
      return "Password must contain a special character";
    return null;
  };

  const validateForm = () => {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert("Validation Error", "Enter a valid name");
      return false;
    }
    if (!email.trim() || !validateEmail(email.trim())) {
      Alert.alert("Validation Error", "Enter a valid email");
      return false;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert("Validation Error", passwordError);
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const signUp = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      //  1. Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() }, // optional metadata
          emailRedirectTo: "exp://10.0.0.46:8081/(auth)/profile-setup",
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user returned from Supabase.");

      //  2. The trigger on auth.users automatically creates a row in public.users
      // No manual insert needed. Just navigate or show a message.

      if (authData.session) {
        router.replace("/(app)/home");
      } else {
        Alert.alert(
          "Check Your Email",
          "A confirmation email has been sent. Click the link to continue setting up your profile.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
        );
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      Alert.alert("Sign Up Error", err.message || "Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const renderRequirement = (label: string, met: boolean) => (
    <Text style={{ color: met ? "#4ade80" : "#f87171", marginBottom: 2 }}>
      {met ? "✅ " : "❌ "} {label}
    </Text>
  );

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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#B0B0B0"
              autoCapitalize="words"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#B0B0B0"
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            {/* Password */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholderTextColor="#B0B0B0"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <FontAwesome
                  name={showPassword ? "eye-slash" : "eye"}
                  size={20}
                  color="#84d1a2f3"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholderTextColor="#B0B0B0"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <FontAwesome
                  name={showConfirmPassword ? "eye-slash" : "eye"}
                  size={20}
                  color="#84d1a2f3"
                />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 16 }}>
              {renderRequirement(
                "At least 8 characters",
                passwordChecks.length
              )}
              {renderRequirement(
                "At least one uppercase letter",
                passwordChecks.uppercase
              )}
              {renderRequirement(
                "At least one lowercase letter",
                passwordChecks.lowercase
              )}
              {renderRequirement("At least one number", passwordChecks.number)}
              {renderRequirement(
                "At least one special character",
                passwordChecks.special
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.6 }]}
              disabled={loading}
              onPress={signUp}
            >
              <Text style={styles.buttonText}>
                {loading ? "Creating Account..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity disabled={loading}>
                  <Text style={styles.linkText}>Log In</Text>
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingHorizontal: 16,
  },
  eyeButton: { padding: 4 },
  button: {
    width: "100%",
    height: 48,
    backgroundColor: "#9ec5acff",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "#041b0c", fontSize: 16, fontWeight: "700" },
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
    marginLeft: 4,
  },
});
