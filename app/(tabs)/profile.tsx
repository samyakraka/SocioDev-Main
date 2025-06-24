import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { fetchArticles, Article } from "@/services/articleService";
import { signOut } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../firebaseConfig";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { useUpsideDownRefresh } from "@/hooks/useUpsideDownRefresh";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking"; // Import Linking

export default function ProfileTabScreen() {
  // ...existing state and functions...
  const { user, userProfile, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null); // base64 string
  const [savingEdit, setSavingEdit] = useState(false);
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] =
    useState(false);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [editProfileImage, setEditProfileImage] = useState<string | null>(null); // base64 string for profile
  const [savingProfile, setSavingProfile] = useState(false);

  const loadArticles = async () => {
    setLoading(true);
    const all = await fetchArticles();
    setArticles(all.filter((a) => a.author?.uid === user?.uid));
    setLoading(false);
  };

  useEffect(() => {
    if (user?.uid) loadArticles();
  }, [user?.uid]);

  useUpsideDownRefresh(() => {
    if (user?.uid) loadArticles();
    refreshUserProfile();
  });

  useEffect(() => {
    if (userProfile) {
      setPortfolioUrl(userProfile.portfolioUrl || "");
      setGithubUrl(userProfile.githubUrl || "");
      setLinkedinUrl(userProfile.linkedinUrl || "");
      // Don't pre-fill editProfileImage here, only when opening modal
    }
  }, [userProfile]);

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Delete Article",
      "Are you sure you want to delete this article?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(id);
            try {
              await deleteDoc(doc(db, "articles", id));
              setArticles((arts) => arts.filter((a) => a.id !== id));
            } catch (e) {
              Alert.alert("Error", "Failed to delete article.");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setEditTitle(article.title);
    setEditContent(article.content);
    setEditTags((article.tags || []).join(", "));
    setEditImage(article.imageBase64 || null);
  };

  // Pick a new image for editing
  const handlePickEditImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      let base64 = asset.base64;
      if (!base64 && asset.uri) {
        base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
      setEditImage(base64 || null);
    }
  };

  const handleEditSave = async () => {
    if (!editingArticle) return;
    if (!editTitle.trim() || !editContent.trim()) {
      Alert.alert("Error", "Title and content are required.");
      return;
    }
    setSavingEdit(true);
    try {
      await updateDoc(doc(db, "articles", editingArticle.id), {
        title: editTitle.trim(),
        content: editContent.trim(),
        tags: editTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        imageBase64: editImage || null,
      });
      setArticles((arts) =>
        arts.map((a) =>
          a.id === editingArticle.id
            ? {
                ...a,
                title: editTitle.trim(),
                content: editContent.trim(),
                tags: editTags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
                imageBase64: editImage || undefined,
              }
            : a
        )
      );
      setEditingArticle(null);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update article.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditProfileOpen = () => {
    // Pre-fill fields from current profile
    setPortfolioUrl(userProfile?.portfolioUrl || "");
    setGithubUrl(userProfile?.githubUrl || "");
    setLinkedinUrl(userProfile?.linkedinUrl || "");
    setEditProfileImage(userProfile?.profileImageBase64 || null); // Pre-fill image for editing
    setIsEditProfileModalVisible(true);
  };

  // Pick a new profile image
  const handlePickProfileImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Allow editing for profile pics
      aspect: [1, 1], // Square aspect ratio
      quality: 0.6, // Slightly lower quality for profile pics is often fine
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      let base64 = asset.base64;
      // Fallback if base64 isn't directly available (less common now)
      if (!base64 && asset.uri) {
        try {
          base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (e) {
          console.error("Error reading image file:", e);
          Alert.alert("Error", "Could not read image file.");
          return;
        }
      }
      setEditProfileImage(base64 || null);
    }
  };

  const handleProfileSave = async () => {
    if (!user?.uid) return;
    setSavingProfile(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        portfolioUrl: portfolioUrl.trim() || null, // Store null if empty
        githubUrl: githubUrl.trim() || null,
        linkedinUrl: linkedinUrl.trim() || null,
        profileImageBase64: editProfileImage || null, // Save the new profile image
      });
      await refreshUserProfile(); // Refresh profile data from context
      setIsEditProfileModalVisible(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (e: any) {
      console.error("Profile update error:", e);
      Alert.alert("Error", e.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
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

  const handleLogout = async () => {
    await signOut();
    router.replace("/intro");
  };

  if (!userProfile) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={{ marginTop: 10 }}>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  // Move profile card and section title to header
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.profileCard}>
        {/* Profile Picture */}
        <TouchableOpacity
          onPress={handleEditProfileOpen}
          style={styles.profilePicContainer}
        >
          {userProfile.profileImageBase64 ? (
            <Image
              source={{
                uri: `data:image/jpeg;base64,${userProfile.profileImageBase64}`,
              }}
              style={styles.profilePic}
            />
          ) : (
            <View style={styles.profilePicPlaceholder}>
              <Ionicons name="person" size={50} color="#0a7ea4" />
            </View>
          )}
          {/* Optional: Add a small edit icon overlay */}
          <View style={styles.editIconOverlay}>
            <Ionicons name="camera-outline" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.username}>
          {userProfile.username}
        </ThemedText>
        <ThemedText style={styles.email}>{userProfile.email}</ThemedText>

        {/* Social Links */}
        <View style={styles.socialLinksContainer}>
          {userProfile.portfolioUrl && (
            <TouchableOpacity
              onPress={() => openLink(userProfile.portfolioUrl)}
              style={styles.socialLinkButton}
            >
              <Ionicons name="globe-outline" size={20} color="#0a7ea4" />
            </TouchableOpacity>
          )}
          {userProfile.githubUrl && (
            <TouchableOpacity
              onPress={() => openLink(userProfile.githubUrl)}
              style={styles.socialLinkButton}
            >
              <Ionicons name="logo-github" size={20} color="#333" />
            </TouchableOpacity>
          )}
          {userProfile.linkedinUrl && (
            <TouchableOpacity
              onPress={() => openLink(userProfile.linkedinUrl)}
              style={styles.socialLinkButton}
            >
              <Ionicons name="logo-linkedin" size={20} color="#0e76a8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.countsRow}>
          <TouchableOpacity
            style={styles.countButton}
            onPress={() => router.push(`/profile/${userProfile.uid}/followers`)}
          >
            <ThemedText style={styles.countNumber}>
              {userProfile.followers?.length || 0}
            </ThemedText>
            <ThemedText style={styles.countLabel}>Followers</ThemedText>
          </TouchableOpacity>
          <View style={styles.countSeparator} />
          <TouchableOpacity
            style={styles.countButton}
            onPress={() => router.push(`/profile/${userProfile.uid}/following`)}
          >
            <ThemedText style={styles.countNumber}>
              {userProfile.following?.length || 0}
            </ThemedText>
            <ThemedText style={styles.countLabel}>Following</ThemedText>
          </TouchableOpacity>
        </View>
        {/* Edit Profile Button */}
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={handleEditProfileOpen}
        >
          <Ionicons name="pencil-outline" size={18} color="#0a7ea4" />
          <ThemedText style={styles.editProfileText}>Edit Profile</ThemedText>
        </TouchableOpacity>
      </View>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        My Articles
      </ThemedText>
    </View>
  );

  // Move logout button to footer
  const renderFooter = () => (
    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
      <Ionicons
        name="log-out-outline"
        size={22}
        color="#dc3545" // Use a distinct color for logout
        style={{ marginRight: 8 }}
      />
      <ThemedText style={styles.logoutBtnText}>Logout</ThemedText>
    </TouchableOpacity>
  );

  if (loading && articles.length === 0) {
    // Show loader only on initial load
    return (
      <ThemedView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Edit Article Modal */}
      <Modal
        visible={!!editingArticle}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingArticle(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackdrop}
        >
          <ScrollView contentContainerStyle={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <ThemedText type="title" style={styles.modalHeader}>
                Edit Article
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Title"
                value={editTitle}
                onChangeText={setEditTitle}
                placeholderTextColor="#999"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Content"
                value={editContent}
                onChangeText={setEditContent}
                multiline
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Tags (comma separated)"
                value={editTags}
                onChangeText={setEditTags}
                placeholderTextColor="#999"
              />
              {/* Image editing section */}
              {editImage && (
                <View style={styles.mediaPreviewContainer}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${editImage}` }}
                    style={styles.mediaPreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setEditImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={handlePickEditImage}
              >
                <Ionicons
                  name="image-outline"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <ThemedText style={styles.mediaButtonText}>
                  {editImage ? "Change Image" : "Add Image"}
                </ThemedText>
              </TouchableOpacity>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setEditingArticle(null)}
                  disabled={savingEdit}
                >
                  <ThemedText
                    style={[styles.actionButtonText, styles.cancelButtonText]}
                  >
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.saveButton,
                    savingEdit && styles.buttonDisabled,
                  ]}
                  onPress={handleEditSave}
                  disabled={savingEdit}
                >
                  {savingEdit ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <ThemedText style={styles.actionButtonText}>
                      Save
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditProfileModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditProfileModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackdrop}
        >
          <ScrollView contentContainerStyle={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <ThemedText type="title" style={styles.modalHeader}>
                Edit Profile
              </ThemedText>

              {/* Profile Image Editing Section */}
              <View style={styles.profileImageEditContainer}>
                <ThemedText style={styles.modalSubHeader}>
                  Profile Picture
                </ThemedText>
                {editProfileImage && (
                  <View style={styles.mediaPreviewContainer}>
                    <Image
                      source={{
                        uri: `data:image/jpeg;base64,${editProfileImage}`,
                      }}
                      style={[styles.mediaPreview, styles.profilePreview]} // Specific style for profile preview
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setEditProfileImage(null)}
                    >
                      <Ionicons name="close-circle" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={handlePickProfileImage}
                >
                  <Ionicons
                    name="camera-outline"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <ThemedText style={styles.mediaButtonText}>
                    {editProfileImage ? "Change Photo" : "Upload Photo"}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <ThemedText style={styles.modalSubHeader}>
                Social Links
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Portfolio Website URL"
                value={portfolioUrl}
                onChangeText={setPortfolioUrl}
                placeholderTextColor="#999"
                keyboardType="url"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="GitHub Profile URL"
                value={githubUrl}
                onChangeText={setGithubUrl}
                placeholderTextColor="#999"
                keyboardType="url"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="LinkedIn Profile URL"
                value={linkedinUrl}
                onChangeText={setLinkedinUrl}
                placeholderTextColor="#999"
                keyboardType="url"
                autoCapitalize="none"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setIsEditProfileModalVisible(false)}
                  disabled={savingProfile}
                >
                  <ThemedText
                    style={[styles.actionButtonText, styles.cancelButtonText]}
                  >
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.saveButton,
                    savingProfile && styles.buttonDisabled,
                  ]}
                  onPress={handleProfileSave}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    // Use existing text style, just change text
                    <ThemedText
                      style={[styles.actionButtonText, { color: "#fff" }]}
                    >
                      Save Profile
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Main Content List */}
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.articleCard}>
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
                <View style={styles.articleActions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleEdit(item)}
                  >
                    <Ionicons name="create-outline" size={20} color="#0a7ea4" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? (
                      <ActivityIndicator size="small" color="#dc3545" />
                    ) : (
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#dc3545"
                      />
                    )}
                  </TouchableOpacity>
                </View>
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
          </View>
        )}
        ListEmptyComponent={
          !loading && ( // Only show if not loading
            <View style={styles.emptyStateContainer}>
              <Ionicons name="document-text-outline" size={60} color="#ccc" />
              <ThemedText style={styles.emptyStateText}>
                You haven't posted any articles yet.
              </ThemedText>
              <ThemedText style={styles.emptyStateSubText}>
                Pull down to refresh or create a new post!
              </ThemedText>
            </View>
          )
        }
        contentContainerStyle={styles.listContentContainer}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Lighter background
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40, // Ensure space for logout button
  },
  headerContainer: {
    paddingTop: 40, // Increased padding from 20 to 40 (adjust as needed)
    marginBottom: 10,
  },

  // Profile Card
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  profilePicContainer: {
    // New container for image and overlay
    position: "relative", // Needed for overlay positioning
    marginBottom: 12,
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e9ecef",
  },
  profilePicPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
    // marginBottom: 12, // Removed margin, handled by container
  },
  editIconOverlay: {
    // Small icon overlay on profile picture
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 4,
    borderRadius: 12, // Make it circular
  },
  username: {
    fontWeight: "600", // Semibold
    fontSize: 24,
    color: "#212529",
    marginBottom: 4,
  },
  email: {
    color: "#6c757d", // Grayer text
    fontSize: 15,
    marginBottom: 10, // Reduced margin
  },
  socialLinksContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16, // Space before counts
    gap: 15, // Space between icons
  },
  socialLinkButton: {
    padding: 5, // Add some padding for easier tapping
  },
  countsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "80%", // Limit width for better spacing
    marginBottom: 16, // Add margin below counts row
  },
  countButton: {
    alignItems: "center",
    flex: 1, // Make buttons take equal space
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
    backgroundColor: "#dee2e6", // Light separator line
    marginHorizontal: 10,
  },
  // editProfileButton: { // Optional Edit Button Style
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   marginTop: 16,
  //   paddingVertical: 8,
  //   paddingHorizontal: 16,
  //   borderRadius: 20,
  //   borderWidth: 1,
  //   borderColor: '#0a7ea4',
  // },
  // editProfileText: {
  //   marginLeft: 6,
  //   color: '#0a7ea4',
  //   fontWeight: '500',
  // },

  // Section Title
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
    fontWeight: "600",
    color: "#343a40",
    fontSize: 18,
    paddingHorizontal: 4, // Align with card padding
  },

  // Article Card
  articleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden", // Clip image corners
  },
  articleImagePreview: {
    width: "100%",
    height: 150, // Adjust height as needed
    backgroundColor: "#eee",
  },
  articleContent: {
    padding: 14,
  },
  articleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start", // Align title top, icons top
    marginBottom: 6,
  },
  articleTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#343a40",
    flex: 1, // Take available space
    marginRight: 8,
  },
  articleActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  articleExcerpt: {
    marginTop: 4,
    color: "#495057",
    fontSize: 14,
    lineHeight: 20,
  },
  iconBtn: {
    marginLeft: 8,
    padding: 6, // Slightly larger touch area
    borderRadius: 15, // Circular background on press (optional)
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 6,
  },
  tag: {
    backgroundColor: "#e0f7fa", // Lighter blue background
    borderRadius: 12, // Pill shape
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: "#0a7ea4", // Main blue color
    fontSize: 12,
    fontWeight: "500",
  },

  // Empty State
  emptyStateContainer: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 16,
    color: "#6c757d",
    fontWeight: "500",
  },
  emptyStateSubText: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    color: "#adb5bd",
  },

  // Logout Button
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff", // White background
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: "center",
    marginTop: 20, // Space above
    marginBottom: 20, // Space below
    borderWidth: 1,
    borderColor: "#dee2e6", // Light border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  logoutBtnText: {
    color: "#dc3545", // Red text for logout action
    fontWeight: "600",
    fontSize: 16,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end", // Position modal at the bottom or center
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Darker backdrop
  },
  modalScrollView: {
    flexGrow: 1,
    justifyContent: "center", // Center content vertically if screen is tall
  },
  modalContent: {
    backgroundColor: "#ffffff",
    margin: 16, // Margin around the modal
    borderRadius: 16, // More rounded corners
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 30 : 20, // Extra padding for home indicator on iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 }, // Shadow for modal coming from bottom
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    textAlign: "center",
    marginBottom: 20,
    color: "#212529",
    fontWeight: "600",
    fontSize: 20,
  },
  modalSubHeader: {
    // Style for sub-sections in the modal
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 10,
    marginTop: 10, // Add some space above subheaders
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  profileImageEditContainer: {
    // Container for profile image editing in modal
    alignItems: "center", // Center items horizontally
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#f8f9fa", // Light input background
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dee2e6", // Lighter border
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
    color: "#343a40",
  },
  textArea: {
    minHeight: 100, // Ensure decent height
    textAlignVertical: "top", // Align text top in multiline
    paddingTop: 12,
  },
  mediaPreviewContainer: {
    marginBottom: 12,
    position: "relative", // For positioning the remove button
    alignItems: "center", // Center preview if needed
  },
  mediaPreview: {
    width: "100%",
    aspectRatio: 16 / 9, // Maintain aspect ratio
    borderRadius: 10,
    backgroundColor: "#e9ecef",
  },
  profilePreview: {
    // Specific style for the square profile preview
    width: 150, // Or desired size
    height: 150,
    aspectRatio: 1, // Ensure it's square
    borderRadius: 75, // Make it circular
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 2,
    // Adjust position if needed for circular preview
    top: 5,
    right: 5,
  },
  mediaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a7ea4", // Primary color
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 16, // Space before actions
    width: "80%", // Make button slightly less wide
    marginTop: 5, // Add margin if there's no preview initially
  },
  mediaButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10, // Add gap between buttons
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    flex: 1, // Make buttons take equal width
    justifyContent: "center",
    minHeight: 46, // Ensure consistent button height
  },
  actionButtonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#fff", // Ensure save button text is white by default
  },
  saveButton: {
    backgroundColor: "#0a7ea4", // Primary color
  },
  // saveButtonText: { // Combined into actionButtonText
  //    color: "#fff",
  // },
  cancelButton: {
    backgroundColor: "#f8f9fa", // Light background for cancel
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  cancelButtonText: {
    color: "#495057", // Darker gray text
  },
  buttonDisabled: {
    backgroundColor: "#adb5bd", // Disabled color
  },
  editProfileButton: {
    // Optional Edit Button Style
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8, // Adjusted margin
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#0a7ea4",
  },
  editProfileText: {
    marginLeft: 6,
    color: "#0a7ea4",
    fontWeight: "500",
  },
});
