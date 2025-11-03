import { useAuth } from "@/services/AuthContext";
import { supabase } from "@/services/supabase";
import { Database } from "@/services/supabaseTypes";
import { FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  onTaskAccepted,
  onTaskCompleted,
  scheduleLocalNotification,
} from "@/services/taskNotifications";

const FALLBACK_AVATAR = require("@/assets/images/temp-profile-pic.png");

type TaskDetail = Database["public"]["Tables"]["tasks"]["Row"] & {
  task_attachments?: { file_url: string }[];
  creator_name?: string;
  creator_avatar_url?: string;
};

const StatusDisplay: React.FC<{ task: TaskDetail; isCreator: boolean }> = ({
  task,
  isCreator,
}) => {
  if (task.status === "Open") {
    return isCreator ? (
      <Text style={styles.statusMessage}>
        This is your task. You cannot accept it.
      </Text>
    ) : null;
  }

  if (task.status === "In Progress") {
    return (
      <Text style={styles.statusMessage}>
        Task is currently in progress{" "}
        {isCreator ? "by a volunteer." : "— please start your work."}
      </Text>
    );
  }

  if (task.status === "Completed") {
    return (
      <Text style={styles.statusMessage}>
        Task has been marked completed by the owner.
      </Text>
    );
  }

  return (
    <Text style={styles.statusMessage}>
      This task is currently {task.status?.toLowerCase()}.
    </Text>
  );
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // ----------------------
  // Fetch task details
  // ----------------------
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchTaskDetails = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("detailed_tasks")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setTask(data as TaskDetail);
      } catch (err: any) {
        console.error("Error fetching task details:", err);
        Alert.alert(
          "Error",
          "Could not load task details. Please go back and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [id]);

  // ----------------------
  // Accept task
  // ----------------------
  const handleAcceptTask = async () => {
    if (!session?.user || !task) return;

    if (task.status !== "Open" || task.assigned_to) {
      Alert.alert(
        "Task Unavailable",
        "This task is no longer open or has already been assigned."
      );
      return;
    }

    if (task.created_by === session.user.id) {
      Alert.alert("Cannot Accept", "You cannot accept your own task.");
      return;
    }

    // Disable button immediately
    setIsAccepting(true);

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "In Progress", assigned_to: session.user.id })
        .eq("id", task.id)
        .select()
        .single();

      if (error) {
        console.error("Error accepting task:", error);
        Alert.alert("Error", "Failed to accept the task. Please try again.");
        return;
      }

      Alert.alert("Success", "You have accepted the task!", [
        { text: "OK", onPress: () => router.back() },
      ]);

      // Trigger notifications
      await onTaskAccepted(task.id, session.user.id, task.created_by);

      await scheduleLocalNotification(
        "Task Reminder ⏰",
        `Don't forget to start your task: ${task.title}`,
        3600, // 1 hour later
        { taskId: task.id }
      );
    } finally {
      setIsAccepting(false);
    }
  };

  // ----------------------
  // Complete task (creator only)
  // ----------------------
  const handleCompleteTask = async () => {
    if (!session?.user || !task) return;

    if (task.created_by !== session.user.id) {
      Alert.alert(
        "Cannot Complete",
        "Only the task owner can mark this task complete."
      );
      return;
    }

    if (task.status !== "In Progress") {
      Alert.alert("Cannot Complete", "This task is not in progress.");
      return;
    }

    setIsCompleting(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "Completed" })
        .eq("id", task.id)
        .select()
        .single();

      if (error) {
        console.error("Error completing task:", error);
        Alert.alert("Error", "Failed to mark task as complete.");
        return;
      }

      Alert.alert("Task Completed", "You have marked the task as completed!", [
        { text: "OK", onPress: () => router.back() },
      ]);

      // Notify the assigned user that the task is now complete
      if (task.assigned_to) {
        await onTaskCompleted(task.id, task.assigned_to, task.created_by);
      }
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#9ec5acff" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Task not found.</Text>
      </View>
    );
  }

  const attachment = task.task_attachments?.[0];
  const isCreator = task.created_by === session?.user.id;
  const isAssigned = !!task.assigned_to;
  const isTaskOpen = task.status === "Open";
  const isTaskInProgress = task.status === "In Progress";
  const showAcceptButton = !isCreator && isTaskOpen && !isAssigned;
  const showCompleteButton = isCreator && isAssigned && isTaskInProgress;

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
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{task.title}</Text>
            <View style={styles.timeBadge}>
              <FontAwesome5 name="clock" size={14} color="#aaffcbff" />
              <Text style={styles.timeText}>{task.time_offered} hrs</Text>
            </View>
          </View>

          <Text style={styles.date}>
            Posted on{" "}
            {new Date(task.timestamp ?? Date.now()).toLocaleDateString()}
          </Text>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.infoRow}
            onPress={() =>
              router.push({
                pathname: "/user/[id]",
                params: { id: task.created_by },
              })
            }
          >
            <FontAwesome5 name="user-alt" style={styles.icon} />
            <Text style={styles.label}>Posted By:</Text>
            <Image
              source={
                task.creator_avatar_url
                  ? { uri: task.creator_avatar_url }
                  : FALLBACK_AVATAR
              }
              style={styles.avatar}
            />
            <Text style={styles.linkText}>
              {task.creator_name ?? "Unknown User"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.descriptionLabel}>Description</Text>
          <Text style={styles.description}>{task.description}</Text>

          <View style={styles.separator} />

          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <FontAwesome5 name="map-marker-alt" style={styles.icon} />
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>
                {task.location ?? "Not specified"}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <FontAwesome5 name="laptop-house" style={styles.icon} />
              <Text style={styles.label}>Availability</Text>
              <Text style={styles.value}>
                {task.availability
                  ? task.availability.charAt(0).toUpperCase() +
                    task.availability.slice(1)
                  : "Not specified"}
              </Text>
            </View>
          </View>

          {attachment && (
            <>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <FontAwesome5 name="paperclip" style={styles.icon} />
                <Text style={styles.label}>Attachment:</Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(attachment.file_url)}
                >
                  <Text style={styles.linkText}>View Attachment</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {showAcceptButton && (
          <TouchableOpacity
            style={[styles.button, isAccepting && styles.buttonDisabled]}
            onPress={handleAcceptTask}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <ActivityIndicator color="#041b0c" />
            ) : (
              <>
                <FontAwesome5
                  name="check-circle"
                  size={20}
                  color="#041b0c"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.buttonText}>Accept Task</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {showCompleteButton && (
          <TouchableOpacity
            style={[styles.button, isCompleting && styles.buttonDisabled]}
            onPress={handleCompleteTask}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <ActivityIndicator color="#041b0c" />
            ) : (
              <>
                <FontAwesome5
                  name="flag-checkered"
                  size={20}
                  color="#041b0c"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.buttonText}>Mark Completed</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <StatusDisplay task={task} isCreator={isCreator} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#041b0c",
  },
  errorText: { color: "#ffffff", fontSize: 18 },
  scrollContent: { padding: 20, paddingTop: 120, paddingBottom: 100 },
  card: {
    backgroundColor: "rgba(2, 23, 9, 0.65)",
    padding: 25,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffffff30",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    flex: 1,
    marginRight: 10,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 211, 153, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: { color: "#aaffcbff", fontWeight: "bold", marginLeft: 6 },
  date: { fontSize: 12, color: "#ffffff90", marginTop: 4, marginBottom: 15 },
  separator: { height: 1, backgroundColor: "#ffffff30", marginVertical: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  icon: { color: "#9ec5acff", fontSize: 14, width: 20 },
  label: { fontSize: 14, color: "#ffffffa0", marginRight: 8 },
  value: { fontSize: 14, color: "#ffffff", flexShrink: 1 },
  avatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  descriptionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#b3d4bfff",
    marginTop: 10,
    marginBottom: 5,
  },
  description: { fontSize: 16, color: "#ffffff", lineHeight: 24 },
  grid: { flexDirection: "row", justifyContent: "space-around" },
  gridItem: { alignItems: "center", flex: 1 },
  linkText: {
    fontSize: 14,
    color: "rgba(209, 172, 255, 0.8)",
    textDecorationLine: "underline",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9ec5acff",
    padding: 15,
    borderRadius: 30,
    marginTop: 30,
    height: 55,
  },
  buttonText: { color: "#041b0c", fontSize: 18, fontWeight: "700" },
  buttonDisabled: { backgroundColor: "#9ec5ac99" },
  statusMessage: {
    marginTop: 30,
    fontSize: 16,
    color: "#aaffcbff",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
