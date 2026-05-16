import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Image,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { solicitudesService } from '../../services/solicitudes.service';
import { citasService } from '../../services/citas.service';
import { artistasService } from '../../services/artistas.service';
import { SolicitudCita, EstadoSolicitud } from '../../types/solicitud.types';
import { Cita, EstadoCita } from '../../types/cita.types';
import { Usuario } from '../../types/usuario.types';
import { useAuthStore } from '../../store/auth.store';
import { useColors } from '../../hooks/useColors';
import { useTranslation } from '../../hooks/useTranslation';

export default function SolicitudesScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
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
    tabActive: { backgroundColor: Colors.primary },
    tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
    tabTextActive: { color: Colors.white },

    // Botón filtro
    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surfaceLight,
    },
    filterBtnActive: {
      borderColor: Colors.primary,
      backgroundColor: Colors.primary + '22',
    },
    filterBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
    filterBtnTextActive: { color: Colors.primary },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: Colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 32,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: Colors.border,
    },
    modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    modalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      gap: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: Colors.border,
    },
    modalItemActive: { backgroundColor: Colors.primary + '11' },
    modalAvatar: { width: 38, height: 38, borderRadius: 19 },
    modalAvatarPlaceholder: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center', alignItems: 'center',
    },
    modalAvatarInitial: { fontSize: 15, fontWeight: '700', color: Colors.primary },
    modalItemName: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
    modalItemNameActive: { color: Colors.primary },
    modalCheckmark: { marginLeft: 'auto' as any },

    // Cards
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
  const [contactos, setContactos] = useState<Usuario[]>([]);
  const [personaFiltro, setPersonaFiltro] = useState<number | null>(null);
  const [modalFiltro, setModalFiltro] = useState(false);

  const cargar = useCallback(async () => {
    if (!idUsuario || !rol) return;
    try {
      const [sols, cits] = await Promise.all([
        solicitudesService.getMias(idUsuario, rol),
        citasService.getMias(idUsuario, rol),
      ]);
      setSolicitudes(sols);
      setCitas(cits);

      // CLIENTE ve a quienes sigue; ARTISTA ve quienes le siguen
      const lista = rol === 'CLIENTE'
        ? await artistasService.getSeguidos(idUsuario).catch(() => [])
        : await artistasService.getSeguidores(idUsuario).catch(() => []);
      setContactos(lista);
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

  const getOtherUser = (item: SolicitudCita | Cita): Usuario | undefined =>
    rol === 'ARTISTA' ? item.cliente : item.artista;

  const applyFilters = useCallback(<T extends SolicitudCita | Cita>(list: T[]): T[] => {
    if (personaFiltro == null) return list;
    return list.filter((item) => getOtherUser(item)?.idUsuario === personaFiltro);
  }, [personaFiltro, rol]);

  const solicitudesFiltradas = useMemo(() => applyFilters(solicitudes), [applyFilters, solicitudes]);
  const citasFiltradas = useMemo(() => applyFilters(citas), [applyFilters, citas]);

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
                day: 'numeric', month: 'long', year: 'numeric',
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

  const data = activeTab === 'solicitudes' ? solicitudesFiltradas : citasFiltradas;
  const isEmpty = data.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.title}>
            {rol === 'ARTISTA' ? t('req_agenda') : t('req_my_appointments')}
          </Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                t('req_how_it_works'),
                rol === 'ARTISTA' ? t('req_artist_instructions') : t('req_client_instructions')
              )
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="information-circle-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
        {rol === 'CLIENTE' && activeTab === 'solicitudes' && (
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => router.push('/solicitudes/nueva')}
          >
            <Text style={styles.newBtnText}>{t('req_new')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'solicitudes' && styles.tabActive]}
          onPress={() => setActiveTab('solicitudes')}
        >
          <Text style={[styles.tabText, activeTab === 'solicitudes' && styles.tabTextActive]}>
            {t('req_requests_tab')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'citas' && styles.tabActive]}
          onPress={() => setActiveTab('citas')}
        >
          <Text style={[styles.tabText, activeTab === 'citas' && styles.tabTextActive]}>
            {t('req_appointments_tab')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botón filtrar por contacto */}
      {contactos.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[styles.filterBtn, personaFiltro != null && styles.filterBtnActive]}
            onPress={() => setModalFiltro(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="people-outline"
              size={14}
              color={personaFiltro != null ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.filterBtnText, personaFiltro != null && styles.filterBtnTextActive]}>
              {personaFiltro != null
                ? contactos.find((u) => u.idUsuario === personaFiltro)?.nombre ?? 'Filtrado'
                : rol === 'CLIENTE' ? 'Siguiendo' : 'Te siguen'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color={personaFiltro != null ? Colors.primary : Colors.textSecondary}
            />
          </TouchableOpacity>
          {personaFiltro != null && (
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setPersonaFiltro(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={14} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal
        visible={modalFiltro}
        transparent
        animationType="slide"
        onRequestClose={() => setModalFiltro(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalFiltro(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {rol === 'CLIENTE' ? 'Siguiendo' : 'Te siguen'}
              </Text>
              <TouchableOpacity onPress={() => setModalFiltro(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={contactos}
              keyExtractor={(u) => String(u.idUsuario)}
              renderItem={({ item: u }) => {
                const selected = personaFiltro === u.idUsuario;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, selected && styles.modalItemActive]}
                    onPress={() => {
                      setPersonaFiltro(selected ? null : (u.idUsuario ?? null));
                      setModalFiltro(false);
                    }}
                    activeOpacity={0.7}
                  >
                    {u.avatar ? (
                      <Image source={{ uri: u.avatar }} style={styles.modalAvatar} />
                    ) : (
                      <View style={styles.modalAvatarPlaceholder}>
                        <Text style={styles.modalAvatarInitial}>
                          {u.nombre?.charAt(0).toUpperCase() ?? '?'}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.modalItemName, selected && styles.modalItemNameActive]}>
                      {u.nombre}{u.apellidos ? ` ${u.apellidos}` : ''}
                    </Text>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} style={styles.modalCheckmark} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

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
              {activeTab === 'solicitudes' ? t('req_no_requests') : t('req_no_appointments')}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
