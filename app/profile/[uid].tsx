import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  FlatList,
  Image,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { getUserById, followUser, unfollowUser } from "@/services/userService";
import { UserProfile } from "@/services/authService";
import { fetchArticles, Article } from "@/services/articleService";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUpsideDownRefresh } from "@/hooks/useUpsideDownRefresh";

export default function UserProfileScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const {
    user: currentUser,
    userProfile: currentUserProfile,
    refreshUserProfile,
    bookmarks,
    refreshBookmarks,
  } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileAndArticles = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setLoadingArticles(true);

    try {
      // Fetch profile
      const userProfileData = await getUserById(uid);
      if (userProfileData) {
        setProfile(userProfileData as UserProfile);
        if (currentUserProfile?.following?.includes(uid)) {
          setIsFollowing(true);
        } else {
          setIsFollowing(false);
        }
      } else {
        Alert.alert("Error", "User profile not found.");
        if (router.canGoBack()) router.back();
        return;
      }

      // Fetch articles
      const allArticles = await fetchArticles();
      setArticles(allArticles.filter((a) => a.author?.uid === uid));
    } catch (error) {
      console.error("Failed to fetch profile or articles:", error);
      Alert.alert("Error", "Could not load profile or articles.");
    } finally {
      setLoading(false);
      setLoadingArticles(false);
    }
  }, [uid, currentUserProfile?.following, router]);

  useEffect(() => {
    fetchProfileAndArticles();
  }, [fetchProfileAndArticles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfileAndArticles();
    await refreshUserProfile();
    await refreshBookmarks();
    setRefreshing(false);
  };

  useUpsideDownRefresh(handleRefresh);

  const handleFollowToggle = async () => {
    if (!currentUser || !profile || currentUser.uid === profile.uid) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(currentUser.uid, profile.uid);
        setIsFollowing(false);
      } else {
        await followUser(currentUser.uid, profile.uid);
        setIsFollowing(true);
      }
      // Refresh both profiles' data after follow/unfollow
      await fetchProfileAndArticles();
      await refreshUserProfile();
    } catch (error) {
      console.error("Follow/Unfollow error:", error);
      Alert.alert("Error", "Could not update follow status.");
    } finally {
      setFollowLoading(false);
    }
  };

  // Function to safely open URLs
  const openLink = (url: string | undefined | null) => {
    if (!url) return;
    let fullUrl = url.trim();
    // Prepend https:// if no scheme is present
    if (!fullUrl.match(/^https?:\/\//i)) {
      fullUrl = `https://${fullUrl}`;
    }
    Linking.canOpenURL(fullUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(fullUrl);
        } else {
          Alert.alert("Error", `Cannot open URL: ${fullUrl}`);
        }
      })
      .catch((err) => {
        console.error("Error opening URL:", err);
        Alert.alert("Error", "Could not open link.");
      });
  };

  // Article Card Component (Simplified version from index.tsx)
  const ArticleCard = ({ item }: { item: Article }) => {
    const isBookmarked = bookmarks.includes(item.id);
    // Add bookmarking logic if needed, similar to index.tsx

    return (
      <TouchableOpacity
        style={styles.articleCard}
        onPress={() => router.push(`/article/${item.id}`)}
        activeOpacity={0.7}
      >
        {item.imageBase64 && (
          <Image
            source={{ uri: `data:image/jpeg;base64,${item.imageBase64}` }}
            style={styles.articleImagePreview}
          />
        )}
        <View style={styles.articleContent}>
          <View style={styles.articleHeader}>
            <ThemedText type="subtitle" style={styles.articleTitle}>
              {item.title}
            </ThemedText>
          </View>
          <ThemedText numberOfLines={3} style={styles.articleExcerpt}>
            {item.content}
          </ThemedText>
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <ThemedText style={styles.tagText}>#{tag}</ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || !profile) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </ThemedView>
    );
  }

  const isCurrentUserProfile = currentUser?.uid === profile.uid;

  // Header component for FlatList
  const renderHeader = () => (
    <>
      <ThemedView style={styles.profileCard}>
        {profile.profileImageBase64 ? (
          <Image
            source={{
              uri: `data:image/jpeg;base64,${profile.profileImageBase64}`,
            }}
            style={styles.profilePic}
          />
        ) : (
          <View style={styles.profilePicPlaceholder}>
            <Ionicons
              name="person"
              size={50}
              color={Colors[colorScheme].tint}
            />
          </View>
        )}
        <ThemedText type="title" style={styles.username}>
          {profile.username}
        </ThemedText>
        <ThemedText style={styles.email}>{profile.email}</ThemedText>

        {/* Social Links */}
        <View style={styles.socialLinksContainer}>
          {profile.portfolioUrl && (
            <TouchableOpacity
              onPress={() => openLink(profile.portfolioUrl)}
              style={styles.socialLinkButton}
            >
              <Ionicons name="globe-outline" size={20} color="#0a7ea4" />
            </TouchableOpacity>
          )}
          {profile.githubUrl && (
            <TouchableOpacity
              onPress={() => openLink(profile.githubUrl)}
              style={styles.socialLinkButton}
            >
              <Ionicons name="logo-github" size={20} color="#333" />
            </TouchableOpacity>
          )}
          {profile.linkedinUrl && (
            <TouchableOpacity
              onPress={() => openLink(profile.linkedinUrl)}
              style={styles.socialLinkButton}
            >
              <Ionicons name="logo-linkedin" size={20} color="#0e76a8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.countsRow}>
          <TouchableOpacity
            style={styles.countButton}
            onPress={() => router.push(`/profile/${profile.uid}/followers`)}
          >
            <ThemedText style={styles.countNumber}>
              {profile.followers?.length || 0}
            </ThemedText>
            <ThemedText style={styles.countLabel}>Followers</ThemedText>
          </TouchableOpacity>
          <View style={styles.countSeparator} />
          <TouchableOpacity
            style={styles.countButton}
            onPress={() => router.push(`/profile/${profile.uid}/following`)}
          >
            <ThemedText style={styles.countNumber}>
              {profile.following?.length || 0}
            </ThemedText>
            <ThemedText style={styles.countLabel}>Following</ThemedText>
          </TouchableOpacity>
        </View>

        {!isCurrentUserProfile && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing ? styles.followingButton : styles.followButton,
              followLoading && styles.buttonDisabled,
            ]}
            onPress={handleFollowToggle}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.followButtonText}>
                {isFollowing ? "Following" : "Follow"}
              </ThemedText>
            )}
          </TouchableOpacity>
        )}
      </ThemedView>

      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Articles by {profile.username}
      </ThemedText>
    </>
  );

  return (
    <>
      <Stack.Screen options={{ title: profile.username || "Profile" }} />
      <FlatList
        style={[
          styles.container,
          { backgroundColor: Colors[colorScheme].background },
        ]}
        data={articles}
        renderItem={ArticleCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loadingArticles && (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="document-text-outline" size={40} color="#ccc" />
              <ThemedText style={styles.emptyStateText}>
                No articles posted yet.
              </ThemedText>
            </View>
          )
        }
        ListFooterComponent={
          loadingArticles ? (
            <ActivityIndicator
              style={{ marginVertical: 20 }}
              size="large"
              color={Colors[colorScheme].tint}
            />
          ) : null
        }
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContentContainer}
      />
    </>
  );
}

