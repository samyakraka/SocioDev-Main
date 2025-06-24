import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Image,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import {
  fetchArticleById,
  Article,
  addBookmark,
  removeBookmark,
} from "@/services/articleService";
import { useAuth } from "@/contexts/AuthContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";

// Utility: Linkify URLs in text (copied from index.tsx)
function linkify(text: string, onUrlPress: (url: string) => void) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <Text
        key={i}
        style={styles.link}
        onPress={() => onUrlPress(part)}
        suppressHighlighting
      >
        {part}
      </Text>
    ) : (
      <Text key={i}>{part}</Text>
    )
  );
}

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, bookmarks, refreshBookmarks } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const router = useRouter();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarking, setBookmarking] = useState(false);

  const isBookmarked = article ? bookmarks.includes(article.id) : false;

  useEffect(() => {
    let mounted = true;
    if (id) {
      setLoading(true);
      fetchArticleById(id)
        .then((data) => {
          if (mounted) {
            if (data) {
              setArticle(data);
            } else {
              Alert.alert("Error", "Article not found.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            }
            setLoading(false);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch article:", error);
          if (mounted) {
            Alert.alert("Error", "Could not load article.", [
              { text: "OK", onPress: () => router.back() },
            ]);
            setLoading(false);
          }
        });
    } else {
      Alert.alert("Error", "Invalid article ID.", [
        { text: "OK", onPress: () => router.back() },
      ]);
      setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [id, router]);

  const handleBookmark = async () => {
    if (!user || !article) return;
    setBookmarking(true);
    try {
      if (isBookmarked) {
        await removeBookmark(user.uid, article.id);
      } else {
        await addBookmark(user.uid, article.id);
      }
      await refreshBookmarks();
      // Optionally refresh article data if savedCount needs update on this screen
      const updatedArticle = await fetchArticleById(article.id);
      if (updatedArticle) setArticle(updatedArticle);
    } catch (e) {
      Alert.alert("Error", "Could not update bookmark.");
    } finally {
      setBookmarking(false);
    }
  };

  const handleUrlPress = (url: string) => {
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </ThemedView>
    );
  }

  if (!article) {
    // Error handled in useEffect, this is a fallback
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Article not found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: article.title || "Article" }} />
      <ScrollView style={styles.container}>
        {article.imageBase64 && (
          <Image
            source={{ uri: `data:image/jpeg;base64,${article.imageBase64}` }}
            style={styles.media}
          />
        )}
        <ThemedView style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <ThemedText type="title" style={styles.articleTitle}>
              {article.title}
            </ThemedText>
            <TouchableOpacity
              onPress={handleBookmark}
              disabled={bookmarking}
              style={styles.bookmarkButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={30}
                color={isBookmarked ? Colors[colorScheme].tint : "#bbb"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.metaRow}>
            <TouchableOpacity
              onPress={() => {
                if (article.author?.uid) {
                  router.push(`/profile/${article.author.uid}`);
                }
              }}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.articleMeta,
                  { color: Colors[colorScheme].tint, fontWeight: "600" },
                ]}
              >
                by {article.author?.username || "Unknown"}
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.articleMeta}>
              {" • "}
              {new Date(article.createdAt.seconds * 1000).toLocaleDateString()}
            </ThemedText>
          </View>

          <ThemedText style={styles.articleContent}>
            {linkify(article.content, handleUrlPress)}
          </ThemedText>

          <View style={styles.tagsRow}>
            {article.tags?.map((tag) => (
              <View key={tag} style={styles.tag}>
                <ThemedText style={styles.tagText}>#{tag}</ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.footerRow}>
            <ThemedText style={styles.savedCount}>
              🔖 {article.savedCount || 0} saved
            </ThemedText>
          </View>
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  media: {
    width: "100%",
    height: 250, // Larger image for detail view
    backgroundColor: "#e9ecef",
  },
  contentContainer: {
    padding: 20,
    backgroundColor: "#ffffff", // White background for content area
    borderTopLeftRadius: 20, // Optional: rounded corners if image is above
    borderTopRightRadius: 20,
    marginTop: -20, // Overlap image slightly for effect
    paddingTop: 30, // Adjust padding due to overlap
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start", // Align title top, button top
    marginBottom: 10,
  },
  articleTitle: {
    flex: 1, // Allow title to wrap
    fontSize: 26,
    fontWeight: "bold",
    color: "#1d3557",
    marginRight: 12,
    lineHeight: 34,
  },
  bookmarkButton: {
    padding: 6,
    marginTop: 4, // Align roughly with title top
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap", // Allow wrapping if author name is long
  },
  articleMeta: {
    fontSize: 14,
    color: "#6c757d",
    marginRight: 4, // Space between elements
  },
  articleContent: {
    fontSize: 17, // Larger font for reading
    lineHeight: 26, // Increased line height
    color: "#343a40",
    marginBottom: 25,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: "#e9ecef",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tagText: {
    color: "#457b9d",
    fontSize: 13,
    fontWeight: "500",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  savedCount: {
    fontSize: 14,
    color: "#457b9d",
    fontWeight: "600",
  },
  link: {
    color: "#0077b6",
    textDecorationLine: "underline",
    fontWeight: "500",
  },
});
