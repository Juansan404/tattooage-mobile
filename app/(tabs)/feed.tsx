import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { publicacionesService } from '../../services/publicaciones.service';
import { Publicacion } from '../../types/publicacion.types';
import { Colors } from '../../constants/colors';
import PostCard from '../../components/feed/PostCard';
import StoriesRow from '../../components/feed/StoriesRow';

export default function FeedScreen() {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarFeed = useCallback(async () => {
    try {
      setError(null);
      const data = await publicacionesService.getFeed();
      setPublicaciones(data);
    } catch {
      setError('No se pudo cargar el feed. Verifica tu conexión.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarFeed();
  }, [cargarFeed]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarFeed();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* ── Header estilo Instagram ── */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>
          Tattoo<Text style={styles.headerLogoAccent}>Age</Text>
        </Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="heart-outline" size={26} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="paper-plane-outline" size={26} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={cargarFeed}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={publicaciones}
          keyExtractor={(item) => String(item.idPublicacion)}
          renderItem={({ item }) => <PostCard publicacion={item} />}
          ListHeaderComponent={<StoriesRow />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          contentContainerStyle={
            publicaciones.length === 0 ? styles.emptyContainer : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyInner}>
              <Text style={styles.emptyTitle}>Aún no hay publicaciones</Text>
              <Text style={styles.emptySubtext}>
                Sigue a artistas para ver su trabajo aquí.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View style={styles.separator} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  headerLogo: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
    fontStyle: 'italic',
  },
  headerLogoAccent: {
    color: Colors.primary,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  headerIcon: {},
  headerIconText: {
    fontSize: 22,
  },
  /* Vacío */
  emptyContainer: {
    flexGrow: 1,
  },
  emptyInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  /* Error */
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    fontSize: 15,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  separator: {
    height: 0.5,
    backgroundColor: Colors.border,
  },
});
