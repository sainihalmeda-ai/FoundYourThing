import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { fetchItems } from "../api/auth";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ErrorState } from "../components/ErrorState";
import { ItemCard } from "../components/ItemCard";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { ScreenShell } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Feed">;

export function FeedScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchItems>>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const data = await fetchItems(token);
      setItems(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  if (loading) return <LoadingOverlay label="Loading campus feed..." />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <View style={styles.root}>
      <ConnectionBanner />
      <ScreenShell title="Campus feed" subtitle="Only VTU IDs are shown. Contact details stay locked until both sides accept.">
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          renderItem={({ item }) => (
            <ItemCard item={item} onPress={() => navigation.navigate("ItemDetail", { itemId: item.id })} />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No open reports yet. Be the first to report a lost or found valuable.</Text>
          }
        />
      </ScreenShell>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  empty: { color: "#627D98", marginTop: 12, lineHeight: 20 },
});
