import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const PolicySection: React.FC<{ title: string; children: string }> = ({
  title,
  children,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionText}>{children}</Text>
  </View>
);

export default function PrivacySecurityScreen() {
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
          <Text style={styles.screenTitle}>Privacy & Security</Text>
        </View>

        <View style={styles.card}>
          <PolicySection title="Data Collection">
            We collect information you provide directly to us, such as when you
            create an account, update your profile, and create or complete
            tasks. This includes your name, email, location, skill sets, and any
            uploaded images or files.
          </PolicySection>

          <View style={styles.separator} />

          <PolicySection title="Data Usage">
            Your data is used to operate, maintain, and provide you with the
            features and functionality of the Houreum platform. We use your
            email for authentication and communication. Your profile information
            is visible to other users to facilitate task exchanges.
          </PolicySection>

          <View style={styles.separator} />

          <PolicySection title="Security">
            We implement security measures designed to protect your information
            from unauthorized access. User authentication is handled securely
            via Supabase Auth. However, no security system is impenetrable, and
            we cannot guarantee the security of our systems 100%.
          </PolicySection>

          <View style={styles.separator} />

          <PolicySection title="User Rights">
            You have the right to access, update, or delete your personal
            information at any time through the 'Edit Profile' screen. Deleting
            your account is a permanent action and will remove all associated
            data from our active databases.
          </PolicySection>

          <View style={styles.separator} />

          <PolicySection title="Contact Us">
            If you have any questions about this Privacy Policy, please contact
            us through the official support channels.
          </PolicySection>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 120 },
  headerContainer: { marginBottom: 20 },
  screenTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#9ec5acff",
  },
  card: {
    backgroundColor: "rgba(2, 23, 9, 0.65)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#ffffff30",
  },
  section: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sectionTitle: {
    color: "#b3d4bfff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionText: {
    color: "#ffffffa0",
    fontSize: 15,
    lineHeight: 22,
  },
  separator: { height: 1, backgroundColor: "#ffffff20", marginHorizontal: 15 },
});
