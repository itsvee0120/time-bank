import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { Session } from "@supabase/supabase-js";

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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      setSession(data.session);
    } catch (error) {
      console.error("Error refreshing session:", error);
      setSession(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        console.log("Initial session:", session ? "Found" : "None");
        setSession(session);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error getting session:", error);
        setSession(null);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);

      // Handle different auth events
      if (event === "SIGNED_IN") {
        console.log("User signed in");
        setSession(session);
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out");
        setSession(null);
      } else if (event === "TOKEN_REFRESHED") {
        console.log("Token refreshed");
        setSession(session);
      } else if (event === "USER_UPDATED") {
        console.log("User updated");
        setSession(session);
      } else if (event === "INITIAL_SESSION") {
        setSession(session);
      }

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
