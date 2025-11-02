import { useAuth } from "@/services/AuthContext"; // Assuming this path
import { useScroll } from "@/services/ScrollContext";
import { supabase } from "@/services/supabase"; // Assuming this path
import { FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router"; // 👈 ADDED FOR NAVIGATION
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Types based on your Supabase Schema ---
interface LedgerTask {
  id: string;
  time_earned: number;
  // task (from join with tasks table)
  tasks: {
    id: string;
    title: string;
    status: string;
  } | null;
}

interface TaskData {
  id: string;
  details: string;
  timeEarned: string;
}

// --- Constants ---
const FALLBACK_AVATAR = require("@/assets/images/temp-profile-pic.png");
const BUTTON_HEIGHT = 45;

// --- Helper Functions ---
const formatHours = (hours: number): string => {
  // Ensure the time format looks clean (e.g., 1.5 hours)
  return `${hours} hour${hours !== 1 ? "s" : ""}`;
};

// --- Reusable TaskRow Component ---
interface TaskRowProps extends TaskData {
  onPress: () => void;
}
const TaskRow: React.FC<TaskRowProps> = ({ details, timeEarned, onPress }) => (
  <TouchableOpacity style={styles.taskRow} onPress={onPress}>
    <Text style={styles.taskDetails} numberOfLines={1}>
      {details}
    </Text>
    <Text style={styles.timeEarned}>{timeEarned}</Text>
  </TouchableOpacity>
);

// --- Reusable ActionButton Component ---
interface ActionButtonProps {
  iconName: keyof typeof FontAwesome5.glyphMap;
  label: string;
  onPress: () => void;
  style: "primary" | "secondary" | "tertiary";
  isRightButton?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  iconName,
  label,
  onPress,
  style,
  isRightButton,
}) => {
  let buttonStyle;
  let textStyle;
  let iconColor;

  if (style === "primary") {
    buttonStyle = styles.primaryButton;
    textStyle = styles.primaryButtonText;
    iconColor = "#ffffff";
  } else if (style === "secondary") {
    buttonStyle = styles.secondaryButton;
    textStyle = styles.secondaryButtonText;
    iconColor = "#1d5e3aff";
  } else {
    buttonStyle = styles.tertiaryButton;
    textStyle = styles.tertiaryButtonText;
    iconColor = "#041b0c";
  }

  return (
    <TouchableOpacity
      style={[
        styles.actionButtonBase,
        buttonStyle,
        isRightButton && styles.tertiaryButtonRight,
      ]}
      onPress={onPress}
    >
      <FontAwesome5
        name={iconName}
        size={20}
        color={iconColor}
        style={styles.actionIcon}
      />
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
};

// --- Reusable MiniTimeBalanceCard Component ---
const MiniTimeBalanceCard: React.FC<{ balance: number }> = ({ balance }) => (
  <View style={styles.miniBalanceCard}>
    <Text style={styles.miniBalanceLabel}>Time Balance</Text>
    <Text style={styles.miniBalanceValue}>{balance} hrs</Text>
  </View>
);

export default function Dashboard() {
  const { session } = useAuth();
  const { scrollY } = useScroll();
  const router = useRouter(); // 👈 INITIALIZED ROUTER
  const userId = session?.user?.id;
  const [username, setUsername] = useState("User");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoaded, setAvatarLoaded] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<TaskData[]>([]);
  const [ongoingTasks, setOngoingTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<"ongoing" | "completed">(
    "ongoing"
  );

  // --- Data Fetching Logic ---
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);

      // 1. Fetch User Data (Name, Avatar, and Balance)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("name, avatar_url, time_balance")
        .eq("id", userId)
        .single();

      if (!userError && userData) {
        setUsername(userData.name ?? "User");
        setAvatarUrl(userData.avatar_url ?? null);
        setBalance(userData.time_balance ?? 2);
      } else {
        console.log("Error fetching user data:", userError?.message);
      }

      // 2. Fetch Task Ledger Data (Completed)
      const { data: ledgerData, error: ledgerError } = await supabase
        .from("ledger")
        .select(
          `
          id,
          time_earned,
          tasks (
            id,
            title,
            status
          )
          `
        )
        .eq("user_id", userId)
        // Only fetch tasks where time was actually earned (completed)
        .gt("time_earned", 0);

      if (!ledgerError && ledgerData) {
        const completed: TaskData[] = ledgerData.map((item: LedgerTask) => ({
          id: item.tasks?.id ?? "",
          details: item.tasks?.title ?? "Unknown Task",
          timeEarned: formatHours(item.time_earned),
        }));

        setCompletedTasks(completed);
      } else {
        console.log(
          "Error fetching completed ledger data:",
          ledgerError?.message
        );
      }

      // 3. Fetch Ongoing Tasks (Tasks assigned to user but not completed)
      const { data: ongoingTasksData, error: ongoingError } = await supabase
        .from("tasks")
        .select("id, title")
        .eq("assigned_to", userId)
        // Filter out tasks that are already completed
        .neq("status", "Completed");

      if (!ongoingError && ongoingTasksData) {
        const ongoing: TaskData[] = ongoingTasksData.map((task) => ({
          id: task.id,
          details: task.title,
          // Placeholder for ongoing tasks
          timeEarned: "N/A",
        }));
        setOngoingTasks(ongoing);
      } else {
        console.log("Error fetching ongoing tasks:", ongoingError?.message);
      }

      setLoading(false);
    };

    fetchData();
  }, [userId]);

  // --- Button Navigation Logic ---
  const handleRequestHelp = () => {
    // Navigate to app/(nested)/requests.tsx
    router.push("/requests");
  };
  const handleTasksAvailable = () => {
    // Navigate to app/(nested)/tasks-available.tsx
    router.push("/tasks-available");
  };
  const handleMyRequests = () => {
    router.push("/my-requests");
  };
  const handleReportTime = () => {
    router.push("/report-time");
  };

  const handleTaskPress = (taskId: string) => {
    router.push({ pathname: "/task/[id]", params: { id: taskId } });
  };

  // Determine avatar source
  const avatarSource =
    avatarUrl && avatarLoaded ? { uri: avatarUrl } : FALLBACK_AVATAR;

  return (
    <View style={styles.container}>
      {/* Background: Linear Gradient and BlurView */}
      <LinearGradient
        colors={["#041b0c", "rgba(2,23,9,0.55)", "rgba(2,23,9,0.2)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <BlurView
        intensity={25}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.ScrollView
        contentContainerStyle={styles.scrollViewContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Header Row */}
        <View style={styles.mainHeaderRow}>
          {/* Left side: Avatar and Title */}
          <View style={styles.headerContainer}>
            <Image
              source={avatarSource}
              style={styles.avatar}
              onError={() => setAvatarLoaded(false)}
            />
            <View>
              <Text style={styles.dashboardTitle}>Your Dashboard</Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
          </View>
          {/* Right side: Mini Balance Card */}
          <MiniTimeBalanceCard balance={balance} />
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionButtonRow}>
          <ActionButton
            iconName="plus-circle"
            label="Request Help"
            onPress={handleRequestHelp}
            style="primary"
          />
          <ActionButton
            iconName="file-alt"
            label="Tasks Available"
            onPress={handleTasksAvailable}
            style="secondary"
          />
        </View>

        {/* Second Action Buttons Row */}
        <View style={styles.actionButtonRow}>
          <ActionButton
            iconName="list-alt"
            label="My Requests"
            onPress={handleMyRequests}
            style="tertiary"
          />
          <ActionButton
            iconName="clock"
            label="Report Time"
            onPress={handleReportTime}
            style="tertiary"
            isRightButton={true}
          />
        </View>

        {/* Task Ledger */}
        <View style={styles.taskLedgerContainer}>
          <Text style={styles.taskLedgerTitle}>Task Ledger</Text>

          <View style={styles.ledgerCard}>
            {loading ? (
              <ActivityIndicator
                size="large"
                color="#9ec5acff"
                style={{ padding: 20 }}
              />
            ) : (
              <View>
                {/* Tab UI for Tasks */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === "ongoing" && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab("ongoing")}
                  >
                    <Text style={styles.tabText}>Ongoing</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === "completed" && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab("completed")}
                  >
                    <Text style={styles.tabText}>Completed</Text>
                  </TouchableOpacity>
                </View>

                {/* Content based on active tab */}
                <View style={styles.listContentContainer}>
                  <View style={styles.headerRow}>
                    <Text style={styles.headerTextLeft}>Task Details</Text>
                    <Text style={styles.headerTextRight}>Time</Text>
                  </View>
                  {activeTab === "ongoing" &&
                    (ongoingTasks.length > 0 ? (
                      ongoingTasks.map((task) => (
                        <TaskRow
                          key={`ongoing-${task.id}`}
                          {...task}
                          onPress={() => handleTaskPress(task.id)}
                        />
                      ))
                    ) : (
                      <Text style={styles.emptyText}>
                        No ongoing tasks found.
                      </Text>
                    ))}
                  {activeTab === "completed" &&
                    (completedTasks.length > 0 ? (
                      completedTasks.map((task) => (
                        <TaskRow
                          key={`completed-${task.id}`}
                          {...task}
                          onPress={() => handleTaskPress(task.id)}
                        />
                      ))
                    ) : (
                      <Text style={styles.emptyText}>
                        No completed tasks found.
                      </Text>
                    ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>
      {/* Note: The physical Nav Bar placeholder from the image is omitted here as the TabBar component handles the actual navigation bar */}
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollViewContent: {
    padding: 20,
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 150,
  },

  // --- Header Styles ---
  mainHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    marginBottom: 40,
    marginTop: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Allow this to take up space
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#9ec5acff",
  },
  dashboardTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ffffff",
  },
  dateText: {
    fontSize: 16,
    color: "#9ec5acff",
    marginTop: 5,
  },
  miniBalanceCard: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: -15,
    marginTop: -75,
    alignItems: "center",
  },
  miniBalanceLabel: {
    color: "#ebf3efff",
    fontSize: 12,
  },
  miniBalanceValue: {
    color: "#aaffcbff",
    fontSize: 19,
    fontWeight: "700",
  },

  // --- Action Button Styles ---
  actionButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  actionButtonBase: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    height: BUTTON_HEIGHT,
    paddingHorizontal: 15,
  },
  actionIcon: {
    marginRight: 8,
  },
  primaryButton: {
    backgroundColor: "#1d5e3aff",
    flex: 1,
    marginRight: 5,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#9ec5acff",
    flex: 1,
    marginLeft: 5,
  },
  secondaryButtonText: {
    color: "#1d5e3aff",
    fontWeight: "600",
    fontSize: 16,
  },
  tertiaryButton: {
    backgroundColor: "#9ec5acff",
    flex: 1,
  },
  tertiaryButtonRight: {
    marginLeft: 10,
  },
  tertiaryButtonText: {
    color: "#041b0c",
    fontWeight: "700",
    fontSize: 16,
  },

  // --- Task Ledger Styles ---
  taskLedgerContainer: {
    width: "100%",
    marginTop: 20,
  },
  taskLedgerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 15,
    alignSelf: "flex-start",
  },
  ledgerCard: {
    backgroundColor: "rgba(2, 23, 9, 0.55)",
    padding: 20,
    borderRadius: 40,
    width: "100%",
  },
  sectionTitle: {
    // This style is no longer used with the tab UI, but kept for potential future use
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  headerTextLeft: {
    fontSize: 14,
    fontWeight: "700",
    color: "#b3d4bfff",
    flex: 1,
  },
  headerTextRight: {
    fontSize: 14,
    fontWeight: "700",
    color: "#b3d4bfff",
    width: 100, // Match the width of the time value column
    textAlign: "right",
  },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  taskDetails: {
    fontSize: 16,
    color: "rgba(209, 172, 255, 0.8)", // Link color
    flex: 1,
    textDecorationLine: "underline",
  },
  timeEarned: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
    textAlign: "right",
    width: 100, // Fixed width for alignment
    flexShrink: 0,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(2, 23, 9, 0.65)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ffffff30",
    overflow: "hidden",
    marginBottom: 20,
  },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: "center" },
  activeTab: { backgroundColor: "#9ec5acff" },
  tabText: { color: "#ffffff", fontWeight: "600", fontSize: 16 },
  listContentContainer: {
    // Container for the list below the tabs
  },
  emptyText: {
    fontSize: 14,
    color: "#ffffffa0",
    textAlign: "center",
    paddingBottom: 10,
  },
});
