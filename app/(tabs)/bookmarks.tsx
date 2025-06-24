import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  View,
  StyleSheet,
  TouchableOpacity, // Add this
  Image, // Add this
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { fetchArticlesByIds, Article } from "@/services/articleService";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useUpsideDownRefresh } from "@/hooks/useUpsideDownRefresh";
import { useRouter } from "expo-router"; // Add this

export default function BookmarksScreen() {
  const { user, bookmarks, isLoading, refreshBookmarks } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter(); // Add router instance

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBookmarks();
    setRefreshing(false);
  };

  useUpsideDownRefresh(handleRefresh);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    if (user && bookmarks.length) {
      fetchArticlesByIds(bookmarks).then((arts) => {
        if (mounted) setArticles(arts);
        setLoading(false);
      });
    } else {
      setArticles([]);
      setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [user, bookmarks]);

  if (isLoading || loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>
        Bookmarks
      </ThemedText>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          // Truncate content
          const previewContent =
            item.content.length > 100
              ? item.content.substring(0, 100) + "..."
              : item.content;

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/article/${item.id}`)} // Navigate on press
            >
              <ThemedView style={styles.articleCard}>
                {item.imageBase64 && ( // Display image if available
                  <Image
                    source={{
                      uri: `data:image/jpeg;base64,${item.imageBase64}`,
                    }}
                    style={styles.articleImagePreview}
                  />
                )}
                <View style={styles.cardHeader}>
                  <ThemedText type="subtitle" style={styles.articleTitle}>
                    {item.title}
                  </ThemedText>
                  <Ionicons
                    name="bookmark"
                    size={20}
                    color={Colors[colorScheme].tint}
                  />
                </View>
                <ThemedText type="default" style={styles.articleContent}>
                  {previewContent} {/* Display truncated content */}
                </ThemedText>
              </ThemedView>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="bookmarks-outline"
              size={48}
              color={Colors[colorScheme].icon}
            />
            <ThemedText style={styles.emptyText}>No bookmarks yet.</ThemedText>
            <ThemedText style={styles.emptySubText}>
              Save articles to see them here.
            </ThemedText>
          </View>
        }
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 25, // Increased from 10 to 25
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 15,
    fontSize: 26,
    paddingTop: 30, // Increased from 20 to 30
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  articleCard: {
    borderRadius: 12,
    // padding: 16, // Padding moved to content area if image exists
    marginHorizontal: 16,
    marginBottom: 16, // Increased margin
    borderWidth: 1,
    borderColor: Colors.light.border ?? "#e0e0e0", // Use default if undefined
    overflow: "hidden", // Ensure image corners are rounded
    backgroundColor: Colors.light.card ?? "#ffffff", // Use default if undefined
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  articleImagePreview: {
    width: "100%",
    height: 150, // Adjust height as needed
    backgroundColor: "#eee",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingHorizontal: 16, // Add padding here
    paddingTop: 16, // Add padding here
  },
  articleTitle: {
    flex: 1,
    marginRight: 8,
    fontWeight: "600",
  },
  articleContent: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    paddingHorizontal: 16, // Add padding here
    paddingBottom: 16, // Add padding here
  },
  list: {
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
  },
});

// Add fallbacks for potentially undefined colors used in styles
if (!Colors.light.border) Colors.light.border = "#e0e0e0";
if (!Colors.light.card) Colors.light.card = "#ffffff";
// Add dark mode fallbacks if needed
// if (!Colors.dark.border) Colors.dark.border = "#3a3a3c";
// if (!Colors.dark.card) Colors.dark.card = "#1c1c1e";
