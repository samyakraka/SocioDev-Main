import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Text,
  ScrollView,
  Dimensions,
  Linking,
  Platform,
  SafeAreaView, // Import SafeAreaView
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchArticles,
  fetchTrendingArticles,
  getMediaUrl,
  addBookmark,
  removeBookmark,
  Article,
} from "@/services/articleService";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons"; // for bookmark icon
import { useRouter } from "expo-router"; // Add this import

// Utility: Linkify URLs in text
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

// Article Card
function ArticleCard({ article }: { article: Article }) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const { user, bookmarks, refreshBookmarks } = useAuth();
  const [bookmarking, setBookmarking] = useState(false);
  const router = useRouter(); // Add this line

  const isBookmarked = bookmarks.includes(article.id);

  const handleBookmark = async () => {
    if (!user) return;
    setBookmarking(true);
    try {
      if (isBookmarked) {
        await removeBookmark(user.uid, article.id);
      } else {
        await addBookmark(user.uid, article.id);
      }
      await refreshBookmarks();
    } catch (e) {
      // Optionally show error
    } finally {
      setBookmarking(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (article.mediaPath) {
      getMediaUrl(article.mediaPath).then((url) => {
        if (mounted) setMediaUrl(url);
      });
    }
    return () => {
      mounted = false;
    };
  }, [article.mediaPath]);

  const handleUrlPress = (url: string) => {
    Linking.openURL(url);
  };

  const navigateToDetail = () => {
    router.push(`/article/${article.id}`);
  };

  // Truncate content for preview
  const previewContent =
    article.content.length > 100
      ? article.content.substring(0, 100) + "..."
      : article.content;

  return (
    <TouchableOpacity onPress={navigateToDetail} activeOpacity={0.9}>
      <ThemedView style={styles.articleCard}>
        {/* Optional: Move image to top */}
        {article.imageBase64 && (
          <Image
            source={{ uri: `data:image/jpeg;base64,${article.imageBase64}` }}
            style={styles.media} // Use updated media style
          />
        )}
        <View style={styles.articleHeader}>
          <ThemedText type="title" style={styles.articleTitle} numberOfLines={2}>
            {article.title}
          </ThemedText>
          <TouchableOpacity
            onPress={handleBookmark}
            disabled={bookmarking}
            style={styles.bookmarkButton}
            activeOpacity={0.7}
            onPressIn={(e) => e.stopPropagation()}
          >
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={26} // Slightly smaller icon
              color={isBookmarked ? "#007C91" : "#adb5bd"} // Use theme colors
            />
          </TouchableOpacity>
        </View>
        <View style={styles.metaContainer}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              if (article.author?.uid) {
                router.push(`/profile/${article.author.uid}`);
              }
            }}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.authorText}>
              {article.author?.username || "Unknown"}
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.articleMeta}>
            {" • "}
            {new Date(article.createdAt.seconds * 1000).toLocaleDateString()}
          </ThemedText>
        </View>
        <ThemedText style={styles.articleContent} numberOfLines={3}> {/* Limit lines */}
          {linkify(article.content, handleUrlPress)} {/* Use full content for linkify */}
        </ThemedText>
        <View style={styles.tagsRow}>
          {article.tags?.slice(0, 3).map((tag) => ( // Limit visible tags
            <TouchableOpacity
              key={tag}
              activeOpacity={0.7}
              style={styles.tagTouchable}
              onPressIn={(e) => e.stopPropagation()}
              onPress={() => {}}
            >
              <ThemedText style={styles.tag}>#{tag}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.articleFooter}>
          <ThemedText style={styles.savedCount}>
            🔖 {article.savedCount || 0} saves
          </ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

// Trending Section
function TrendingSection({ articles }: { articles: Article[] }) {
  const router = useRouter();

  if (!articles || articles.length === 0) {
    return null; // Don't render if no trending articles
  }

  return (
    <View style={styles.trendingSection}>
      <ThemedText type="subtitle" style={styles.trendingTitle}>
        🔥 Trending Now
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trendingScrollContent} // Add padding
      >
        {articles.map((article) => (
          <TouchableOpacity
            key={article.id}
            style={styles.trendingCardTouchable}
            activeOpacity={0.85}
            onPress={() => router.push(`/article/${article.id}`)}
          >
            {/* Removed outer View, styling applied to TouchableOpacity */}
            {article.imageBase64 && (
              <Image
                source={{
                  uri: `data:image/jpeg;base64,${article.imageBase64}`,
                }}
                style={styles.trendingCardImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.trendingCardOverlay} />
            <View style={styles.trendingCardContent}>
              <ThemedText style={styles.trendingCardTitle} numberOfLines={2}>
                {article.title}
              </ThemedText>
              <ThemedText style={styles.trendingCardMeta} numberOfLines={1}>
                by {article.author?.username || "Unknown"}
              </ThemedText>
              <ThemedText style={styles.trendingCardSaved}>
                🔖 {article.savedCount || 0}
              </ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const [articles, setArticles] = useState<Article[]>([]);
  const [trending, setTrending] = useState<Article[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [all, trend] = await Promise.all([
        fetchArticles(),
        fetchTrendingArticles(),
      ]);
      setArticles(all);
      setTrending(trend);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([fetchArticles(), fetchTrendingArticles()]).then(
      ([all, trend]) => {
        if (mounted) {
          setArticles(all);
          setTrending(trend);
          setLoading(false);
        }
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  const filteredArticles = useMemo(() => {
    if (!search.trim()) return articles;
    const q = search.trim().toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
    );
  }, [articles, search]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </View>
    );
  }

  return (
    // Use SafeAreaView for better handling of notches/status bars
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Search Bar Area */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#adb5bd" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search articles, tags, or authors..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#adb5bd" // Lighter placeholder
          />
        </View>

        {/* Content List */}
        <FlatList
          data={filteredArticles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ArticleCard article={item} />}
          ListHeaderComponent={<TrendingSection articles={trending} />} // Add Trending as header
          contentContainerStyle={styles.articlesList}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>No articles found.</ThemedText>
          }
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Match container background
  },
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
  // Removed header style
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 20 : 40, // Increased top margin
    marginBottom: 16, // Space below search bar
    backgroundColor: "#ffffff", // White background
    borderRadius: 25, // Rounded corners
    paddingHorizontal: 16,
    shadowColor: "#adb5bd",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    height: 48, // Fixed height
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1, // Take remaining space
    height: '100%', // Fill container height
    fontSize: 15,
    color: "#333",
    // Removed redundant styling already in container
  },
  trendingSection: {
    // Removed marginBottom, handled by FlatList spacing
    // Removed paddingLeft, handled by contentContainerStyle
    marginTop: 8, // Add some space above title if needed
    marginBottom: 20, // Space below trending section
  },
  trendingScrollContent: {
    paddingHorizontal: 16, // Add horizontal padding for the scroll view items
    paddingVertical: 4, // Add slight vertical padding
  },
  trendingTitle: {
    marginBottom: 12,
    fontWeight: "bold",
    color: "#1d3557", // Darker blue for section titles
    fontSize: 20, // Slightly smaller
    letterSpacing: 0.1,
    paddingHorizontal: 16, // Add padding to align with list items
  },
  trendingCardTouchable: {
    width: width * 0.65, // Slightly narrower cards
    height: 160, // Increased height
    borderRadius: 12, // Less rounded
    marginRight: 12, // Spacing between cards
    backgroundColor: "#ffffff", // Ensure background for shadow
    shadowColor: "#adb5bd",
    shadowOpacity: 0.15, // Slightly more shadow
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden", // Clip image/overlay
  },
  // Removed trendingCard style (merged into touchable)
  trendingCardImage: {
    ...StyleSheet.absoluteFillObject,
    // No extra styling needed here
  },
  trendingCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)", // Slightly darker overlay
    borderRadius: 12, // Match touchable
  },
  trendingCardContent: {
    position: 'absolute', // Position absolutely
    bottom: 0, // Align to bottom
    left: 0,
    right: 0,
    padding: 12, // Consistent padding
    zIndex: 2,
  },
  trendingCardTitle: {
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 3,
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  trendingCardMeta: {
    fontSize: 11,
    color: "#e9ecef",
    fontWeight: "500",
    marginBottom: 4, // Space before saved count
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  trendingCardSaved: {
    fontSize: 11,
    color: "#f1faee",
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  articlesList: {
    paddingHorizontal: 16,
    paddingTop: 0, // Remove top padding, handled by search bar margin
    paddingBottom: 40, // Space at the bottom
  },
  articleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12, // Consistent rounding
    padding: 16, // Standard padding
    marginBottom: 16,
    shadowColor: "#adb5bd",
    shadowOpacity: 0.1, // Subtle shadow
    shadowRadius: 10,
    elevation: 3, // Subtle elevation
    overflow: "hidden",
  },
  media: { // Style for image when placed at the top
    width: "100%", // Take full width
    height: 150, // Fixed height
    borderRadius: 8, // Slightly rounded corners for image
    marginBottom: 12, // Space below image
    backgroundColor: "#e9ecef",
  },
  articleHeader: { // Container for title and bookmark
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align items to the top
    marginBottom: 6, // Space below header
  },
  articleTitle: {
    flex: 1, // Allow title to wrap
    fontSize: 18, // Slightly larger title
    fontWeight: "bold",
    color: "#1d3557",
    lineHeight: 24, // Improve readability
    marginRight: 10, // Space between title and bookmark
  },
  bookmarkButton: {
    padding: 4, // Smaller padding around icon
    marginLeft: 8,
    // Removed background and shadow
  },
  metaContainer: { // Container for author and date
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorText: {
    fontSize: 13,
    color: "#007C91", // Use accent color
    fontWeight: "600", // Bolder author name
  },
  articleMeta: {
    fontSize: 13,
    color: "#6c757d",
    fontWeight: "400",
  },
  articleContent: {
    fontSize: 14, // Standard content size
    marginBottom: 12,
    color: "#495057",
    lineHeight: 20, // Adjust line height
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8, // Consistent gap
    marginBottom: 10,
  },
  tagTouchable: {
    borderRadius: 16,
    overflow: "hidden",
  },
  tag: {
    backgroundColor: "#e9ecef",
    color: "#457b9d",
    borderRadius: 16,
    paddingHorizontal: 10, // Adjusted padding
    paddingVertical: 4,
    fontSize: 11, // Smaller tags
    fontWeight: "500",
  },
  articleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 8, // Reduced top margin
    borderTopWidth: 1, // Add a subtle separator line
    borderTopColor: '#f1f3f5', // Very light separator color
    paddingTop: 8, // Space above the save count
  },
  savedCount: {
    fontSize: 12, // Smaller save count
    color: "#6c757d", // Muted color
    fontWeight: "500",
  },
  link: {
    color: "#0077b6",
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  // Removed separate media style, merged into articleCard's image style
  emptyText: {
    textAlign: "center",
    marginTop: 60,
    color: "#adb5bd",
    fontSize: 16,
    fontWeight: "500",
  },
});
