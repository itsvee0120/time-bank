import { Slot } from "expo-router";
import { AuthProvider } from "../services/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider children={undefined}>
      <Slot />
    </AuthProvider>
  );
}
