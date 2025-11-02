import { Slot } from "expo-router";
import { AuthProvider } from "../services/AuthContext";
import * as Linking from "expo-linking";

// Linking configuration for Expo Router
export const linking = {
  prefixes: [Linking.createURL("/"), "timebank://"],
  config: {
    screens: {
      "(auth)": {
        // The folder name in `(auth)` must match these keys
        reset_password: "auth/reset-password",
        forgot_password: "auth/forgot-password",
        login: "auth/sign-in",
        signup: "auth/sign-up",
        profile_setup: "auth/profile-setup",
      },
      "(app)": {
        home: "home",
      },
    },
  },
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
