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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { publicacionesService } from '../../services/publicaciones.service';
import { Publicacion } from '../../types/publicacion.types';
import { Colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 2;
const TILE_SIZE = (SCREEN_WIDTH - GAP * 2) / 3;

/**
 * Devuelve filas con el patrón mosaico de Instagram:
 * - Fila grande (1 foto 2/3 + 2 fotos 1/3 apiladas)
 * - 3 fotos iguales
 * Alternando cada 2 filas (índice de grupo)
 */
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
      // tail: fill with remaining as trio
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
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

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
    if (!busqueda.trim()) {
      setFiltradas(todas);
      return;
    }
    const t = busqueda.toLowerCase();
    setFiltradas(
      todas.filter(
        (p) =>
          p.estilo?.toLowerCase().includes(t) ||
          p.zonaCuerpo?.toLowerCase().includes(t) ||
          p.descripcion?.toLowerCase().includes(t) ||
          p.usuario?.nombre?.toLowerCase().includes(t)
      )
    );
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
          {/* Rellenar huecos si la fila está incompleta */}
          {item.items.length < 3 &&
            Array.from({ length: 3 - item.items.length }).map((_, i) => (
              <View key={`empty-${i}`} style={{ width: TILE_SIZE, height: TILE_SIZE }} />
            ))}
        </View>
      );
    }

    // Mosaico: 1 grande (izq) + 2 pequeñas (der apiladas)
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
      {/* ── Barra de búsqueda ── */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
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
            <Text style={styles.clearIcon}>✕</Text>
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
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {busqueda ? 'Sin resultados para tu búsqueda.' : 'No hay publicaciones aún.'}
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  /* Search */
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
  searchIcon: { fontSize: 15 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
  },
  clearIcon: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  /* Grid rows */
  trioRow: {
    flexDirection: 'row',
    gap: GAP,
  },
  mosaicRow: {
    flexDirection: 'row',
    gap: GAP,
  },
  mosaicStack: {
    flexDirection: 'column',
    gap: GAP,
  },
  /* Empty */
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyFlex: {
    flexGrow: 1,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
});
