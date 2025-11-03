import { Slot } from "expo-router";
import { AuthProvider } from "../services/AuthContext";
import * as Linking from "expo-linking";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { supabase } from "../services/supabase";
import { registerForPushNotifications } from "../services/notifications";

// Linking configuration
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

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    let authSubscription: { unsubscribe: () => void } | null = null;

    const initNotifications = async () => {
      try {
        console.log("[RootLayout] Initializing notifications...");

        // Get the currently logged-in user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Register device for push notifications if logged in
        if (user?.id) {
          console.log(
            "[RootLayout] User logged in, registering for notifications"
          );
          await registerForPushNotifications(user.id);
        } else {
          console.log("[RootLayout] No user logged in yet");
        }

        // Listen for auth state changes to register token when user signs in
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("[RootLayout] Auth event:", event);

          if (event === "SIGNED_IN" && session?.user.id) {
            console.log(
              "[RootLayout] User signed in, registering for notifications"
            );
            await registerForPushNotifications(session.user.id);
          }
        });

        authSubscription = subscription;
      } catch (error) {
        console.error(
          "[RootLayout] Failed to initialize notifications:",
          error
        );
      }
    };

    initNotifications();

    // Handle taps on notifications (remote or local)
    const notificationSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as {
          taskId?: string;
          notificationType?: string;
        };

        console.log("[RootLayout] Notification tapped:", data);

        if (data?.taskId) {
          router.push(`/task/${data.taskId}`);
        } else {
          router.push("/(app)/home");
        }
      });

    return () => {
      notificationSubscription.remove();
      authSubscription?.unsubscribe();
    };
  }, [router]);

  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
