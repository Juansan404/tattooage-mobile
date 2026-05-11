import { useState, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { solicitudesService } from '../../services/solicitudes.service';
import { citasService } from '../../services/citas.service';
import { SolicitudCita, EstadoSolicitud } from '../../types/solicitud.types';
import { Cita, EstadoCita } from '../../types/cita.types';
import { useAuthStore } from '../../store/auth.store';
import { useColors } from '../../hooks/useColors';

export default function SolicitudesScreen() {
  const Colors = useColors();
  const ESTADO_SOL_COLORS: Record<EstadoSolicitud, string> = {
    Pendiente: Colors.warning,
    Aceptada: Colors.success,
    Rechazada: Colors.error,
    Completada: Colors.textSecondary,
  };
  const ESTADO_CITA_COLORS: Record<EstadoCita, string> = {
    Pendiente: Colors.warning,
    Confirmada: Colors.success,
    Cancelada: Colors.error,
    Completada: Colors.textSecondary,
  };
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
    tabRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: Colors.surfaceLight,
    },
    tabActive: {
      backgroundColor: Colors.primary,
    },
    tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
    tabTextActive: { color: Colors.white },
    listContent: { padding: 16, gap: 12 },
    emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
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
    emptyText: { color: Colors.textSecondary, fontSize: 15 },
  });

  const router = useRouter();
  const { rol, idUsuario } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'solicitudes' | 'citas'>('solicitudes');
  const [solicitudes, setSolicitudes] = useState<SolicitudCita[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    if (!idUsuario || !rol) return;
    try {
      const [sols, cits] = await Promise.all([
        solicitudesService.getMias(idUsuario, rol),
        citasService.getMias(idUsuario, rol),
      ]);
      setSolicitudes(sols);
      setCitas(cits);
    } catch {
      setSolicitudes([]);
      setCitas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const onRefresh = () => { setRefreshing(true); cargar(); };

  const renderSolicitud = ({ item }: { item: SolicitudCita }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/solicitudes/${item.idSolicitud}`)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.descripcion ?? 'Sin descripción'}
        </Text>
        <View style={[styles.badge, { backgroundColor: ESTADO_SOL_COLORS[item.estado] + '22' }]}>
          <Text style={[styles.badgeText, { color: ESTADO_SOL_COLORS[item.estado] }]}>
            {item.estado}
          </Text>
        </View>
      </View>
      {rol === 'ARTISTA' ? (
        <Text style={styles.cardMeta}>Cliente: {item.cliente?.nombre ?? 'Cliente'}</Text>
      ) : (
        <Text style={styles.cardMeta}>Artista: {item.artista?.nombre ?? 'Artista'}</Text>
      )}
      {item.zonaCuerpo && <Text style={styles.cardMeta}>Zona: {item.zonaCuerpo}</Text>}
      {item.creadoEn && (
        <Text style={styles.cardDate}>
          {new Date(item.creadoEn).toLocaleDateString('es-ES')}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderCita = ({ item }: { item: Cita }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/citas/${item.idCita}`)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.fechaCita
            ? new Date(item.fechaCita).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : 'Fecha pendiente'}
        </Text>
        <View style={[styles.badge, { backgroundColor: ESTADO_CITA_COLORS[item.estado] + '22' }]}>
          <Text style={[styles.badgeText, { color: ESTADO_CITA_COLORS[item.estado] }]}>
            {item.estado}
          </Text>
        </View>
      </View>
      {rol === 'ARTISTA' ? (
        <Text style={styles.cardMeta}>Cliente: {item.cliente?.nombre ?? 'Cliente'}</Text>
      ) : (
        <Text style={styles.cardMeta}>Artista: {item.artista?.nombre ?? 'Artista'}</Text>
      )}
      {item.horaInicio && (
        <Text style={styles.cardMeta}>
          {item.horaInicio}{item.duracionAproximada ? ` · ${item.duracionAproximada} min` : ''}
        </Text>
      )}
      {item.sala && <Text style={styles.cardMeta}>Sala: {item.sala}</Text>}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const data = activeTab === 'solicitudes' ? solicitudes : citas;
  const isEmpty = data.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {rol === 'ARTISTA' ? 'Agenda' : 'Mis citas'}
        </Text>
        {rol === 'CLIENTE' && activeTab === 'solicitudes' && (
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => router.push('/solicitudes/nueva')}
          >
            <Text style={styles.newBtnText}>+ Nueva</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'solicitudes' && styles.tabActive]}
          onPress={() => setActiveTab('solicitudes')}
        >
          <Text style={[styles.tabText, activeTab === 'solicitudes' && styles.tabTextActive]}>
            Solicitudes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'citas' && styles.tabActive]}
          onPress={() => setActiveTab('citas')}
        >
          <Text style={[styles.tabText, activeTab === 'citas' && styles.tabTextActive]}>
            Citas
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data as any[]}
        keyExtractor={(item) =>
          activeTab === 'solicitudes'
            ? String((item as SolicitudCita).idSolicitud)
            : String((item as Cita).idCita)
        }
        renderItem={activeTab === 'solicitudes' ? renderSolicitud : renderCita}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={isEmpty ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              {activeTab === 'solicitudes' ? 'No tienes solicitudes aún.' : 'No tienes citas aún.'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
