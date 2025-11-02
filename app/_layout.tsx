import { Slot } from "expo-router";
import { AuthProvider } from "../services/AuthContext";
import * as Linking from "expo-linking";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { supabase } from "../services/supabase";
import { registerForPushNotifications } from "../services/notifications";

// ----------------------
// Linking configuration
// ----------------------
export const linking = {
  prefixes: [Linking.createURL("/"), "timebank://"],
  config: {
    screens: {
      "(auth)": {
        reset_password: "auth/reset-password",
        forgot_password: "auth/forgot-password",
        login: "auth/sign-in",
        signup: "auth/sign-up",
        profile_setup: "auth/profile-setup",
      },
      "(app)": {
        home: "home",
        task: "task/:taskId",
      },
    },
  },
};

// ----------------------
// Foreground notification handler
// ----------------------
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const initNotifications = async () => {
      try {
        // Get the currently logged-in user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Register device for push notifications if logged in
        if (user?.id) {
          await registerForPushNotifications(user.id);
        }
      } catch (error) {
        console.error(
          "[RootLayout] Failed to initialize notifications:",
          error
        );
      }
    };

    initNotifications();

    // Handle taps on notifications (remote or local)
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as {
          taskId?: string;
        };
        console.log("[RootLayout] Notification tapped:", data);

        if (data?.taskId) {
          router.push(`/task/${data.taskId}`);
        } else {
          router.push("/(app)/home");
        }
      }
    );

    return () => subscription.remove();
  }, [router]);

  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
