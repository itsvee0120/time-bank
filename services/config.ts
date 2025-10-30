const requiredEnvVars = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
};

// Validate all required env vars exist
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const config = {
  supabaseUrl: requiredEnvVars.EXPO_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: requiredEnvVars.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
};
