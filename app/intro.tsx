import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function IntroScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";

  // Animated values for fade-in effects
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    // Run entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: Colors[colorScheme].background },
        ]}
      >
        {/* Top decorative element */}
        <View style={styles.decorationTop}>
          <View
            style={[
              styles.circle,
              { backgroundColor: Colors[colorScheme].tint + "20" },
            ]}
          />
          <View
            style={[
              styles.circle,
              {
                backgroundColor: Colors[colorScheme].tint + "15",
                left: width * 0.5,
              },
            ]}
          />
        </View>

        {/* Content area with animation */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name="code-slash-outline"
              size={68}
              color={Colors[colorScheme].tint}
            />
          </View>

          <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
            SocioDev
          </Text>

          <View style={styles.taglineContainer}>
            <Text style={[styles.tagline, { color: Colors[colorScheme].tint }]}>
              Connect. Code. Create.
            </Text>
          </View>

          <Text
            style={[
              styles.description,
              { color: Colors[colorScheme].textSecondary },
            ]}
          >
            Join our community of developers sharing knowledge and building the
            future together.
          </Text>
        </Animated.View>

        {/* Buttons with modern styling */}
        <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: Colors[colorScheme].tint },
            ]}
            onPress={() => router.push("/auth/sign-up")}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/auth/sign-in")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { color: Colors[colorScheme].text },
              ]}
            >
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom decoration */}
        <View style={styles.decorationBottom}>
          <View
            style={[
              styles.pill,
              { backgroundColor: Colors[colorScheme].tint + "10" },
            ]}
          />
          <View
            style={[
              styles.pill,
              {
                backgroundColor: Colors[colorScheme].tint + "20",
                left: width * 0.55,
              },
            ]}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  decorationTop: {
    position: "absolute",
    top: -height * 0.1,
    left: -width * 0.2,
    right: -width * 0.2,
    height: height * 0.4,
    zIndex: 0,
  },
  decorationBottom: {
    position: "absolute",
    bottom: -height * 0.05,
    left: 0,
    right: 0,
    height: height * 0.2,
    zIndex: 0,
  },
  circle: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    top: 0,
  },
  pill: {
    position: "absolute",
    width: width * 0.6,
    height: 40,
    borderRadius: 20,
    transform: [{ rotate: "-15deg" }],
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: -1,
    marginBottom: 6,
  },
  taglineContainer: {
    marginBottom: 20,
  },
  tagline: {
    fontSize: 18,
    fontWeight: "600",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: "80%",
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 40,
    zIndex: 1,
  },
  primaryButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  buttonIcon: {
    marginLeft: 8,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
});

// Ensure Colors properties exist (optional, good practice)
if (!Colors.light.textSecondary) Colors.light.textSecondary = "#8e8e93";
if (!Colors.dark.textSecondary) Colors.dark.textSecondary = "#8e8e93";
