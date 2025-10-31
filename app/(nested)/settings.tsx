import { FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Href, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SettingsItemProps {
  icon: keyof typeof FontAwesome5.glyphMap;
  label: string;
  onPress: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  label,
  onPress,
}) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    <View style={styles.iconWrapper}>
      <FontAwesome5 name={icon} size={20} color="#b3d4bfff" />
    </View>
    <Text style={styles.itemLabel}>{label}</Text>
    <FontAwesome5 name="chevron-right" size={16} color="#ffffff50" />
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();

  const handleNavigate = (path: Href) => {
    router.push(path);
  };

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
          <Text style={styles.screenTitle}>Settings</Text>
        </View>

        <View style={styles.card}>
          <SettingsItem
            icon="user-edit"
            label="Edit Profile"
            onPress={() =>
              handleNavigate("/(nested)/edit-profile")
            } /* Placeholder */
          />
          <View style={styles.separator} />
          <SettingsItem
            icon="bell"
            label="Notifications"
            onPress={() => {}} /* Placeholder */
          />
          <View style={styles.separator} />
          <SettingsItem
            icon="shield-alt"
            label="Privacy & Security"
            onPress={() => {}} /* Placeholder */
          />
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
    borderWidth: 1,
    borderColor: "#ffffff30",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  iconWrapper: { width: 40 },
  itemLabel: { flex: 1, color: "#fff", fontSize: 18, fontWeight: "500" },
  separator: { height: 1, backgroundColor: "#ffffff20", marginHorizontal: 15 },
});
