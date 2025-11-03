import { TaskCardSkeleton } from "@/components/TaskCardSkeleton";
import { useAuth } from "@/services/AuthContext";
import { supabase } from "@/services/supabase";
import { FontAwesome5 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
  BackHandler,
} from "react-native";

// Type-safe task type
type AvailableTask = {
  id: string;
  title: string;
  location: string | null;
  availability: string | null;
  time_offered: number;
  timestamp: string;
  created_by: { id: string; name: string } | null;
};

// Task card component
const TaskCard: React.FC<{
  task: AvailableTask;
  onCardPress: () => void;
  onUserPress: () => void;
}> = ({ task, onCardPress, onUserPress }) => (
  <TouchableOpacity style={styles.card} onPress={onCardPress}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {task.title}
      </Text>
      <View style={styles.timeBadge}>
        <FontAwesome5 name="clock" size={12} color="#aaffcbff" />
        <Text style={styles.timeText}>{task.time_offered ?? 0} hrs</Text>
      </View>
    </View>
    <View style={styles.postedByContainer}>
      <Text style={styles.cardDate}>Posted by </Text>
      <TouchableOpacity onPress={onUserPress}>
        <Text style={styles.linkText}>
          {task.created_by?.name ?? "Unknown user"}
        </Text>
      </TouchableOpacity>
      <Text style={styles.cardDate}>
        {" "}
        {new Date(task.timestamp).toLocaleDateString()}
      </Text>
    </View>

    <View style={styles.separator} />
    <View style={styles.infoRow}>
      <View style={[styles.infoItem, { flex: 1.2 }]}>
        <FontAwesome5 name="map-marker-alt" style={styles.infoIcon} />
        <Text style={styles.infoText}>{task.location ?? "Not specified"}</Text>
      </View>
      <View style={styles.infoItem}>
        <FontAwesome5 name="laptop-house" style={styles.infoIcon} />
        <Text style={styles.infoText}>
          {task.availability
            ? task.availability.charAt(0).toUpperCase() +
              task.availability.slice(1)
            : "Not specified"}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Main screen component
export default function TasksAvailableScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<AvailableTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState<number>(0);

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [minTime, setMinTime] = useState("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Fetch current time balance
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchUserBalance = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("time_balance")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching user balance:", error.message);
      } else if (data) {
        setUserBalance(data.time_balance ?? 0);
      }
    };
    fetchUserBalance();
  }, [session?.user?.id]);

  // Fetch tasks from Supabase
  const fetchTasks = useCallback(
    async (isRefreshing = false) => {
      if (!session?.user?.id) return;

      if (!isRefreshing) setLoading(true);

      let query = supabase
        .from("tasks")
        .select(
          `
        id,
        title,
        location,
        availability,
        time_offered,
        timestamp,
        users!tasks_created_by_fkey(id, name)
      `
        )
        .eq("status", "Open")
        .neq("created_by", session.user.id);

      if (keyword.trim()) query = query.ilike("title", `%${keyword.trim()}%`);
      if (location.trim())
        query = query.ilike("location", `%${location.trim()}%`);
      if (availability) query = query.eq("availability", availability);
      if (minTime && !isNaN(parseFloat(minTime))) {
        query = query.gte("time_offered", parseFloat(minTime));
      }

      const { data, error } = await query.order("timestamp", {
        ascending: false,
      });

      if (error) {
        console.error("Error fetching available tasks:", error);
        setTasks([]);
      } else if (data) {
        const mapped: AvailableTask[] = data.map((task: any) => ({
          id: task.id,
          title: task.title,
          location: task.location,
          availability: task.availability,
          time_offered: task.time_offered,
          timestamp: task.timestamp,
          created_by: task.users ?? null,
        }));
        setTasks(mapped);
      }

      if (!isRefreshing) setLoading(false);
    },
    [session?.user?.id, keyword, location, availability, minTime]
  );

  useEffect(() => {
    const debounce = setTimeout(() => fetchTasks(), 500);
    return () => clearTimeout(debounce);
  }, [fetchTasks]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks(true).finally(() => setRefreshing(false));
  }, [fetchTasks]);

  // Navigate to a task
  const handleTaskPress = (taskId: string) => {
    router.push({ pathname: "/task/[id]", params: { id: taskId } });
  };

  // Navigate to a user
  const handleUserPress = (userId: string) => {
    router.push({ pathname: "/user/[id]", params: { id: userId } });
  };

  const clearFilters = () => {
    setKeyword("");
    setLocation("");
    setAvailability("");
    setMinTime("");
  };

  const toggleFilter = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFilterExpanded(!isFilterExpanded);
  };

  const handleMinTimeChange = (text: string) => {
    const numericValue = text.replace(/[^0-9.]/g, "");
    if (numericValue === "") {
      setMinTime("");
      return;
    }
    const value = parseFloat(numericValue);
    if (!isNaN(value)) {
      setMinTime(value > userBalance ? userBalance.toString() : numericValue);
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

      <View style={styles.fixedHeaderContainer}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={styles.screenTitle}>Tasks Available</Text>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Your Balance</Text>
              <Text style={styles.balanceValue}>
                {userBalance.toFixed(1)} hrs
              </Text>
            </View>
          </View>

          <View style={styles.filterOuterContainer}>
            <TouchableOpacity
              onPress={toggleFilter}
              style={styles.filterHeader}
            >
              <Text style={styles.filterHeaderText}>Filters</Text>
              <FontAwesome5
                name={isFilterExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color="#9ec5acff"
              />
            </TouchableOpacity>

            {isFilterExpanded && (
              <View style={styles.filterBody}>
                <TextInput
                  style={styles.input}
                  placeholder="Search by keyword..."
                  placeholderTextColor="#ffffff90"
                  value={keyword}
                  onChangeText={setKeyword}
                />
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="Location"
                    placeholderTextColor="#ffffff90"
                    value={location}
                    onChangeText={setLocation}
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder={`Min. Hours (You have ${userBalance.toFixed(
                      1
                    )} hrs)`}
                    placeholderTextColor="#ffffff90"
                    keyboardType="numeric"
                    value={minTime}
                    onChangeText={handleMinTimeChange}
                  />
                </View>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={availability}
                    onValueChange={(itemValue) => setAvailability(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="#ffffff"
                  >
                    <Picker.Item label="Any Availability Mode" value="" />
                    <Picker.Item label="In-person" value="in-person" />
                    <Picker.Item label="Online" value="online" />
                    <Picker.Item label="Both" value="both" />
                  </Picker>
                </View>
                <TouchableOpacity
                  onPress={clearFilters}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollableContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#9ec5acff"]} // Spinner color on Android
            tintColor="#9ec5acff" // Spinner color on iOS
          />
        }
      >
        {loading && !refreshing ? ( // Only show main loader if not refreshing
          <View>
            {Array.from({ length: 5 }).map((_, index) => (
              <TaskCardSkeleton key={index} />
            ))}
          </View>
        ) : tasks.length > 0 ? (
          tasks.map((task) => {
            const { created_by } = task;
            return (
              <TaskCard
                key={task.id}
                task={task}
                onCardPress={() => handleTaskPress(task.id)}
                onUserPress={() => created_by && handleUserPress(created_by.id)}
              />
            );
          })
        ) : (
          <Text style={styles.emptyText}>
            No available tasks match your criteria.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

// Styles remain unchanged
const styles = StyleSheet.create({
  container: { flex: 1 },
  fixedHeaderContainer: { paddingTop: 80 },
  headerContent: { paddingHorizontal: 20 },
  scrollableContent: { paddingHorizontal: 20, paddingBottom: 100 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
  },
  screenTitle: { fontSize: 24, fontWeight: "700", color: "#9ec5acff" },
  balanceContainer: { alignItems: "flex-end" },
  balanceLabel: { color: "#ffffffa0", fontSize: 12 },
  balanceValue: { color: "#aaffcbff", fontSize: 18, fontWeight: "700" },
  filterOuterContainer: {
    backgroundColor: "rgba(2, 23, 9, 0.65)",
    borderRadius: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#ffffff30",
    overflow: "hidden",
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  filterHeaderText: { fontSize: 18, fontWeight: "600", color: "#ffffff" },
  filterBody: { paddingHorizontal: 20, paddingBottom: 20 },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ffffff30",
    marginBottom: 10,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  halfInput: { flex: 1, marginHorizontal: 2 },
  pickerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ffffff30",
    justifyContent: "center",
    height: 50,
    marginBottom: 10,
  },
  picker: { color: "#ffffff" },
  clearButton: { alignItems: "center", padding: 8 },
  clearButtonText: {
    color: "rgba(209, 172, 255, 0.8)",
    textDecorationLine: "underline",
  },
  card: {
    backgroundColor: "rgba(2, 23, 9, 0.7)",
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ffffff30",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
    marginRight: 10,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 211, 153, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  timeText: { color: "#aaffcbff", fontWeight: "bold", marginLeft: 6 },
  cardDate: { fontSize: 12, color: "#ffffff90", marginLeft: 4 },
  postedByContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  separator: { height: 1, backgroundColor: "#ffffff30", marginVertical: 15 },
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  infoIcon: { color: "#9ec5acff", fontSize: 14, width: 20 },
  infoText: { fontSize: 14, color: "#ffffffa0", flexShrink: 1 },
  linkText: {
    fontSize: 12,
    color: "rgba(209, 172, 255, 0.8)",
    textDecorationLine: "underline",
    marginRight: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#ffffffa0",
    textAlign: "center",
    padding: 20,
  },
});
