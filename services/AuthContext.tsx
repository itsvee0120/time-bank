import { Session } from "@supabase/supabase-js";
import * as Notifications from "expo-notifications";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  refreshSession: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Configure notification handler (foreground behavior)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      setSession(data.session);
    } catch (error) {
      console.error("[AuthContext] Error refreshing session:", error);
      setSession(null);
    }
  };

  useEffect(() => {
    let userIdForCleanup: string | undefined;

    // Single source of truth for auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthContext] Auth event:", event);
      setSession(session);
      userIdForCleanup = session?.user.id;

      // Clear push token on sign out
      if (event === "SIGNED_OUT" && userIdForCleanup) {
        console.log("[AuthContext] Clearing push token for signed out user");
        await supabase
          .from("users")
          .update({ expo_push_token: null })
          .eq("id", userIdForCleanup);
      }

      // Mark loading complete after initial session check
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};
