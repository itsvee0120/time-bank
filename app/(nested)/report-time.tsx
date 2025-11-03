import { useAuth } from "@/services/AuthContext";
import { notifyTaskEvent } from "@/services/notifications";
import { supabase } from "@/services/supabase";
import { FontAwesome5 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
  BackHandler,
} from "react-native";

interface AssignableTask {
  id: string;
  title: string;
  time_offered: number;
  status: string;
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

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (router.canGoBack()) {
          router.replace("/dashboard");
        }
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [router])
  );

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

    const fetchInProgressTasks = async () => {
      setLoading(true);
      try {
        // Fetch "In Progress" tasks assigned to this user that haven't been reported yet
        const { data: tasksData, error: taskError } = await supabase
          .from("tasks")
          .select("id, title, time_offered, status, reported_hours")
          .eq("assigned_to", session.user.id)
          .eq("status", "In Progress")
          .is("reported_hours", null); // Only tasks without reported hours

        if (taskError) throw taskError;

        setTasks(tasksData || []);
        if (tasksData && tasksData.length > 0) {
          setSelectedTask(tasksData[0].id);
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
        Alert.alert(
          "Error",
          "Could not load tasks available for time reporting."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInProgressTasks();

    // Watch for new task assignments
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
          if (
            payload.new.status === "In Progress" &&
            !payload.new.reported_hours
          ) {
            setTasks((prev) => {
              if (prev.some((t) => t.id === payload.new.id)) return prev;
              const message = `New task available: "${payload.new.title}"`;
              if (Platform.OS === "android") {
                ToastAndroid.show(message, ToastAndroid.SHORT);
              } else {
                Alert.alert("New Task", message);
              }
              setNewTaskAvailable(true);
              return [
                {
                  id: payload.new.id,
                  title: payload.new.title,
                  time_offered: payload.new.time_offered || 0,
                  status: payload.new.status,
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
    if (!session || !session.user) {
      Alert.alert("Error", "You must be logged in.");
      return;
    }

    const time = parseFloat(hoursWorked);
    if (!selectedTask || isNaN(time) || time <= 0) {
      Alert.alert("Invalid Input", "Enter a valid number of hours.");
      return;
    }

    const task = tasks.find((t) => t.id === selectedTask);
    if (!task) return Alert.alert("Error", "Task not found.");

    if (time > task.time_offered * 1.5) {
      Alert.alert(
        "Time Exceeds Offered Hours",
        `You're reporting ${time} hours (offered: ${task.time_offered}). Owner will review.`,
        [
          { text: "Cancel" },
          { text: "Continue", onPress: () => submitReport(time) },
        ]
      );
    } else {
      await submitReport(time);
    }
  };

  const submitReport = async (time: number) => {
    if (!session?.user) return; // extra safety
    const userId = session.user.id;

    setSubmitting(true);
    try {
      const { data: taskData, error } = await supabase
        .from("tasks")
        .select("created_by, title")
        .eq("id", selectedTask)
        .single();
      if (error || !taskData) throw new Error("Task not found.");

      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          reported_hours: time,
          reported_by: userId,
          reported_at: new Date().toISOString(),
        })
        .eq("id", selectedTask);
      if (updateError) throw updateError;

      await notifyTaskEvent(
        taskData.created_by,
        "task_completed",
        "Time Reported ⏱️",
        `${time} hours reported for task: ${taskData.title}. Please review.`,
        selectedTask
      );

      setTasks((prev) => prev.filter((t) => t.id !== selectedTask));
      setSelectedTask("");
      setHoursWorked("");

      Alert.alert("Success", "Your time has been reported!");
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
            Report the hours you worked on your assigned tasks. The owner will
            review and approve.
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
                      label={`${task.title} — ${task.time_offered} hrs offered`}
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
                keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
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
                    <Text style={styles.submitButtonText}>Report Time</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome5
                name="clipboard-check"
                size={48}
                color="#9ec5acff"
              />
              <Text style={styles.emptyText}>
                No tasks available to report time for.
              </Text>
              <Text style={styles.emptySubtext}>
                Accept a task and complete it to report your hours here.
              </Text>
            </View>
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
  screenSubtitle: { fontSize: 16, color: "#ffffffa0", lineHeight: 22 },
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
  emptyContainer: {
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#ffffffa0",
    textAlign: "center",
    marginTop: 15,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ffffff60",
    textAlign: "center",
    marginTop: 8,
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
