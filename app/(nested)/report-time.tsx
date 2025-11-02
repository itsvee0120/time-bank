import { useAuth } from "@/services/AuthContext";
import { supabase } from "@/services/supabase";
import { FontAwesome5 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";

interface AssignableTask {
  id: string;
  title: string;
  time_offered: number; // added to include time offered
}

export default function ReportTimeScreen() {
  const { session } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<AssignableTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [hoursWorked, setHoursWorked] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newTaskAvailable, setNewTaskAvailable] = useState(false);
  const pulseAnim = new Animated.Value(1);

  // Animate badge when a new completed task appears
  useEffect(() => {
    if (newTaskAvailable) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [newTaskAvailable]);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const fetchCompletedTasks = async () => {
      setLoading(true);
      try {
        // Fetch completed tasks assigned to this user
        const { data: completedTasks, error: taskError } = await supabase
          .from("tasks")
          .select("id, title, time_offered") // include time_offered
          .eq("assigned_to", session.user.id)
          .eq("status", "Completed");

        if (taskError) throw taskError;

        // Fetch ledger entries for this user (already reported)
        const { data: ledgerEntries, error: ledgerError } = await supabase
          .from("ledger")
          .select("task_id")
          .eq("user_id", session.user.id);

        if (ledgerError) throw ledgerError;

        const reportedTaskIds = ledgerEntries.map((entry) => entry.task_id);

        // Only show tasks not already in ledger
        const eligibleTasks = completedTasks.filter(
          (t) => !reportedTaskIds.includes(t.id)
        );

        setTasks(eligibleTasks);
        if (eligibleTasks.length > 0) setSelectedTask(eligibleTasks[0].id);
      } catch (err) {
        console.error("Error fetching eligible tasks:", err);
        Alert.alert(
          "Error",
          "Could not load tasks available for time reporting."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedTasks();

    // Watch for tasks becoming completed
    const subscription = supabase
      .channel("public:tasks")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `assigned_to=eq.${session.user.id}`,
        },
        (payload) => {
          if (payload.new.status === "Completed") {
            setTasks((prev) => {
              if (prev.some((t) => t.id === payload.new.id)) return prev;
              const message = `Task "${payload.new.title}" marked complete!`;
              if (Platform.OS === "android") {
                ToastAndroid.show(message, ToastAndroid.SHORT);
              } else {
                Alert.alert("Task Completed", message);
              }
              setNewTaskAvailable(true);
              return [
                {
                  id: payload.new.id,
                  title: payload.new.title,
                  time_offered: payload.new.time_offered || 0,
                },
                ...prev,
              ];
            });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(subscription);
    };
  }, [session?.user?.id]);

  const handleSubmit = async () => {
    if (!session?.user) {
      Alert.alert("Error", "You must be logged in.");
      return;
    }

    const time = parseFloat(hoursWorked);
    if (!selectedTask || !hoursWorked) {
      Alert.alert("Missing Fields", "Please select a task and enter hours.");
      return;
    }
    if (isNaN(time) || time <= 0) {
      Alert.alert("Invalid Time", "Please enter a valid number of hours.");
      return;
    }

    setSubmitting(true);

    try {
      // Ensure this task hasn’t already been reported
      const { data: existing, error: existingError } = await supabase
        .from("ledger")
        .select("id")
        .eq("task_id", selectedTask)
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing) {
        Alert.alert("Already Reported", "You’ve already reported this task.");
        return;
      }

      // Get task creator
      const { data: taskData, error: fetchError } = await supabase
        .from("tasks")
        .select("created_by")
        .eq("id", selectedTask)
        .single();

      if (fetchError || !taskData?.created_by)
        throw new Error("Could not find task creator.");

      // Call RPC to record and update balances
      const { error: rpcError } = await supabase.rpc("report_time", {
        task_id: selectedTask,
        worker_id: session.user.id,
        creator_id: taskData.created_by,
        hours: time,
      });

      if (rpcError) throw rpcError;

      // Remove from picker instantly
      setTasks((prev) => prev.filter((t) => t.id !== selectedTask));
      setSelectedTask("");

      Alert.alert(
        "Success",
        "Your time has been reported and balances updated!",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err) {
      console.error("Time reporting error:", err);
      Alert.alert("Error", "Failed to report time. Please try again.");
    } finally {
      setSubmitting(false);
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

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.headerContainer}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.screenTitle}>Report Time Worked</Text>
            {newTaskAvailable && (
              <Animated.View
                style={[
                  styles.badgeContainer,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <FontAwesome5 name="bell" size={16} color="#041b0c" />
              </Animated.View>
            )}
          </View>
          <Text style={styles.screenSubtitle}>
            Select a task marked completed by the owner and enter your hours
            worked.
          </Text>
        </View>

        <View style={styles.formCard}>
          {loading ? (
            <ActivityIndicator color="#9ec5acff" size="large" />
          ) : tasks.length > 0 ? (
            <>
              <Text style={styles.formLabel}>Select Task</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedTask}
                  onValueChange={(itemValue: string) =>
                    setSelectedTask(itemValue)
                  }
                  style={styles.picker}
                  dropdownIconColor="#ffffff"
                >
                  {tasks.map((task) => (
                    <Picker.Item
                      key={task.id}
                      label={`${task.title} — ${task.time_offered} hours offered`}
                      value={task.id}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.formLabel}>Hours Worked</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2.5"
                placeholderTextColor="#ffffff90"
                keyboardType="numeric"
                value={hoursWorked}
                onChangeText={setHoursWorked}
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  submitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#041b0c" />
                ) : (
                  <>
                    <FontAwesome5
                      name="check-circle"
                      size={20}
                      color="#041b0c"
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.submitButtonText}>Submit Time</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.emptyText}>
              No tasks are available to report time for.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollViewContent: { padding: 20, paddingTop: 120, alignItems: "center" },
  headerContainer: { width: "100%", marginBottom: 30, alignSelf: "flex-start" },
  screenTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#9ec5acff",
    marginBottom: 5,
  },
  screenSubtitle: { fontSize: 16, color: "#ffffffa0" },
  formCard: {
    backgroundColor: "rgba(2, 23, 9, 0.55)",
    padding: 25,
    borderRadius: 40,
    width: "100%",
    minHeight: 200,
    justifyContent: "center",
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#b3d4bfff",
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
    padding: 15,
    borderRadius: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ffffff30",
  },
  pickerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ffffff30",
    justifyContent: "center",
  },
  picker: { color: "#ffffff", height: 55 },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9ec5acff",
    padding: 15,
    borderRadius: 30,
    marginTop: 30,
    height: 55,
  },
  submitButtonText: { color: "#041b0c", fontSize: 18, fontWeight: "700" },
  submitButtonDisabled: { backgroundColor: "#9ec5ac99" },
  emptyText: {
    fontSize: 16,
    color: "#ffffffa0",
    textAlign: "center",
    padding: 20,
  },
  badgeContainer: {
    marginLeft: 10,
    backgroundColor: "#9ec5acff",
    borderRadius: 20,
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#9ec5ac",
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
});
