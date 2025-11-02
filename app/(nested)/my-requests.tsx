import { useAuth } from "@/services/AuthContext";
import { supabase } from "@/services/supabase";
import { Tables } from "@/services/supabaseTypes";
import { FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Define a more specific type for our fetched request data
type MyRequest = Tables<"tasks"> & {
  assigned_to_user: Pick<Tables<"users">, "id" | "name" | "avatar_url"> | null;
  task_attachments: Pick<Tables<"task_attachments">, "file_url">[];
};

const FALLBACK_AVATAR = require("@/assets/images/temp-profile-pic.png");

const getStatusStyle = (status: string) => {
  switch (status) {
    case "Open":
      return {
        backgroundColor: "rgba(52, 211, 153, 0.2)",
        borderColor: "#34D399",
        textColor: "#A7F3D0",
      };
    case "In Progress":
      return {
        backgroundColor: "rgba(96, 165, 250, 0.2)",
        borderColor: "#60A5FA",
        textColor: "#BFDBFE",
      };
    case "Completed":
      return {
        backgroundColor: "rgba(167, 139, 250, 0.2)",
        borderColor: "#A78BFA",
        textColor: "#DDD6FE",
      };
    default:
      return {
        backgroundColor: "rgba(156, 163, 175, 0.2)",
        borderColor: "#9CA3AF",
        textColor: "#D1D5DB",
      };
  }
};

const RequestCard: React.FC<{ request: MyRequest; key?: React.Key }> = ({
  request,
}) => {
  const router = useRouter();
  const { backgroundColor, borderColor, textColor } = getStatusStyle(
    request.status
  );
  const attachment = request.task_attachments[0];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {request.title}
        </Text>
        <View style={styles.headerRight}>
          <View style={styles.timeBadge}>
            <FontAwesome5 name="clock" size={12} color="#aaffcbff" />
            <Text style={styles.timeText}>{request.time_offered} hrs</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor, borderColor }]}>
            <Text style={[styles.statusText, { color: textColor }]}>
              {request.status}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.cardDate}>
        Created on: {new Date(request.timestamp).toLocaleDateString()}
      </Text>

      <View style={styles.separator} />

      {/* Assigned To Info */}
      <View style={styles.infoRow}>
        <FontAwesome5 name="user-check" style={styles.infoIcon} />
        <Text style={styles.infoLabel}>Assigned To:</Text>
        {request.assigned_to_user ? (
          <TouchableOpacity
            style={styles.assigneeContainer}
            onPress={() => {
              if (request.assigned_to_user?.id)
                router.push({
                  pathname: "/user/[id]",
                  params: { id: request.assigned_to_user.id },
                });
            }}
          >
            <Image
              source={
                request.assigned_to_user.avatar_url
                  ? { uri: request.assigned_to_user.avatar_url }
                  : FALLBACK_AVATAR
              }
              style={styles.assigneeAvatar}
            />
            <Text style={styles.linkText}>{request.assigned_to_user.name}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.infoValue}>Not yet assigned</Text>
        )}
      </View>

      {/* Attachment Info */}
      {attachment && (
        <View style={styles.infoRow}>
          <FontAwesome5 name="paperclip" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Attachment:</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(attachment.file_url)}
          >
            <Text style={styles.linkText}>View Attachment</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default function MyRequestsScreen() {
  const { session } = useAuth();
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"current" | "past">("current");

  // Fetch requests from the database
  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const fetchRequests = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          assigned_to_user:users!tasks_assigned_to_fkey(id, name, avatar_url),
          task_attachments(file_url)
        `
        )
        .eq("created_by", session.user.id)
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error fetching requests:", error);
      } else {
        setRequests(data as MyRequest[]);
      }
      setLoading(false);
    };

    fetchRequests();
  }, [session?.user?.id]);

  // Memoize filtered lists for performance
  const { currentRequests, pastRequests } = useMemo(() => {
    const current = requests.filter(
      (r) => r.status === "Open" || r.status === "In Progress"
    );
    const past = requests.filter(
      (r) => r.status !== "Open" && r.status !== "In Progress"
    );
    return { currentRequests: current, pastRequests: past };
  }, [requests]);

  const requestsToDisplay =
    activeTab === "current" ? currentRequests : pastRequests;
  const emptyMessage =
    activeTab === "current"
      ? "You have no open or in-progress requests."
      : "You have no past requests.";

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

      {/* Fixed Header Area */}
      <View style={styles.fixedHeaderContainer}>
        <View style={styles.headerContent}>
          <Text style={styles.screenTitle}>My Requests</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "current" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("current")}
            >
              <Text style={styles.tabText}>Current</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "past" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("past")}
            >
              <Text style={styles.tabText}>Past</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.listContentContainer}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#9ec5acff"
            style={{ marginTop: 50 }}
          />
        ) : requestsToDisplay.length > 0 ? (
          requestsToDisplay.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))
        ) : (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fixedHeaderContainer: {
    paddingTop: 80, // To clear the custom header
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#9ec5acff",
    marginBottom: 20,
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
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: "#9ec5acff",
  },
  tabText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // To clear tab bar
  },
  card: {
    backgroundColor: "rgba(2, 23, 9, 0.65)",
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ffffff30",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
    marginRight: 10,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 211, 153, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 5,
  },
  timeText: {
    color: "#aaffcbff",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  cardDate: { fontSize: 12, color: "#ffffff90", marginBottom: 15 },
  separator: {
    height: 1,
    backgroundColor: "#ffffff30",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoIcon: { color: "#9ec5acff", fontSize: 14, width: 20 },
  infoLabel: { fontSize: 14, color: "#ffffffa0", marginRight: 8 },
  infoValue: { fontSize: 14, color: "#ffffff", flexShrink: 1 },
  assigneeContainer: { flexDirection: "row", alignItems: "center" },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  linkText: {
    fontSize: 14,
    color: "rgba(209, 172, 255, 0.8)",
    textDecorationLine: "underline",
  },
  emptyText: {
    fontSize: 14,
    color: "#ffffffa0",
    textAlign: "center",
    padding: 20,
  },
});
