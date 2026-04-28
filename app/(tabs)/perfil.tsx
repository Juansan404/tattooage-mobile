import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { publicacionesService } from '../../services/publicaciones.service';
import { Usuario } from '../../types/usuario.types';
import { Publicacion } from '../../types/publicacion.types';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_TILE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

// Highlights de ejemplo (decorativo)
const HIGHLIGHTS = [
  { id: '1', label: 'Blackwork', emoji: '🖤' },
  { id: '2', label: 'Realismo', emoji: '🎨' },
  { id: '3', label: 'Japonés', emoji: '🐉' },
  { id: '4', label: 'Flash', emoji: '⚡' },
];

export default function PerfilScreen() {
  const router = useRouter();
  const { idUsuario, rol, logout } = useAuthStore();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'grid' | 'tagged'>('grid');

  const cargar = useCallback(async () => {
    if (!idUsuario) return;
    try {
      const [userRes, allPubs] = await Promise.all([
        api.get<Usuario>(`/usuarios/${idUsuario}`),
        publicacionesService.getFeed(),
      ]);
      setUsuario(userRes.data);
      // Filtrar publicaciones del usuario actual
      setPublicaciones(allPubs.filter((p) => p.usuario?.idUsuario === idUsuario));
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [idUsuario]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const ListHeader = () => (
    <View>
      {/* ── Bio section ── */}
      <View style={styles.bioSection}>
        {/* Fila: avatar + stats */}
        <View style={styles.avatarStatsRow}>
          {/* Avatar */}
          {usuario?.avatar ? (
            <Image source={{ uri: usuario.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {usuario?.nombre?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{publicaciones.length}</Text>
              <Text style={styles.statLabel}>publicaciones</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>—</Text>
              <Text style={styles.statLabel}>seguidores</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>—</Text>
              <Text style={styles.statLabel}>seguidos</Text>
            </View>
          </View>
        </View>

        {/* Nombre + bio */}
        <View style={styles.nameBlock}>
          <Text style={styles.displayName}>
            {usuario?.nombre ?? ''}{usuario?.apellidos ? ` ${usuario.apellidos}` : ''}
          </Text>
          {/* Badge de rol */}
          <View style={styles.rolBadge}>
            <Text style={styles.rolText}>{rol}</Text>
          </View>
          {usuario?.bio && (
            <Text style={styles.bio}>{usuario.bio}</Text>
          )}
        </View>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/perfil/editar')}>
            <Text style={styles.editBtnText}>Editar perfil</Text>
          </TouchableOpacity>
          {rol === 'ARTISTA' && (
            <TouchableOpacity
              style={styles.newPostBtn}
              onPress={() => router.push('/portfolio/nueva')}
            >
              <Text style={styles.newPostBtnText}>+ Publicar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Highlights (decorativo) ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.highlightsScroll}
        style={styles.highlightsContainer}
      >
        {HIGHLIGHTS.map((h) => (
          <TouchableOpacity key={h.id} style={styles.highlightItem} activeOpacity={0.8}>
            <View style={styles.highlightRing}>
              <Text style={styles.highlightEmoji}>{h.emoji}</Text>
            </View>
            <Text style={styles.highlightLabel}>{h.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Tabs ── */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'grid' && styles.tabActive]}
          onPress={() => setActiveTab('grid')}
        >
          <Text style={[styles.tabIcon, activeTab === 'grid' && styles.tabIconActive]}>⊞</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tagged' && styles.tabActive]}
          onPress={() => setActiveTab('tagged')}
        >
          <Text style={[styles.tabIcon, activeTab === 'tagged' && styles.tabIconActive]}>👤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header con username + menú ── */}
      <View style={styles.header}>
        <Text style={styles.headerUsername}>
          {usuario?.nombre?.toLowerCase().replace(/\s+/g, '_') ?? 'mi_perfil'}
        </Text>
        <TouchableOpacity onPress={handleLogout} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.headerMenu}>☰</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'grid' ? (
        <FlatList
          data={publicaciones}
          keyExtractor={(item) => String(item.idPublicacion)}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          ListHeaderComponent={<ListHeader />}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(`/publicaciones/${item.idPublicacion}`)}
            >
              <Image
                source={{ uri: item.fotoUrl }}
                style={styles.gridTile}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyGrid}>
              <Text style={styles.emptyGridIcon}>📷</Text>
              <Text style={styles.emptyGridTitle}>Sin publicaciones</Text>
              <Text style={styles.emptyGridSub}>
                {rol === 'ARTISTA'
                  ? 'Comparte tu primer trabajo.'
                  : 'Aún no hay publicaciones.'}
              </Text>
              {rol === 'ARTISTA' && (
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={() => router.push('/portfolio/nueva')}
                >
                  <Text style={styles.uploadBtnText}>Subir foto</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
        />
      ) : (
        <FlatList
          data={[]}
          ListHeaderComponent={<ListHeader />}
          renderItem={() => null}
          ListEmptyComponent={
            <View style={styles.emptyGrid}>
              <Text style={styles.emptyGridIcon}>🏷️</Text>
              <Text style={styles.emptyGridTitle}>Sin etiquetas</Text>
              <Text style={styles.emptyGridSub}>Las fotos en las que te etiqueten aparecerán aquí.</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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
  headerUsername: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 0.2,
  },
  headerMenu: {
    fontSize: 22,
    color: Colors.text,
  },

  /* Bio section */
  bioSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  avatarStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  nameBlock: {
    gap: 4,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  rolBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '22',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rolText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  bio: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  /* Botones */
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  editBtnText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  newPostBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  newPostBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },

  /* Highlights */
  highlightsContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingBottom: 14,
  },
  highlightsScroll: {
    paddingHorizontal: 16,
    gap: 18,
  },
  highlightItem: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  highlightRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  highlightEmoji: { fontSize: 26 },
  highlightLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  /* Tabs */
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.text,
  },
  tabIcon: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  tabIconActive: {
    color: Colors.text,
  },

  /* Grid */
  gridRow: {
    gap: GRID_GAP,
  },
  gridTile: {
    width: GRID_TILE,
    height: GRID_TILE,
    backgroundColor: Colors.surface,
  },

  /* Empty grid */
  emptyGrid: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyGridIcon: { fontSize: 48 },
  emptyGridTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyGridSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  uploadBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
