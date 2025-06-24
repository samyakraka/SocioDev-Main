import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Text // Import Text for the link
} from "react-native";
import { router } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { signIn } from "@/services/authService";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      Alert.alert("Success", "Signed in successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    } catch (error: any) {
      console.error("Sign in error:", error);
      Alert.alert(
        "Sign In Failed",
        error.message || "Invalid email or password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <ThemedView style={styles.innerContainer}>
          <ThemedText type="title" style={styles.title}>
            Welcome Back 👋
          </ThemedText>
          <ThemedText style={styles.subtitle}>Sign in to continue</ThemedText>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              placeholderTextColor="#aaa"
            />

            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              placeholderTextColor="#aaa"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleSignIn}
              activeOpacity={0.8} // Slightly adjusted activeOpacity
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" /> // Ensure contrast
              ) : (
                <Text style={styles.buttonText}>Sign In</Text> // Use standard Text for better styling control
              )}
            </TouchableOpacity>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/sign-up")}>
                 <Text style={[styles.linkText, styles.linkActionText]}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const { height } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Use white background for the whole screen
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20, // Add horizontal padding to the scroll view
    paddingBottom: 40, // Add padding at the bottom
  },
  innerContainer: {
    backgroundColor: "#FFFFFF", // Keep inner container white (or remove if container is white)
    borderRadius: 25, // Softer corners
    padding: 30, // Increase padding
    shadowColor: "#000000", // Darker shadow
    shadowOffset: { width: 0, height: 5 }, // Adjust shadow offset
    shadowOpacity: 0.1, // Slightly increased opacity
    shadowRadius: 15, // Increase shadow radius for softer effect
    elevation: 5, // Adjust elevation for Android
    marginHorizontal: 0, // Remove margin if scrollContent has padding
  },
  title: {
    textAlign: "center",
    marginBottom: 10, // Reduce space below title
    fontWeight: "600", // Use numeric font weight
    fontSize: 32, // Slightly larger title
    color: "#1A202C", // Darker text color
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 35, // Increase space below subtitle
    fontSize: 16,
    color: "#718096", // Lighter subtitle color
  },
  form: {
    width: "100%",
  },
  input: {
    height: 55, // Increase input height
    marginBottom: 20, // Increase spacing between inputs
    borderWidth: 0, // Remove border
    borderRadius: 15, // Softer corners for inputs
    paddingHorizontal: 20, // Increase horizontal padding
    backgroundColor: "#F7FAFC", // Lighter input background
    fontSize: 16,
    color: "#2D3748", // Slightly darker input text color
    // Add a subtle border or shadow on focus if desired (requires more state/logic)
  },
  button: {
    backgroundColor: "#4A90E2", // A modern blue color
    paddingVertical: 16, // Increase vertical padding
    borderRadius: 15, // Match input border radius
    width: "100%",
    alignItems: "center",
    marginTop: 15, // Adjust spacing above button
    marginBottom: 25, // Increase spacing below button
    shadowColor: "#4A90E2", // Shadow color matching button
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: "#FFFFFF", // White text
    fontSize: 18, // Slightly larger button text
    fontWeight: "600", // Medium weight
    letterSpacing: 0.3,
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10, // Adjust spacing if needed
  },
  linkText: {
    fontSize: 15,
    color: "#718096", // Match subtitle color
  },
  linkActionText: {
    color: "#4A90E2", // Match button color
    fontWeight: "600",
  },
});
