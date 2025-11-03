import { FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const DEVELOPER_AVATAR = require("@/assets/images/temp-profile-pic.png");

const InfoSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {typeof children === "string" ? (
      <Text style={styles.sectionText}>{children}</Text>
    ) : (
      children
    )}
  </View>
);

export default function AboutDeveloperScreen() {
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
          <Text style={styles.screenTitle}>About the Developer</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Image
              source={require("@/assets/images/Violet_Color_Circular.png")}
              style={styles.avatar}
            />
            <Text style={styles.name}>Violet Nguyen</Text>
          </View>

          <InfoSection title="Mission">
            This app was created to foster a sense of community and mutual
            support. The goal is to build a platform where time and skills are
            the currency, allowing everyone to contribute and benefit.
          </InfoSection>

          <View style={styles.separator} />

          <InfoSection title="Contact">
            <Text style={styles.sectionText}>
              For support, feedback, or inquiries, please feel free to reach out
              via the "Report Suspicious Activity" link in the settings or
              directly at{" "}
              <Text
                style={styles.linkText}
                onPress={() => Linking.openURL("mailto:itsveedev@gmail.com")}
              >
                itsveedev@gmail.com
              </Text>
              .
            </Text>
          </InfoSection>

          <View style={styles.separator} />

          <InfoSection title="Find me on">
            <View style={styles.socialLinksContainer}>
              <TouchableOpacity
                style={styles.socialLink}
                onPress={() => Linking.openURL("https://github.com/itsvee0120")}
              >
                <FontAwesome5 name="github" size={24} color="#b3d4bfff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialLink}
                onPress={() =>
                  Linking.openURL(
                    "https://itsvee0120.github.io/violet-website/"
                  )
                }
              >
                <FontAwesome5 name="globe" size={24} color="#b3d4bfff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialLink}
                onPress={() =>
                  Linking.openURL(
                    "https://www.linkedin.com/in/violetnguyen0120"
                  )
                }
              >
                <FontAwesome5 name="linkedin" size={24} color="#b3d4bfff" />
              </TouchableOpacity>
            </View>
          </InfoSection>
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
    padding: 25,
    borderWidth: 1,
    borderColor: "#ffffff30",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#9ec5acff",
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  section: {
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
  separator: { height: 1, backgroundColor: "#ffffff20", marginVertical: 15 },
  socialLinksContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 10,
  },
  socialLink: {
    padding: 10,
  },
  linkText: {
    color: "rgba(209, 172, 255, 0.9)",
    textDecorationLine: "underline",
    fontSize: 15,
  },
});
