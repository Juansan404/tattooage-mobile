import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { solicitudesService } from '../../services/solicitudes.service';
import { SolicitudCita, EstadoSolicitud } from '../../types/solicitud.types';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';

const ESTADO_COLORS: Record<EstadoSolicitud, string> = {
  Pendiente: Colors.warning,
  Aceptada: Colors.success,
  Rechazada: Colors.error,
  Completada: Colors.textSecondary,
};

export default function SolicitudesScreen() {
  const router = useRouter();
  const { rol, idUsuario } = useAuthStore();
  const [solicitudes, setSolicitudes] = useState<SolicitudCita[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    if (!idUsuario || !rol) return;
    try {
      const data = await solicitudesService.getMias(idUsuario, rol);
      setSolicitudes(data);
    } catch {
      setSolicitudes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar, idUsuario, rol]);

  const onRefresh = () => { setRefreshing(true); cargar(); };

  const renderItem = ({ item }: { item: SolicitudCita }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/solicitudes/${item.idSolicitud}`)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.descripcion ?? 'Sin descripción'}
        </Text>
        <View style={[styles.badge, { backgroundColor: ESTADO_COLORS[item.estado] + '22' }]}>
          <Text style={[styles.badgeText, { color: ESTADO_COLORS[item.estado] }]}>
            {item.estado}
          </Text>
        </View>
      </View>
      {rol === 'ARTISTA' ? (
        <Text style={styles.cardMeta}>
          Cliente: {item.cliente?.nombre ?? 'Cliente'}
        </Text>
      ) : (
        <Text style={styles.cardMeta}>
          Artista: {item.artista?.nombre ?? 'Artista'}
        </Text>
      )}
      {item.zonaCuerpo && (
        <Text style={styles.cardMeta}>Zona: {item.zonaCuerpo}</Text>
      )}
      {item.creadoEn && (
        <Text style={styles.cardDate}>
          {new Date(item.creadoEn).toLocaleDateString('es-ES')}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {rol === 'ARTISTA' ? 'Solicitudes recibidas' : 'Mis solicitudes'}
        </Text>
        {rol === 'CLIENTE' && (
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => router.push('/solicitudes/nueva')}
          >
            <Text style={styles.newBtnText}>+ Nueva</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={solicitudes}
        keyExtractor={(item) => String(item.idSolicitud)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={
          solicitudes.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No tienes solicitudes aún.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  newBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  listContent: { padding: 16, gap: 12 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 15 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  cardMeta: { fontSize: 13, color: Colors.textSecondary },
  cardDate: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
});
