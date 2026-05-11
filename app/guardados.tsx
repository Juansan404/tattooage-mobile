import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { publicacionesService } from '../services/publicaciones.service';
import { Publicacion } from '../types/publicacion.types';
import { useAuthStore } from '../store/auth.store';
import { useColors } from '../hooks/useColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_TILE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

export default function GuardadosScreen() {
  const Colors = useColors();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: Colors.border,
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, letterSpacing: 0.2 },
    gridRow: { gap: GRID_GAP },
    gridTile: { width: GRID_TILE, height: GRID_TILE, backgroundColor: Colors.surface },
    empty: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 32,
      gap: 10,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    emptySub: {
      fontSize: 13,
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  const router = useRouter();
  const { idUsuario } = useAuthStore();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!idUsuario) return;
    try {
      const data = await publicacionesService.getGuardadas(idUsuario);
      setPublicaciones(data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [idUsuario]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guardados</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={publicaciones}
          keyExtractor={(item) => String(item.idPublicacion)}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
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
            <View style={styles.empty}>
              <Ionicons name="ribbon-outline" size={56} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Sin guardados</Text>
              <Text style={styles.emptySub}>
                Toca el icono{' '}
                <Ionicons name="ribbon-outline" size={13} color={Colors.textMuted} />{' '}
                en cualquier publicación para guardarla aquí.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
        />
      )}
    </SafeAreaView>
  );
}
