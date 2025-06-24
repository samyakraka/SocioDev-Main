import React, { useEffect, useState } from "react";
import { FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { getUserById } from "@/services/userService";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useUpsideDownRefresh } from "@/hooks/useUpsideDownRefresh";

export default function FollowingScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();

  const loadFollowing = async () => {
    setLoading(true);
    const user = await getUserById(uid);
    if (user?.username) {
      navigation.setOptions({ title: `${user.username}'s Following` });
    } else {
      navigation.setOptions({ title: "Following" });
    }
    const followingIds = user?.following || [];
    const users = await Promise.all(followingIds.map(getUserById));
    setFollowing(users.filter(Boolean));
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (mounted) await loadFollowing();
    }
    load();
    return () => {
      mounted = false;
    };
  }, [uid, navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFollowing();
    setRefreshing(false);
  };

  useUpsideDownRefresh(handleRefresh);

  if (loading) return <ThemedText>Loading...</ThemedText>;

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={following}
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
        ListEmptyComponent={<ThemedText>Not following anyone yet.</ThemedText>}
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
