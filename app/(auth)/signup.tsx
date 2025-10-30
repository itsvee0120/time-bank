import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { supabase } from "@/services/supabase";

// Background image
const LOGO_BACKGROUND = require("@/assets/images/login.png");

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Password requirement checks
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password: string): string | null => {
    if (!passwordChecks.length) return "Password must be at least 8 characters";
    if (!passwordChecks.uppercase)
      return "Password must contain at least one uppercase letter";
    if (!passwordChecks.lowercase)
      return "Password must contain at least one lowercase letter";
    if (!passwordChecks.number)
      return "Password must contain at least one number";
    return null;
  };

  const validateForm = (): boolean => {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert("Validation Error", "Please enter a valid name");
      return false;
    }
    if (!email.trim() || !validateEmail(email.trim())) {
      Alert.alert("Validation Error", "Please enter a valid email");
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

  async function signUp() {
    if (!validateForm()) return;
    setLoading(true);

    try {
      // Step 1: Create Supabase Auth user
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() } },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          Alert.alert("Account Exists", "Email already registered.", [
            {
              text: "Go to Login",
              onPress: () => router.replace("/(auth)/login"),
            },
            { text: "Cancel", style: "cancel" },
          ]);
        } else {
          Alert.alert("Sign Up Error", error.message);
        }
        setLoading(false);
        return;
      }

      const user = data?.user;
      const session = data?.session;

      if (!user) {
        Alert.alert("Sign Up Error", "No user returned from Supabase.");
        setLoading(false);
        return;
      }

      // Step 2: Insert user record (if signed in instantly)
      if (session) {
        const { error: insertError } = await supabase.from("users").insert({
          id: user.id,
          name: name.trim(),
          email: email.trim(),
          is_profile_complete: false,
        });

        if (insertError) {
          console.error("Users insert error:", insertError);
          Alert.alert("Error", "Failed to create user record.");
          setLoading(false);
          return;
        }

        // Success - AuthLayout will detect the session and redirect to profile-setup
        // Don't call router.replace here
      } else {
        // Step 3: Email confirmation case - this is fine to navigate
        Alert.alert(
          "Check Your Email",
          "A confirmation email has been sent. Please verify your email before logging in.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
        );
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Sign Up Error", "Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  const renderRequirement = (label: string, met: boolean) => (
    <Text style={[styles.bulletItem, { color: met ? "#4ade80" : "#f87171" }]}>
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
              editable={!loading}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#B0B0B0"
              editable={!loading}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#B0B0B0"
              editable={!loading}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor="#B0B0B0"
              editable={!loading}
              secureTextEntry
            />

            {/* Live Password Check */}
            <View style={styles.bulletList}>
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
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              disabled={loading}
              onPress={signUp}
            >
              <Text style={styles.buttonText}>
                {loading ? "Creating Account..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            {/* Already have an account? */}
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

// Styles
const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#111827" },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    left: 0,
    top: 0,
  },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "transparent",
  },
  formContainer: {
    width: "100%",
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
  bulletList: { marginBottom: 16 },
  bulletItem: { fontSize: 14, marginBottom: 2 },
  button: {
    width: "100%",
    height: 48,
    backgroundColor: "rgba(2, 23, 9, 0.73)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: { backgroundColor: "#6366F1", opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  footerText: { color: "#D0D0D0", fontSize: 14 },
  linkText: {
    color: "#84d1a2f3",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
});
