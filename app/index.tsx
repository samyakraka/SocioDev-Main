import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useEffect, useState } from "react";

export default function Index() {
  const { user, isLoading } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const [initializing, setInitializing] = useState(true);

  // Add a timeout to avoid infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, []);

  // While loading, show loading indicator
  if (isLoading && initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        <Text style={{ marginTop: 10, color: Colors[colorScheme].text }}>
          Starting SocioDev...
        </Text>
      </View>
    );
  }

  // If user is already logged in, go to tabs, otherwise show intro screen
  if (user) {
    console.log("User is authenticated, redirecting to tabs");
    return <Redirect href="/(tabs)" />;
  } else {
    console.log("User is not authenticated, redirecting to intro");
    // Redirect to the new intro screen instead of sign-in
    return <Redirect href="/intro" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});