// Add/update styles similar to app/(tabs)/profile.tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContentContainer: {
    paddingBottom: 40, // Ensure space at the bottom
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginHorizontal: 16, // Add horizontal margin to match list padding
    marginTop: 16, // Add top margin
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e9ecef",
    marginBottom: 12,
  },
  profilePicPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  username: {
    fontWeight: "600",
    fontSize: 24,
    color: "#212529",
    marginBottom: 4,
  },
  email: {
    color: "#6c757d",
    fontSize: 15,
    marginBottom: 10,
  },
  socialLinksContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    gap: 15,
  },
  socialLinkButton: {
    padding: 5,
  },
  countsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
    marginBottom: 16,
  },
  countButton: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 8,
  },
  countNumber: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#0a7ea4",
  },
  countLabel: {
    fontSize: 13,
    color: "#6c757d",
    marginTop: 2,
  },
  countSeparator: {
    width: 1,
    height: "60%",
    backgroundColor: "#dee2e6",
    marginHorizontal: 10,
  },
  followButton: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 10,
    minWidth: 120,
    alignItems: "center",
  },
  followingButton: {
    backgroundColor: "#6c757d", // Gray when following
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 10,
    minWidth: 120,
    alignItems: "center",
  },
  followButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
    fontWeight: "600",
    color: "#343a40",
    fontSize: 18,
    paddingHorizontal: 20,
  },
  emptyStateContainer: {
    alignItems: "center",
    marginTop: 30,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 15,
    color: "#6c757d",
  },
  // Styles for articles
  articleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  articleImagePreview: {
    width: "100%",
    height: 150,
    backgroundColor: "#eee",
  },
  articleContent: {
    padding: 14,
  },
  articleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  articleTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#343a40",
    flex: 1,
    marginRight: 8,
  },
  articleExcerpt: {
    marginTop: 4,
    color: "#495057",
    fontSize: 14,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 6,
  },
  tag: {
    backgroundColor: "#e0f7fa",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: "#0a7ea4",
    fontSize: 12,
    fontWeight: "500",
  },
});
