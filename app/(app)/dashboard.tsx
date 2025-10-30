import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/services/supabase";
import { Database } from "@/services/supabaseTypes";
import { useAuth } from "@/services/AuthContext";
import { FontAwesome5 } from "@expo/vector-icons";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];

interface TaskListProps {
  title: string;
  tasks: Task[];
  isRequester: boolean;
}

// Helper to map status to display text and color
const getStatusDisplay = (status: Task["status"]) => {
  let color = "#021305ff";
  let text = "Unknown";

  switch (status) {
    case "open":
      color = "#1d5f36ff"; // Light Green
      text = "Open";
      break;
    case "in_progress":
      color = "#FFD700"; // Gold/Yellow
      text = "In Progress";
      break;
    case "completed":
      color = "#3CB371"; // Medium Green
      text = "Completed";
      break;
    case "cancelled":
      color = "#EF4444"; // Red
      text = "Cancelled";
      break;
  }
  return { color, text };
};

// --- Sub Component for Rendering a List of Tasks ---
const TaskList: React.FC<TaskListProps> = ({ title, tasks, isRequester }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {tasks.length === 0 ? (
      <View style={styles.emptyCard}>
        <FontAwesome5
          name={isRequester ? "clipboard-list" : "hands-helping"}
          size={20}
          color="#D0D0D0"
          style={{ marginBottom: 8 }}
        />
        <Text style={styles.emptyText}>
          {isRequester
            ? "You haven't requested any tasks yet."
            : "You are not currently fulfilling any tasks."}
        </Text>
      </View>
    ) : (
      tasks.map((task) => {
        const status = getStatusDisplay(task.status);

        return (
          <TouchableOpacity
            key={task.id}
            style={styles.taskCard}
            // FIX: Using '/(app)/profile' as a temporary valid route.
            // Replace with `/tasks/${task.id}` when the file `app/(app)/tasks/[id].tsx` is created.
            onPress={() => router.push("/(app)/profile")}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text
                style={[styles.statusBadge, { backgroundColor: status.color }]}
              >
                {status.text}
              </Text>
            </View>
            <Text style={styles.taskDetail}>
              {task.description || "No description provided."}
            </Text>
            <Text style={styles.taskFooter}>
              {isRequester
                ? `Posted on: ${new Date(task.timestamp).toLocaleDateString()}`
                : `Assigned: ${new Date(task.timestamp).toLocaleDateString()}`}
            </Text>
          </TouchableOpacity>
        );
      })
    )}
  </View>
);
// ----------------------------------------------------

export default function TasksPage() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [requestedTasks, setRequestedTasks] = useState<Task[]>([]);
  const [fulfillingTasks, setFulfillingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      // Fetch profile and tasks concurrently
      const [profileResult, requestedResult, fulfillingResult] =
        await Promise.all([
          supabase
            .from("users")
            .select("name, time_balance")
            .eq("id", userId)
            .maybeSingle(),
          supabase
            .from("tasks")
            .select("*")
            .eq("created_by", userId)
            .order("timestamp", { ascending: false }),
          supabase
            .from("tasks")
            .select("*")
            .eq("assigned_to", userId)
            .order("timestamp", { ascending: false }),
        ]);

      // Handle Profile
      if (profileResult.error) {
        console.error("Profile fetch error:", profileResult.error);
        setProfile(null);
      } else {
        setProfile(profileResult.data);
      }

      // Handle Requested Tasks
      if (requestedResult.error) {
        console.error("Requested tasks fetch error:", requestedResult.error);
        setRequestedTasks([]);
      } else {
        setRequestedTasks(requestedResult.data as Task[]);
      }

      // Handle Fulfilling Tasks
      if (fulfillingResult.error) {
        console.error("Fulfilling tasks fetch error:", fulfillingResult.error);
        setFulfillingTasks([]);
      } else {
        setFulfillingTasks(fulfillingResult.data as Task[]);
      }
    } catch (err) {
      console.error("Unexpected error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#84D1A2" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.title}>Welcome, {profile?.name || "User"}!</Text>

      {/* Time Balance Card */}
      <View style={styles.card}>
        <Text style={styles.label}>Available Hours</Text>
        <Text style={styles.balance}>{profile?.time_balance || 0} hours</Text>
      </View>

      {/* Requested Tasks Section */}
      <TaskList
        title="Tasks I Have Requested (My Status)"
        tasks={requestedTasks}
        isRequester={true}
      />

      {/* Tasks I'm Fulfilling Section */}
      <TaskList
        title="Tasks I'm Fulfilling (Others' Status)"
        tasks={fulfillingTasks}
        isRequester={false}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100, // Pad the bottom for the fixed nav bar
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 24,
    marginTop: 20,
  },
  card: {
    backgroundColor: "rgba(132, 209, 162, 0.2)",
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#84D1A2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    color: "#D0D0D0",
    marginBottom: 8,
  },
  balance: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#84D1A2",
  },
  // --- Task/Section Styles ---
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)", // Subtle transparent card
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#84D1A2",
    justifyContent: "center",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  taskDetail: {
    fontSize: 14,
    color: "#D0D0D0",
    marginBottom: 4,
  },
  taskFooter: {
    fontSize: 12,
    color: "#A0A0A0",
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#021709", // Dark text for light badge color
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  emptyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  emptyText: {
    color: "#D0D0D0",
    fontSize: 16,
    textAlign: "center",
  },
});
