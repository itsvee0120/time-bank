import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

/**
 * Register device for push notifications and save token to Supabase
 */
export async function registerForPushNotifications(
  userId?: string
): Promise<string | null> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[Notifications] Permission not granted");
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("[Notifications] Expo push token:", token);

    if (token && userId) {
      const { error } = await supabase
        .from("users")
        .update({ expo_push_token: token })
        .eq("id", userId);

      if (error) {
        console.error("[Notifications] Failed to save push token:", error);
      } else {
        console.log("[Notifications] Token saved successfully");
      }
    }

    return token;
  } catch (error) {
    console.error(
      "[Notifications] Error registering for push notifications:",
      error
    );
    return null;
  }
}

/**
 * Send a push notification via Expo Push API
 */
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  if (!token) {
    console.log("[Notifications] No token provided, skipping push notification");
    return;
  }

  const message = {
    to: token,
    sound: "default",
    title,
    body,
    data: data || {},
    channelId: "default",
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log("[Notifications] Push notification sent:", result);
  } catch (error) {
    console.error("[Notifications] Failed to send push notification:", error);
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  secondsFromNow: number,
  data?: Record<string, any>
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data || {}, sound: "default" },
      trigger: { seconds: secondsFromNow },
    });
    console.log("[Notifications] Local notification scheduled:", title);
  } catch (error) {
    console.error(
      "[Notifications] Failed to schedule local notification:",
      error
    );
  }
}

/**
 * Notify user about a task event (push + optional local notification)
 * Respects user's notification preferences
 */
export async function notifyTaskEvent(
  userId: string,
  notificationType: "task_accepted" | "task_completed" | "daily_reminder",
  title: string,
  body: string,
  taskId?: string,
  localSecondsFromNow?: number
) {
  try {
    // Fetch user with token AND notification preferences
    const { data: user, error } = await supabase
      .from("users")
      .select(
        `
        expo_push_token,
        notifications_task_accepted,
        notifications_task_completed,
        notifications_daily_reminder
      `
      )
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[Notifications] Failed to fetch user:", error);
      return;
    }

    // Check if user has this notification type enabled
    const prefKey = `notifications_${notificationType}` as keyof typeof user;
    const isEnabled = user?.[prefKey];

    if (!isEnabled) {
      console.log(
        `[Notifications] User has ${notificationType} disabled, skipping`
      );
      return;
    }

    const token = user?.expo_push_token;

    // Send push notification if token exists
    if (token) {
      await sendPushNotification(token, title, body, {
        taskId,
        notificationType,
      });
    } else {
      console.log("[Notifications] No push token found for user");
    }

    // Schedule local notification if requested
    if (localSecondsFromNow) {
      await scheduleLocalNotification(title, body, localSecondsFromNow, {
        taskId,
        notificationType,
      });
    }
  } catch (error) {
    console.error("[Notifications] Error notifying task event:", error);
  }
}