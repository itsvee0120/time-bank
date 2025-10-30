module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // FIX: Removed "module:react-native-dotenv" which conflicts with Expo Router file detection.

      [
        "module-resolver",
        {
          alias: {
            // Allows imports like "@/services/supabase"
            "@": "./",
          },
        },
      ],
    ],
  };
};
