import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/services/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const { token_hash, type } = params;

      if (token_hash && type) {
        try {
          // Verify the email token
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token_hash as string,
            type: type as any,
          });

          if (error) {
            console.error("Email verification error:", error);
            router.replace("/(auth)/login");
            return;
          }

          // Success - refresh session & let AuthLayout decide where to go
          await supabase.auth.getSession(); // ensures session is updated
          router.replace("/(auth)/login"); // valid route string // <-- Let AuthLayout handle profile-setup or home
        } catch (err) {
          console.error("Callback error:", err);
          router.replace("/(auth)/login");
        }
      } else {
        router.replace("/(auth)/login");
      }
    };

    handleCallback();
  }, [params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#9ec5acff" />
      <Text style={styles.text}>Verifying your email...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#041b0c",
  },
  text: {
    marginTop: 20,
    color: "#9ec5acff",
    fontSize: 16,
  },
});
