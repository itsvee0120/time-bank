import { FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";

interface NotificationToggleProps {
  icon: keyof typeof FontAwesome5.glyphMap;
  label: string;
  description: string;
  isEnabled: boolean;
  onToggle: () => void;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({
  icon,
  label,
  description,
  isEnabled,
  onToggle,
}) => (
  <View style={styles.itemContainer}>
    <View style={styles.iconWrapper}>
      <FontAwesome5 name={icon} size={20} color="#b3d4bfff" />
    </View>
    <View style={styles.textWrapper}>
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={styles.itemDescription}>{description}</Text>
    </View>
    <Switch
      trackColor={{ false: "#767577", true: "#81b0ff" }}
      thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
      ios_backgroundColor="#3e3e3e"
      onValueChange={onToggle}
      value={isEnabled}
    />
  </View>
);

export default function NotificationSettingsScreen() {
  // In a real app, this state would come from the user's profile in the database
  const [taskAccepted, setTaskAccepted] = useState(true);
  const [taskCompleted, setTaskCompleted] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(false);

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
          <Text style={styles.screenTitle}>Notifications</Text>
        </View>

        <View style={styles.card}>
          <NotificationToggle
            icon="check-circle"
            label="Task Accepted"
            description="When someone accepts your task request."
            isEnabled={taskAccepted}
            onToggle={() => setTaskAccepted((prev) => !prev)}
          />
          <View style={styles.separator} />
          <NotificationToggle
            icon="star"
            label="Task Completed"
            description="When someone completes a task for you."
            isEnabled={taskCompleted}
            onToggle={() => setTaskCompleted((prev) => !prev)}
          />
          <View style={styles.separator} />
          <NotificationToggle
            icon="clock"
            label="Daily Reminder"
            description="A daily prompt to check for new tasks."
            isEnabled={dailyReminder}
            onToggle={() => setDailyReminder((prev) => !prev)}
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
  textWrapper: { flex: 1, marginRight: 10 },
  itemLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 4,
  },
  itemDescription: { color: "#ffffffa0", fontSize: 14 },
  separator: { height: 1, backgroundColor: "#ffffff20", marginHorizontal: 15 },
});
