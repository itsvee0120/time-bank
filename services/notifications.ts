// services/notifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

/**
 * Register device for push notifications and save token to Supabase
 */
export async function registerForPushNotifications(userId?: string): Promise<string | null> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Enable notifications to stay updated!");
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
        console.error("[Notifications] Failed to save push token to Supabase:", error);
      }
    }

    return token;
  } catch (error) {
    console.error("[Notifications] Error registering for push notifications:", error);
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
  if (!token) return;

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
    console.error("[Notifications] Failed to schedule local notification:", error);
  }
}

/**
 * Notify user about a task event (push + optional local notification)
 */
export async function notifyTaskEvent(
  userId: string,
  title: string,
  body: string,
  taskId?: string,
  localSecondsFromNow?: number
) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("expo_push_token")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[Notifications] Failed to fetch user token:", error);
      return;
    }

    const token = user?.expo_push_token;

    if (token) {
      await sendPushNotification(token, title, body, { taskId });
    }

    if (localSecondsFromNow) {
      await scheduleLocalNotification(title, body, localSecondsFromNow, { taskId });
    }
  } catch (error) {
    console.error("[Notifications] Error notifying task event:", error);
  }
}
