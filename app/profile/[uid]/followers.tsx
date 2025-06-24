import React, { useEffect, useState } from "react";
import { FlatList, TouchableOpacity, StyleSheet } from "react-native";
// Import useNavigation
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { getUserById } from "@/services/userService";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useUpsideDownRefresh } from "@/hooks/useUpsideDownRefresh";

export default function FollowersScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  // Get navigation object
  const navigation = useNavigation();

  const loadFollowers = async () => {
    setLoading(true);
    const user = await getUserById(uid);
    // Set header title using username
    if (user?.username) {
      navigation.setOptions({ title: `${user.username}'s Followers` });
    } else {
      navigation.setOptions({ title: "Followers" }); // Fallback title
    }
    const followerIds = user?.followers || [];
    const users = await Promise.all(followerIds.map(getUserById));
    setFollowers(users.filter(Boolean));
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (mounted) await loadFollowers();
    }
    load();
    return () => {
      mounted = false;
    };
  }, [uid, navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFollowers();
    setRefreshing(false);
  };

  useUpsideDownRefresh(handleRefresh);

  if (loading) return <ThemedText>Loading...</ThemedText>;

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={followers}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userRow}
            onPress={() => router.push(`/profile/${item.uid}`)}
          >
            <ThemedText>{item.username}</ThemedText>
            <ThemedText style={styles.email}>{item.email}</ThemedText>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<ThemedText>No followers yet.</ThemedText>}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f6fafd" },
  userRow: { padding: 12, borderBottomWidth: 1, borderColor: "#eee" },
  email: { color: "#888", fontSize: 13 },
});
