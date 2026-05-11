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
import { citasService } from '../../services/citas.service';
import { Cita, EstadoCita } from '../../types/cita.types';
import { useAuthStore } from '../../store/auth.store';
import { useColors } from '../../hooks/useColors';

export default function CitasScreen() {
  const Colors = useColors();
  const ESTADO_COLORS: Record<EstadoCita, string> = {
    Pendiente: Colors.warning,
    Confirmada: Colors.success,
    Cancelada: Colors.error,
    Completada: Colors.textSecondary,
  };
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    title: { fontSize: 20, fontWeight: '700', color: Colors.text },
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
    },
    cardDate: { fontSize: 15, fontWeight: '600', color: Colors.text },
    cardTime: { fontSize: 13, color: Colors.textSecondary },
    cardMeta: { fontSize: 13, color: Colors.textSecondary },
    cardPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 4 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  });

  const router = useRouter();
  const { rol, idUsuario } = useAuthStore();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    if (!idUsuario || !rol) return;
    try {
      const data = await citasService.getMias(idUsuario, rol);
      setCitas(data);
    } catch {
      setCitas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar, idUsuario, rol]);

  const onRefresh = () => { setRefreshing(true); cargar(); };

  const renderItem = ({ item }: { item: Cita }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/citas/${item.idCita}`)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>
          {item.fechaCita
            ? new Date(item.fechaCita).toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : 'Fecha pendiente'}
        </Text>
        <View style={[styles.badge, { backgroundColor: ESTADO_COLORS[item.estado] + '22' }]}>
          <Text style={[styles.badgeText, { color: ESTADO_COLORS[item.estado] }]}>
            {item.estado}
          </Text>
        </View>
      </View>
      {item.horaInicio && (
        <Text style={styles.cardTime}>
          🕐 {item.horaInicio}
          {item.duracionAproximada ? `  ·  ${item.duracionAproximada} min` : ''}
        </Text>
      )}
      {rol === 'ARTISTA' ? (
        <Text style={styles.cardMeta}>
          Cliente: {item.cliente?.nombre ?? 'Cliente'}
        </Text>
      ) : (
        <Text style={styles.cardMeta}>
          Artista: {item.artista?.nombre ?? 'Artista'}
        </Text>
      )}
      {item.sala && <Text style={styles.cardMeta}>Sala: {item.sala}</Text>}
      {item.precio && (
        <Text style={styles.cardPrice}>{item.precio} €</Text>
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
        <Text style={styles.title}>Mi agenda</Text>
      </View>

      <FlatList
        data={citas}
        keyExtractor={(item) => String(item.idCita)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={
          citas.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No tienes citas programadas.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
