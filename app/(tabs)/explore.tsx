import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { publicacionesService } from '../../services/publicaciones.service';
import { artistasService } from '../../services/artistas.service';
import { Publicacion } from '../../types/publicacion.types';
import { Usuario } from '../../types/usuario.types';
import { Colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 2;
const TILE_SIZE = (SCREEN_WIDTH - GAP * 2) / 3;

function buildRows(items: Publicacion[]) {
  const rows: { type: 'trio' | 'mosaic'; items: Publicacion[] }[] = [];
  let i = 0;
  let groupIndex = 0;
  while (i < items.length) {
    if (groupIndex % 2 === 0 && i + 3 <= items.length) {
      rows.push({ type: 'mosaic', items: items.slice(i, i + 3) });
      i += 3;
    } else if (i + 3 <= items.length) {
      rows.push({ type: 'trio', items: items.slice(i, i + 3) });
      i += 3;
    } else {
      rows.push({ type: 'trio', items: items.slice(i) });
      i = items.length;
    }
    groupIndex++;
  }
  return rows;
}

export default function ExploreScreen() {
  const router = useRouter();
  const [todas, setTodas] = useState<Publicacion[]>([]);
  const [filtradas, setFiltradas] = useState<Publicacion[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await publicacionesService.getFeed();
      setTodas(data);
      setFiltradas(data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const term = busqueda.trim();
    if (!term) {
      setFiltradas(todas);
      setUsuarios([]);
      return;
    }
    const t = term.toLowerCase();
    setFiltradas(
      todas.filter(
        (p) =>
          p.estilo?.toLowerCase().includes(t) ||
          p.zonaCuerpo?.toLowerCase().includes(t) ||
          p.descripcion?.toLowerCase().includes(t) ||
          p.usuario?.nombre?.toLowerCase().includes(t)
      )
    );

    setSearchingUsers(true);
    artistasService.buscarUsuarios(term)
      .then(setUsuarios)
      .catch(() => setUsuarios([]))
      .finally(() => setSearchingUsers(false));
  }, [busqueda, todas]);

  const rows = buildRows(filtradas);

  const renderTile = (item: Publicacion, width: number, height: number) => (
    <TouchableOpacity
      key={item.idPublicacion}
      activeOpacity={0.85}
      onPress={() => router.push(`/publicaciones/${item.idPublicacion}`)}
    >
      <Image
        source={{ uri: item.fotoUrl }}
        style={{ width, height, backgroundColor: Colors.surface }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderRow = ({ item }: { item: ReturnType<typeof buildRows>[number] }) => {
    if (item.type === 'trio') {
      return (
        <View style={styles.trioRow}>
          {item.items.map((p) => renderTile(p, TILE_SIZE, TILE_SIZE))}
          {item.items.length < 3 &&
            Array.from({ length: 3 - item.items.length }).map((_, i) => (
              <View key={`empty-${i}`} style={{ width: TILE_SIZE, height: TILE_SIZE }} />
            ))}
        </View>
      );
    }
    const [a, b, c] = item.items;
    const bigSize = TILE_SIZE * 2 + GAP;
    const smallSize = TILE_SIZE;
    return (
      <View style={styles.mosaicRow}>
        {a && renderTile(a, bigSize, bigSize)}
        <View style={styles.mosaicStack}>
          {b && renderTile(b, smallSize, smallSize)}
          {c && renderTile(c, smallSize, smallSize)}
          {!c && <View style={{ width: smallSize, height: smallSize }} />}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar tatuajes, estilos, artistas..."
          placeholderTextColor={Colors.textMuted}
          value={busqueda}
          onChangeText={setBusqueda}
          returnKeyType="search"
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={17} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderRow}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          ListHeaderComponent={
            busqueda.trim() ? (
              <View style={styles.usersSection}>
                <Text style={styles.usersTitle}>Personas</Text>
                {searchingUsers ? (
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 12 }} />
                ) : usuarios.length === 0 ? (
                  <Text style={styles.usersEmpty}>Sin resultados para "{busqueda}"</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.usersScroll}>
                    {usuarios.map((u) => (
                      <TouchableOpacity
                        key={u.idUsuario}
                        style={styles.userCard}
                        onPress={() => router.push(`/usuarios/${u.idUsuario}`)}
                        activeOpacity={0.8}
                      >
                        {u.avatar ? (
                          <Image source={{ uri: u.avatar }} style={styles.userAvatar} />
                        ) : (
                          <View style={styles.userAvatarPlaceholder}>
                            <Text style={styles.userAvatarInitial}>
                              {u.nombre?.charAt(0).toUpperCase() ?? '?'}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.userName} numberOfLines={1}>{u.nombre}</Text>
                        <Text style={styles.userRol}>{u.rol}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                {filtradas.length > 0 && (
                  <Text style={styles.usersTitle}>Publicaciones</Text>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {busqueda ? 'Sin publicaciones para tu búsqueda.' : 'No hay publicaciones aún.'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={filtradas.length === 0 ? styles.emptyFlex : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 12,
    marginVertical: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },
  /* Users section */
  usersSection: { paddingTop: 4, paddingBottom: 8 },
  usersTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  usersEmpty: {
    fontSize: 13,
    color: Colors.textMuted,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  usersScroll: { paddingHorizontal: 14, gap: 16 },
  userCard: { alignItems: 'center', width: 68, gap: 4 },
  userAvatar: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, borderColor: Colors.primary,
  },
  userAvatarPlaceholder: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  userAvatarInitial: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  userName: { fontSize: 12, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  userRol: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  /* Grid rows */
  trioRow: { flexDirection: 'row', gap: GAP },
  mosaicRow: { flexDirection: 'row', gap: GAP },
  mosaicStack: { flexDirection: 'column', gap: GAP },
  /* Empty */
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyFlex: { flexGrow: 1 },
  emptyText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center' },
});
