export default {
  expo: {
    name: "MediDerm AI",
    slug: "medi-derm-ai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    scheme: "medi-derm-ai",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      userInterfaceStyle: "automatic",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app needs access to your location to provide weather-based skin health recommendations.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app needs access to your location to provide weather-based skin health recommendations.",
      },
    },
    android: {
      userInterfaceStyle: "automatic",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      // Allow HTTP (cleartext) traffic for local development
      usesCleartextTraffic: true,
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-router"],

    // Add your custom environment variables here:
    extra: {
      AUTH_TOKEN_KEY: process.env.EXPO_PUBLIC_AUTH_TOKEN_KEY,
      AUTH_USER_KEY: process.env.EXPO_PUBLIC_AUTH_USER_KEY,
      FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
      API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    },
  },
};
