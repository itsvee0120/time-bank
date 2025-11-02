import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "HOUREUM Time Bank",
  slug: "HOUREUM-Time-Bank",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/HOUREUM.png",
  scheme: "timebank",
  userInterfaceStyle: "automatic",
  newArchEnabled: false,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.nviol.houreum",
    usesAppleSignIn: true,
    infoPlist: {
      NSUserTrackingUsageDescription:
        "This identifier will be used to deliver personalized ads to you.",
      UIBackgroundModes: ["fetch", "remote-notification"],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/HOUREUM.png",
      backgroundColor: "#E6F4FE",
    },
    package: "com.nviol.houreum",
    permissions: ["NOTIFICATIONS"],
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON, // ✅ JS allowed here
  },
  web: {
    output: "static",
    favicon: "./assets/images/HOUREUM.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/HOUREUM.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#041b0c",
        dark: {
          backgroundColor: "#041b0c",
        },
      },
    ],
    "expo-sqlite",
    "expo-font",
    "expo-notifications",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: false,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: "ba84eb4e-0ca4-4c46-a7da-4585d9af4743",
    },
  },
});
