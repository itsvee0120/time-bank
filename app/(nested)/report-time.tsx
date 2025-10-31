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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface AssignableTask {
  id: string;
  title: string;
}

export default function ReportTimeScreen() {
  const { session } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<AssignableTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [hoursWorked, setHoursWorked] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const fetchInProgressTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title")
        .eq("assigned_to", session.user.id)
        .eq("status", "In Progress");

      if (error) {
        console.error("Error fetching in-progress tasks:", error);
        Alert.alert("Error", "Could not load your assigned tasks.");
      } else {
        setTasks(data);
        if (data.length > 0) setSelectedTask(data[0].id);
      }
      setLoading(false);
    };

    fetchInProgressTasks();
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
      // Fetch task creator for report_time RPC
      const { data: taskData, error: fetchError } = await supabase
        .from("tasks")
        .select("created_by")
        .eq("id", selectedTask)
        .single();

      if (fetchError || !taskData?.created_by) {
        throw new Error("Could not find task creator.");
      }

      // Call the secure RPC to handle everything
      const { error: rpcError } = await supabase.rpc("report_time", {
        task_id: selectedTask,
        worker_id: session.user.id,
        creator_id: taskData.created_by,
        hours: time,
      });

      if (rpcError) throw rpcError;

      Alert.alert(
        "Success",
        "Your time has been reported and balances updated!",
        // This will correctly return the user to the previous screen,
        // which is typically the dashboard.
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
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
          <Text style={styles.screenTitle}>Report Time Worked</Text>
          <Text style={styles.screenSubtitle}>
            Select a task you've completed and enter your hours worked.
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
                  onValueChange={(itemValue) => setSelectedTask(itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#ffffff"
                >
                  {tasks.map((task) => (
                    <Picker.Item
                      key={task.id}
                      label={task.title}
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
              You have no "In Progress" tasks to report time for.
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
});
