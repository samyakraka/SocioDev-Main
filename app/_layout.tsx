import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Redirect, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { View, ActivityIndicator, StyleSheet } from "react-native";

import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/Colors";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function LoadingScreen() {
  const colorScheme = useColorScheme() ?? "light";
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
    </View>
  );
}

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const colorScheme = useColorScheme();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // If user is not authenticated, show intro and auth screens
  if (!user) {
    return (
      <Stack>
        {/* Add the intro screen here */}
        <Stack.Screen name="intro" options={{ headerShown: false }} />
        <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
        {/* Redirect to intro if trying to access other screens when logged out */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Redirect href="/intro" />
      </Stack>
    );
  }

  // If user is authenticated, show main app screens
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Add other authenticated screens here */}
        <Stack.Screen name="profile/[uid]" options={{ title: "Profile" }} />
        <Stack.Screen
          name="profile/[uid]/followers"
          options={{ title: "Followers" }}
        />
        <Stack.Screen
          name="profile/[uid]/following"
          options={{ title: "Following" }}
        />
        <Stack.Screen name="article/[id]" options={{ title: "Article" }} />
        <Stack.Screen name="+not-found" />
        {/* Redirect to tabs if trying to access auth screens when logged in */}
        <Stack.Screen name="intro" options={{ headerShown: false }} />
        <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
        <Redirect href="/(tabs)" />
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // Match the loading screen background with potential intro/app theme
    backgroundColor: "#ffffff", // Or use Colors.light.background
  },
});
