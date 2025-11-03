import { supabase } from "./supabase";
import { notifyTaskEvent, scheduleLocalNotification as scheduleLocalNotif } from "./notifications";

/**
 * Get user's name by ID
 */
async function getUserName(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data?.name || "Someone";
  } catch (error) {
    console.error("[TaskNotifications] Error fetching user name:", error);
    return "Someone";
  }
}

/**
 * Get task details by ID
 */
async function getTaskDetails(taskId: string) {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("title, time_offered")
      .eq("id", taskId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[TaskNotifications] Error fetching task details:", error);
    return null;
  }
}

// ------------------------
// Task event notifications
// ------------------------

/**
 * Notify when someone accepts a task
 * @param taskId - The task that was accepted
 * @param workerId - The user who accepted the task
 * @param creatorId - The user who created the task (receives notification)
 */
export async function onTaskAccepted(
  taskId: string,
  workerId: string,
  creatorId: string
) {
  try {
    const [workerName, taskDetails] = await Promise.all([
      getUserName(workerId),
      getTaskDetails(taskId),
    ]);

    if (!taskDetails) {
      console.error("[TaskNotifications] Could not fetch task details for task accepted");
      return;
    }

    // Notify the task creator that someone accepted their task
    await notifyTaskEvent(
      creatorId,
      "task_accepted", // notification type that checks user preferences
      "Task Accepted ✅",
      `${workerName} accepted your task: ${taskDetails.title}`,
      taskId
    );

    console.log(`[TaskNotifications] Task accepted notification sent to creator`);
  } catch (error) {
    console.error("[TaskNotifications] Error in onTaskAccepted:", error);
  }
}

/**
 * Notify when a task is marked as completed
 * @param taskId - The task that was completed
 * @param workerId - The user who did the work (receives notification)
 * @param creatorId - The user who created/completed the task
 */
export async function onTaskCompleted(
  taskId: string,
  workerId: string,
  creatorId: string
) {
  try {
    const taskDetails = await getTaskDetails(taskId);

    if (!taskDetails) {
      console.error("[TaskNotifications] Could not fetch task details for task completed");
      return;
    }

    // Notify the worker that the task was completed
    await notifyTaskEvent(
      workerId,
      "task_completed", // notification type that checks user preferences
      "Task Completed 🎉",
      `Great work! Your task "${taskDetails.title}" was marked complete. You can now report ${taskDetails.time_offered} hours.`,
      taskId
    );

    console.log(`[TaskNotifications] Task completed notification sent to worker`);
  } catch (error) {
    console.error("[TaskNotifications] Error in onTaskCompleted:", error);
  }
}

// ------------------------
// Daily / reminder notifications
// ------------------------

/**
 * Schedule a daily check-in reminder for a user
 * This sends a local notification (doesn't use notifyTaskEvent since it's scheduled)
 * @param userId - User to remind
 */
export async function scheduleDailyCheckIn(userId: string) {
  try {
    await scheduleLocalNotif(
      "Daily Check-in 🕒",
      "Don't forget to check your tasks today!",
      86400, // 24 hours = 86400 seconds (change to 10 for testing)
      { userId, notificationType: "daily_reminder" }
    );
    
    console.log(`[TaskNotifications] Daily check-in scheduled for user ${userId}`);
  } catch (error) {
    console.error("[TaskNotifications] Error scheduling daily check-in:", error);
  }
}

/**
 * Send an immediate daily reminder (respects user preferences)
 * Use this for push notifications triggered by a cron job/backend
 * @param userId - User to notify
 */
export async function sendDailyReminder(userId: string) {
  try {
    await notifyTaskEvent(
      userId,
      "daily_reminder",
      "Check for New Tasks 📋",
      "There might be new tasks waiting for you in your community!",
      undefined, // no specific task
      0 // send immediately
    );

    console.log(`[TaskNotifications] Daily reminder sent to user ${userId}`);
  } catch (error) {
    console.error("[TaskNotifications] Error sending daily reminder:", error);
  }
}

// ------------------------
// Export scheduleLocalNotification for direct use
// ------------------------
export { scheduleLocalNotif as scheduleLocalNotification };