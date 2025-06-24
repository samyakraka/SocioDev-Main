import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Text,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "../../firebaseConfig";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import uuid from "react-native-uuid";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { router } from "expo-router";
import { useUpsideDownRefresh } from "@/hooks/useUpsideDownRefresh";
import * as FileSystem from "expo-file-system";
// Updated imports for AI
import Groq from "groq-sdk";
import { GROQ_API_KEY } from "@env"; // Updated import for GROQ

// --- AI Configuration ---
// Ensure GROQ_API_KEY is defined before initializing
const groqClient = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;
// --- End AI Configuration ---

export default function UploadArticleScreen() {
  const { user, userProfile } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [media, setMedia] = useState<{
    uri: string;
    type: string;
    name: string;
    base64?: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  // AI state
  const [aiTopic, setAiTopic] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  useUpsideDownRefresh(() => {
    setTitle("");
    setContent("");
    setTags("");
    setMedia(null);
    setAiTopic(""); // Reset AI topic on refresh
  });

  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      let base64 = asset.base64;
      // If base64 is not provided, read file manually
      if (!base64 && asset.uri) {
        base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
      setMedia({
        uri: asset.uri,
        type: asset.type === "video" ? "video/mp4" : "image/jpeg",
        name:
          asset.fileName || `media.${asset.type === "video" ? "mp4" : "jpg"}`,
        base64,
      });
    }
  };

  // --- AI Generation Function ---
  const generateWithAI = async () => {
    if (!groqClient) {
      Alert.alert(
        "Error",
        "AI feature not configured. API key might be missing."
      );
      return;
    }
    if (!aiTopic.trim()) {
      Alert.alert("Error", "Please enter a topic for AI generation.");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const prompt = `Generate an article draft based on the topic: "${aiTopic}". Provide a suitable title, a short article content (around 100-150 words), and 3-5 relevant comma-separated tags. Format the output exactly like this, with each part on a new line and no extra characters or formatting like asterisks or markdown:\nTitle: [Generated Title]\nContent: [Generated Content]\nTags: [tag1, tag2, tag3]`;

      const response = await groqClient.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
      });

      const text = response.choices[0]?.message?.content || "";

      // Basic parsing based on the requested format
      let generatedTitle = "";
      let generatedContent = "";
      let generatedTags = "";

      const lines = text.split("\n");
      lines.forEach((line) => {
        if (line.startsWith("Title: ")) {
          generatedTitle = line.substring("Title: ".length).trim();
        } else if (line.startsWith("Content: ")) {
          generatedContent = line.substring("Content: ".length).trim();
        } else if (line.startsWith("Tags: ")) {
          generatedTags = line.substring("Tags: ".length).trim();
        }
      });

      if (generatedTitle && generatedContent) {
        setTitle(generatedTitle);
        setContent(generatedContent);
        setTags(generatedTags); // Tags might be empty if AI fails to provide them
        setShowAiModal(false); // Close the modal after successful generation
        Alert.alert("Success", "AI generated content populated!");
      } else {
        console.error("AI Response Parsing Error. Raw response:", text);
        Alert.alert(
          "Error",
          "Could not parse AI response. Check console for details."
        );
      }
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      Alert.alert(
        "AI Error",
        error.message || "Failed to generate content with AI."
      );
    } finally {
      setIsGeneratingAI(false);
    }
  };
  // --- End AI Generation Function ---

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Error", "Title and content are required.");
      return;
    }
    setUploading(true);
    try {
      let imageBase64: string | undefined;
      if (media && media.base64 && media.type.startsWith("image")) {
        imageBase64 = media.base64;
      }
      const articleId = uuid.v4().toString();

      const articleData: any = {
        userId: user?.uid,
        username: userProfile?.username || "",
        title: title.trim(),
        content: content.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        savedCount: 0,
        createdAt: serverTimestamp(),
        author: {
          uid: user?.uid,
          username: userProfile?.username || "",
          email: userProfile?.email || "",
        },
      };
      if (imageBase64) articleData.imageBase64 = imageBase64;

      await setDoc(
        doc(collection(db, "articles"), articleId),
        articleData
      ).catch((err) => {
        console.error("Firestore setDoc error:", err);
        throw err;
      });
      Alert.alert("Success", "Article posted!", [
        {
          text: "OK",
          onPress: () => {
            setTitle("");
            setContent("");
            setTags("");
            setMedia(null);
            setAiTopic(""); // Clear AI topic input
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (e: any) {
      console.error("Upload Article Error:", e);
      Alert.alert("Error", e.message || "Failed to post article.");
    } finally {
      setUploading(false);
    }
  };

  const styles = getStyles(colorScheme);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.innerContainer}>
          <ThemedText type="title" style={styles.header}>
            Create Article
          </ThemedText>

          <TextInput
            style={styles.input}
            placeholder="Article Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={Colors[colorScheme].textSecondary}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What's on your mind?"
            value={content}
            onChangeText={setContent}
            multiline
            placeholderTextColor={Colors[colorScheme].textSecondary}
          />
          <TextInput
            style={styles.input}
            placeholder="Tags (e.g., tech, news, art)"
            value={tags}
            onChangeText={setTags}
            placeholderTextColor={Colors[colorScheme].textSecondary}
          />
          <TouchableOpacity style={styles.mediaButton} onPress={pickMedia}>
            <ThemedText style={styles.mediaButtonText}>
              {media ? "Change Cover Image" : "Add Cover Image"}
            </ThemedText>
          </TouchableOpacity>
          <ThemedText
            style={{
              color: Colors[colorScheme].textSecondary,
              marginBottom: 12,
              textAlign: "center",
              fontSize: 13,
            }}
          >
            Minimum 1MB upload limit for cover images.
          </ThemedText>
          {media && media.type.startsWith("image") && (
            <View style={styles.mediaPreviewContainer}>
              <Image source={{ uri: media.uri }} style={styles.mediaPreview} />
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (uploading || !title.trim() || !content.trim()) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={uploading || !title.trim() || !content.trim()}
          >
            {uploading ? (
              <ActivityIndicator color={Colors[colorScheme].background} />
            ) : (
              <ThemedText style={styles.submitButtonText}>
                Publish Article
              </ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>

      {/* AI Floating Button */}
      {groqClient && (
        <TouchableOpacity
          style={styles.aiFab}
          onPress={() => setShowAiModal(true)}
        >
          <ThemedText style={styles.aiFabText}>✨</ThemedText>
        </TouchableOpacity>
      )}

      {/* AI Modal */}
      <Modal
        visible={showAiModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: Colors[colorScheme].card },
            ]}
          >
            <ThemedText style={styles.modalTitle}>Generate with AI</ThemedText>

            <TextInput
              style={[styles.input, styles.modalInput]}
              placeholder="Enter topic idea..."
              value={aiTopic}
              onChangeText={setAiTopic}
              placeholderTextColor={Colors[colorScheme].textSecondary}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAiModal(false)}
              >
                <ThemedText style={styles.modalCancelButtonText}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalGenerateButton,
                  isGeneratingAI && styles.aiButtonDisabled,
                ]}
                onPress={generateWithAI}
                disabled={isGeneratingAI}
              >
                {isGeneratingAI ? (
                  <ActivityIndicator
                    color={Colors[colorScheme].background}
                    size="small"
                  />
                ) : (
                  <ThemedText style={styles.aiButtonText}>Generate</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colorScheme: "light" | "dark") =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: "center",
    },
    innerContainer: {
      padding: 20,
      backgroundColor: Colors[colorScheme].background,
    },
    header: {
      textAlign: "center",
      marginBottom: 20,
      color: Colors[colorScheme].tint,
      fontSize: 28,
      fontWeight: "bold",
    },
    input: {
      backgroundColor: Colors[colorScheme].card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme].border,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      marginBottom: 16,
      color: Colors[colorScheme].text,
    },
    textArea: {
      height: 120,
      textAlignVertical: "top",
      paddingTop: 14,
    },
    mediaButton: {
      backgroundColor: Colors[colorScheme].tint,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom: 8,
    },
    mediaButtonText: {
      color: Colors[colorScheme].background,
      fontWeight: "600",
      fontSize: 16,
    },
    mediaPreviewContainer: {
      marginBottom: 16,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: Colors[colorScheme].border,
    },
    mediaPreview: {
      width: "100%",
      height: 200,
      backgroundColor: Colors[colorScheme].card,
    },
    submitButton: {
      backgroundColor: Colors[colorScheme].tint,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 10,
    },
    submitButtonDisabled: {
      backgroundColor: Colors[colorScheme].tabIconDefault,
      opacity: 0.7,
    },
    submitButtonText: {
      color: Colors[colorScheme].background,
      fontWeight: "bold",
      fontSize: 18,
    },
    // New FAB styles
    aiFab: {
      position: "absolute",
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
      right: 20,
      bottom: 20,
      backgroundColor: Colors[colorScheme].tint,
      borderRadius: 28,
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
    },
    aiFabText: {
      fontSize: 24,
      color: Colors[colorScheme].background,
    },
    // AI Modal styles
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      padding: 20,
    },
    modalContent: {
      width: "100%",
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 15,
      textAlign: "center",
      color: Colors[colorScheme].tint,
    },
    modalInput: {
      marginBottom: 20,
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    modalCancelButton: {
      flex: 1,
      padding: 12,
      marginRight: 10,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: Colors[colorScheme].border,
    },
    modalCancelButtonText: {
      fontWeight: "600",
    },
    modalGenerateButton: {
      flex: 1,
      padding: 12,
      marginLeft: 10,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors[colorScheme].tint,
    },
    aiButtonDisabled: {
      backgroundColor: Colors[colorScheme].tabIconDefault,
      opacity: 0.7,
    },
    aiButtonText: {
      color: Colors[colorScheme].background,
      fontWeight: "600",
    },
  });

// Ensure Colors properties exist (optional, good practice)
if (!Colors.light.card) Colors.light.card = "#ffffff";
if (!Colors.dark.card) Colors.dark.card = "#1c1c1e";
if (!Colors.light.border) Colors.light.border = "#e0e0e0";
if (!Colors.dark.border) Colors.dark.border = "#3a3a3c";
if (!Colors.light.textSecondary) Colors.light.textSecondary = "#8e8e93";
if (!Colors.dark.textSecondary) Colors.dark.textSecondary = "#8e8e93";
