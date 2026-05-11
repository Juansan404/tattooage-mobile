import { useEffect, useState, useCallback, useRef } from 'react';
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
import { estilosService } from '../../services/estilos.service';
import { Publicacion } from '../../types/publicacion.types';
import { Estilo } from '../../types/estilo.types';
import { Usuario } from '../../types/usuario.types';
import { useColors } from '../../hooks/useColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 2;
const TILE_SIZE = (SCREEN_WIDTH - GAP * 2) / 3;
const PAGE_SIZE = 15;

export default function ExploreScreen() {
  const Colors = useColors();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    headerFixed: {
      flexShrink: 0,
      backgroundColor: Colors.background,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      marginHorizontal: 12,
      marginVertical: 10,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
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
    /* Chips de estilos */
    chipsContainer: {
      borderBottomWidth: 0.5,
      borderBottomColor: Colors.border,
      height: 46,
    },
    chipsScroll: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      alignItems: 'center',
      flexDirection: 'row',
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: Colors.surface,
      borderWidth: 0.5,
      borderColor: Colors.border,
      height: 30,
      justifyContent: 'center',
    },
    chipActivo: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    chipText: {
      fontSize: 12,
      color: Colors.textSecondary,
      fontWeight: '500',
      lineHeight: 16,
    },
    chipTextActivo: {
      color: Colors.white,
      fontWeight: '700',
    },
    /* Grid */
    gridRow: { gap: GAP },
    tile: { width: TILE_SIZE, height: TILE_SIZE, backgroundColor: Colors.surface },
    /* Footer */
    footerLoader: { paddingVertical: 20, alignItems: 'center' },
    footerEnd: {
      textAlign: 'center',
      color: Colors.textMuted,
      fontSize: 12,
      paddingVertical: 20,
      letterSpacing: 0.5,
    },
    /* Empty */
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    emptyFlex: { flexGrow: 1 },
    emptyText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center' },
  });

  const router = useRouter();
  const [todas, setTodas] = useState<Publicacion[]>([]);
  const [filtradas, setFiltradas] = useState<Publicacion[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [estilos, setEstilos] = useState<Estilo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [estiloActivo, setEstiloActivo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const nextPage = useRef(0);
  const fetching = useRef(false);

  const cargarPagina = useCallback(async (reset: boolean) => {
    if (fetching.current) return;
    fetching.current = true;

    const page = reset ? 0 : nextPage.current;

    try {
      const data = await publicacionesService.getFeedPage(page, PAGE_SIZE);
      const content: Publicacion[] = Array.isArray(data)
        ? (data as unknown as Publicacion[])
        : (data.content ?? []);
      const isLast: boolean = Array.isArray(data) ? true : (data.last ?? true);
      setTodas(prev => reset ? content : [...prev, ...content]);
      setHasMore(!isLast);
      nextPage.current = page + 1;
    } catch {
      // silencioso
    } finally {
      setLoading(false);
      setLoadingMore(false);
      fetching.current = false;
    }
  }, []);

  useEffect(() => {
    cargarPagina(true);
    estilosService.getTop().then(setEstilos).catch(() => setEstilos([]));
  }, [cargarPagina]);

  useEffect(() => {
    const term = busqueda.trim();
    if (!term && !estiloActivo) {
      setFiltradas(todas);
      setUsuarios([]);
      return;
    }
    const t = term.toLowerCase();
    setFiltradas(
      todas.filter((p) => {
        const matchEstilo = estiloActivo
          ? p.estilos?.some(e => e.nombre.toLowerCase() === estiloActivo.toLowerCase()) ||
            p.estilo?.toLowerCase() === estiloActivo.toLowerCase()
          : true;
        const matchBusqueda = t
          ? p.estilos?.some(e => e.nombre.toLowerCase().includes(t)) ||
            p.estilo?.toLowerCase().includes(t) ||
            p.zonaCuerpo?.toLowerCase().includes(t) ||
            p.descripcion?.toLowerCase().includes(t) ||
            p.usuario?.nombre?.toLowerCase().includes(t)
          : true;
        return matchEstilo && matchBusqueda;
      })
    );

    if (term) {
      setSearchingUsers(true);
      artistasService.buscarUsuarios(term)
        .then(setUsuarios)
        .catch(() => setUsuarios([]))
        .finally(() => setSearchingUsers(false));
    } else {
      setUsuarios([]);
    }
  }, [busqueda, estiloActivo, todas]);

  const onEndReached = () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    cargarPagina(false);
  };

  const renderTile = ({ item }: { item: Publicacion }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/publicaciones/${item.idPublicacion}`)}
    >
      <Image
        source={{ uri: item.fotoUrl }}
        style={styles.tile}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabecera fija: búsqueda + chips */}
      <View style={styles.headerFixed}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar tatuajes, estilos, artistas..."
            placeholderTextColor={Colors.textMuted}
            value={busqueda}
            onChangeText={setBusqueda}
            returnKeyType="search"
            allowFontScaling={false}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Chips de estilos */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
          style={styles.chipsContainer}
        >
        {estilos.map((e) => {
          const activo = estiloActivo === e.nombre;
          return (
            <TouchableOpacity
              key={e.idEstilo}
              style={[styles.chip, activo && styles.chipActivo]}
              onPress={() => setEstiloActivo(activo ? null : e.nombre)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, activo && styles.chipTextActivo]} allowFontScaling={false}>{e.nombre}</Text>
            </TouchableOpacity>
          );
        })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtradas}
          keyExtractor={(item) => String(item.idPublicacion)}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          renderItem={renderTile}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
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
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : !hasMore && todas.length > 0 && !busqueda.trim() ? (
              <Text style={styles.footerEnd}>— Ya lo has visto todo —</Text>
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
