// services/taskNotifications.ts
import { notifyTaskEvent, scheduleLocalNotification as scheduleLocalNotif } from "./notifications";

// ------------------------
// Task event notifications
// ------------------------

// Task accepted by another user
export async function onTaskAccepted(
  taskId: string,
  workerId: string,
  creatorId: string
) {
  await notifyTaskEvent(
    creatorId,
    "Task Accepted ✅",
    "Your task was accepted by a volunteer.",
    taskId
  );
}

// Task completed
export async function onTaskCompleted(
  taskId: string,
  workerId: string,
  creatorId: string
) {
  await notifyTaskEvent(
    creatorId,
    "Task Completed 🎉",
    "Your task has been marked as completed.",
    taskId
  );

  await notifyTaskEvent(
    workerId,
    "Great job! ✅",
    "You have successfully completed a task.",
    taskId
  );
}

// ------------------------
// Daily / reminder notifications
// ------------------------

// Schedule a daily check-in reminder for a user
export async function scheduleDailyCheckIn(userId: string) {
  await scheduleLocalNotif(
    "Daily Check-in 🕒",
    "Don't forget to check your tasks today!",
    10, // seconds from now (for testing, replace with proper daily timing)
    { userId }
  );
}

// ------------------------
// Export scheduleLocalNotification for direct use
// ------------------------
export { scheduleLocalNotif as scheduleLocalNotification };
