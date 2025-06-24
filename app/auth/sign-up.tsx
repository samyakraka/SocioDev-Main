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
import { registerUser } from "@/services/authService";

export default function SignUpScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleSignUp = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await registerUser(email, password, username);
      Alert.alert("Success", "Account created successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    } catch (error: any) {
      console.error("Registration error:", error);
      Alert.alert(
        "Registration Failed",
        error.message || "Could not create account"
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.innerContainer}>
          <ThemedText type="title" style={styles.title}>
            Create Account 🚀
          </ThemedText>
          <ThemedText style={styles.subtitle}>Join us today!</ThemedText>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
              placeholderTextColor="#aaa"
            />

            <TextInput
              ref={emailRef}
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
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              blurOnSubmit={false}
              placeholderTextColor="#aaa"
            />

            <TextInput
              ref={confirmPasswordRef}
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              returnKeyType="done"
              placeholderTextColor="#aaa"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleSignUp}
              activeOpacity={0.8} // Slightly adjusted activeOpacity
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" /> // Ensure contrast
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text> // Use standard Text
              )}
            </TouchableOpacity>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/sign-in")}>
                 <Text style={[styles.linkText, styles.linkActionText]}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const { height } = Dimensions.get("window");
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
    paddingTop: 20, // Add some top padding for longer forms
  },
  innerContainer: {
    backgroundColor: "#FFFFFF", // Keep inner container white
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
