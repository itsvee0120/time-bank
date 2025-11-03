import { useAuth } from "@/services/AuthContext";
import { supabase } from "@/services/supabase";
import { FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

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

type NotificationSettings = {
  notifications_task_accepted: boolean;
  notifications_task_completed: boolean;
  notifications_daily_reminder: boolean;
};

export default function NotificationSettingsScreen() {
  const { session } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch settings on component mount
  useEffect(() => {
    if (!session?.user.id) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select(
            "notifications_task_accepted, notifications_task_completed, notifications_daily_reminder"
          )
          .eq("id", session.user.id)
          .single();

        if (error) throw error;

        if (data) {
          setSettings(data as NotificationSettings);
        }
      } catch (error) {
        console.error("Error fetching notification settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [session?.user.id]);

  // Update setting in local state and database
  const handleToggle = async (
    key: keyof NotificationSettings,
    value: boolean
  ) => {
    if (!session?.user.id || !settings) return;

    // Optimistically update UI
    setSettings({ ...settings, [key]: value });

    // Update database
    const { error } = await supabase
      .from("users")
      .update({ [key]: value })
      .eq("id", session.user.id);

    if (error) {
      console.error(`Error updating ${key}:`, error);
      // Optionally, revert UI and show an error
      setSettings({ ...settings, [key]: !value });
    }
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
          <Text style={styles.screenTitle}>Notifications</Text>
        </View>

        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#9ec5acff"
              style={{ padding: 40 }}
            />
          ) : settings ? (
            <>
              <NotificationToggle
                icon="check-circle"
                label="Task Accepted"
                description="When someone accepts your task request."
                isEnabled={settings.notifications_task_accepted}
                onToggle={() =>
                  handleToggle(
                    "notifications_task_accepted",
                    !settings.notifications_task_accepted
                  )
                }
              />
              <View style={styles.separator} />
              <NotificationToggle
                icon="star"
                label="Task Completed"
                description="When a task you're assigned is marked complete."
                isEnabled={settings.notifications_task_completed}
                onToggle={() =>
                  handleToggle(
                    "notifications_task_completed",
                    !settings.notifications_task_completed
                  )
                }
              />
              <View style={styles.separator} />
              <NotificationToggle
                icon="clock"
                label="Daily Reminder"
                description="A daily prompt to check for new tasks."
                isEnabled={settings.notifications_daily_reminder}
                onToggle={() =>
                  handleToggle(
                    "notifications_daily_reminder",
                    !settings.notifications_daily_reminder
                  )
                }
              />
            </>
          ) : (
            <Text style={styles.itemDescription}>Could not load settings.</Text>
          )}
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
