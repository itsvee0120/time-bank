import { useAuth } from "@/services/AuthContext";
import { useScroll } from "@/services/ScrollContext";
import { supabase } from "@/services/supabase";
import { FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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

// --- Types ---
interface TaskData {
  id: string;
  details: string;
  timeEarned: string;
}

// --- Constants ---
const FALLBACK_AVATAR = require("@/assets/images/temp-profile-pic.png");
const BUTTON_HEIGHT = 45;

// --- Helper Functions ---
const formatHours = (hours: number): string =>
  `${hours} hour${hours !== 1 ? "s" : ""}`;

// --- Components ---
const TaskRow: React.FC<TaskData & { onPress: () => void }> = ({
  details,
  timeEarned,
  onPress,
}) => (
  <TouchableOpacity style={styles.taskRow} onPress={onPress}>
    <Text style={styles.taskDetails} numberOfLines={1}>
      {details}
    </Text>
    <Text style={styles.timeEarned}>{timeEarned}</Text>
  </TouchableOpacity>
);

const ActionButton: React.FC<{
  iconName: keyof typeof FontAwesome5.glyphMap;
  label: string;
  onPress: () => void;
  style: "primary" | "secondary" | "tertiary";
  isRightButton?: boolean;
}> = ({ iconName, label, onPress, style, isRightButton }) => {
  const stylesMap = {
    primary: {
      button: styles.primaryButton,
      text: styles.primaryButtonText,
      icon: "#fff",
    },
    secondary: {
      button: styles.secondaryButton,
      text: styles.secondaryButtonText,
      icon: "#1d5e3aff",
    },
    tertiary: {
      button: styles.tertiaryButton,
      text: styles.tertiaryButtonText,
      icon: "#041b0c",
    },
  }[style];

  return (
    <TouchableOpacity
      style={[
        styles.actionButtonBase,
        stylesMap.button,
        isRightButton && styles.tertiaryButtonRight,
      ]}
      onPress={onPress}
    >
      <FontAwesome5
        name={iconName}
        size={20}
        color={stylesMap.icon}
        style={styles.actionIcon}
      />
      <Text style={stylesMap.text}>{label}</Text>
    </TouchableOpacity>
  );
};

const MiniTimeBalanceCard: React.FC<{ balance: number }> = ({ balance }) => (
  <View style={styles.miniBalanceCard}>
    <Text style={styles.miniBalanceLabel}>Time Balance</Text>
    <Text style={styles.miniBalanceValue}>{balance} hrs</Text>
  </View>
);

export default function Dashboard() {
  const { session } = useAuth();
  const { scrollY } = useScroll();
  const router = useRouter();
  const userId = session?.user?.id;

  const [username, setUsername] = useState("User");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoaded, setAvatarLoaded] = useState(true);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const [ongoingTasks, setOngoingTasks] = useState<TaskData[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TaskData[]>([]);
  const [activeTab, setActiveTab] = useState<"ongoing" | "completed">(
    "ongoing"
  );

  // --- Fetch Data ---
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch user info
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("name, avatar_url, time_balance")
          .eq("id", userId)
          .single();

        if (userData && !userError) {
          setUsername(userData.name ?? "User");
          setAvatarUrl(userData.avatar_url ?? null);
          setBalance(userData.time_balance ?? 0);
        }

        // Fetch ongoing tasks
        const { data: ongoingData, error: ongoingError } = await supabase
          .from("tasks")
          .select("id, title")
          .eq("assigned_to", userId)
          .neq("status", "Completed");

        if (ongoingData && !ongoingError) {
          setOngoingTasks(
            ongoingData.map((task) => ({
              id: task.id,
              details: task.title,
              timeEarned: "N/A",
            }))
          );
        }

        // Fetch completed tasks
        const { data: completedData, error: completedError } = await supabase
          .from("tasks")
          .select("id, title")
          .eq("assigned_to", userId)
          .eq("status", "Completed");

        if (completedData && !completedError) {
          // Optionally, fetch ledger info for time earned
          const taskIds = completedData.map((t) => t.id);
          const { data: ledgerData } = await supabase
            .from("ledger")
            .select("task_id, time_earned")
            .in("task_id", taskIds);

          const completed: TaskData[] = completedData.map((task) => {
            const ledger = ledgerData?.find((l) => l.task_id === task.id);
            return {
              id: task.id,
              details: task.title,
              timeEarned: ledger ? formatHours(ledger.time_earned) : "N/A",
            };
          });

          setCompletedTasks(completed);
        }
      } catch (err) {
        console.log("Error fetching dashboard data:", err);
      }

      setLoading(false);
    };

    fetchData();
  }, [userId]);

  // --- Navigation ---
  const handleTaskPress = (taskId: string) =>
    router.push({ pathname: "/task/[id]", params: { id: taskId } });

  const avatarSource =
    avatarUrl && avatarLoaded ? { uri: avatarUrl } : FALLBACK_AVATAR;

  return (
    <View style={styles.container}>
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
        {/* Header */}
        <View style={styles.mainHeaderRow}>
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
          <MiniTimeBalanceCard balance={balance} />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonRow}>
          <ActionButton
            iconName="plus-circle"
            label="Request Help"
            onPress={() => router.push("/requests")}
            style="primary"
          />
          <ActionButton
            iconName="file-alt"
            label="Tasks Available"
            onPress={() => router.push("/tasks-available")}
            style="secondary"
          />
        </View>
        <View style={styles.actionButtonRow}>
          <ActionButton
            iconName="list-alt"
            label="My Requests"
            onPress={() => router.push("/my-requests")}
            style="tertiary"
          />
          <ActionButton
            iconName="clock"
            label="Report Time"
            onPress={() => router.push("/report-time")}
            style="tertiary"
            isRightButton
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
              <>
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

                <View style={styles.listContentContainer}>
                  <View style={styles.headerRow}>
                    <Text style={styles.headerTextLeft}>Task Details</Text>
                    <Text style={styles.headerTextRight}>Time</Text>
                  </View>

                  {activeTab === "ongoing" &&
                    (ongoingTasks.length > 0 ? (
                      ongoingTasks.map((task) => (
                        <TaskRow
                          key={task.id}
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
                          key={task.id}
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
              </>
            )}
          </View>
        </View>
      </Animated.ScrollView>
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

  mainHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    marginBottom: 40,
    marginTop: 20,
  },
  headerContainer: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#9ec5acff",
  },
  dashboardTitle: { fontSize: 26, fontWeight: "700", color: "#ffffff" },
  dateText: { fontSize: 16, color: "#9ec5acff", marginTop: 5 },
  miniBalanceCard: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: -15,
    marginTop: -75,
    alignItems: "center",
  },
  miniBalanceLabel: { color: "#ebf3efff", fontSize: 12 },
  miniBalanceValue: { color: "#aaffcbff", fontSize: 19, fontWeight: "700" },

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
  actionIcon: { marginRight: 8 },
  primaryButton: { backgroundColor: "#1d5e3aff", flex: 1, marginRight: 5 },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  secondaryButton: { backgroundColor: "#9ec5acff", flex: 1, marginLeft: 5 },
  secondaryButtonText: { color: "#1d5e3aff", fontWeight: "600", fontSize: 16 },
  tertiaryButton: { backgroundColor: "#9ec5acff", flex: 1 },
  tertiaryButtonRight: { marginLeft: 10 },
  tertiaryButtonText: { color: "#041b0c", fontWeight: "700", fontSize: 16 },

  taskLedgerContainer: { width: "100%", marginTop: 20 },
  taskLedgerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 15,
    alignSelf: "flex-start",
  },
  ledgerCard: {
    backgroundColor: "rgba(2, 23, 9, 0.55)",
    padding: 20,
    borderRadius: 40,
    width: "100%",
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
    width: 100,
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
    color: "rgba(209, 172, 255, 0.8)",
    flex: 1,
    textDecorationLine: "underline",
  },
  timeEarned: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    textAlign: "right",
    width: 100,
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
  tabText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  listContentContainer: {},
  emptyText: {
    fontSize: 14,
    color: "#ffffffa0",
    textAlign: "center",
    paddingBottom: 10,
  },
});
