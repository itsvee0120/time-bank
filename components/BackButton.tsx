import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AllowedRoutes =
  | "/(app)/dashboard"
  | "/(app)/profile"
  | "/(nested)/settings"
  | "/(nested)/edit-profile";

interface BackButtonProps {
  replaceRoute?: AllowedRoutes;
  tintColor?: string;
  canGoBack?: boolean;
  label?: string;
  href?: string;
}

const BackButton: React.FC<BackButtonProps> = ({
  replaceRoute,
  tintColor,
  label,
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (replaceRoute) {
      router.replace(replaceRoute); // ✅ type-safe now
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.backButton}>
      <View style={styles.backButtonContent}>
        <FontAwesome5
          name="chevron-left"
          size={18}
          color={tintColor ?? "#9ec5acff"}
        />
        <Text style={styles.backButtonText}>{label ?? "Back"}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: { marginLeft: 15, padding: 5 },
  backButtonContent: { flexDirection: "row", alignItems: "center" },
  backButtonText: {
    color: "#9ec5acff",
    fontSize: 18,
    marginLeft: 8,
    fontWeight: "600",
  },
});

export default BackButton;
