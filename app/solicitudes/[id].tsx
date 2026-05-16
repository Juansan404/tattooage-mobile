import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { solicitudesService } from '../../services/solicitudes.service';
import { conversacionesService } from '../../services/conversaciones.service';
import { SolicitudCita, EstadoSolicitud } from '../../types/solicitud.types';
import { useAuthStore } from '../../store/auth.store';
import { useColors } from '../../hooks/useColors';
import { useTranslation } from '../../hooks/useTranslation';

export default function DetalleSolicitudScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const ESTADO_COLORS: Record<EstadoSolicitud, string> = {
    Pendiente: Colors.warning,
    Aceptada: Colors.success,
    Rechazada: Colors.error,
    Completada: Colors.textSecondary,
  };
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    estadoText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    content: { padding: 16, gap: 14 },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      gap: 8,
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
    cardDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
    tag: {
      backgroundColor: Colors.surfaceLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      fontSize: 13,
      color: Colors.textSecondary,
    },
    artActions: { flexDirection: 'row', gap: 10 },
    acceptBtn: {
      flex: 1,
      backgroundColor: Colors.success + '22',
      borderWidth: 1,
      borderColor: Colors.success,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    acceptBtnText: { color: Colors.success, fontWeight: '700', fontSize: 13 },
    rejectBtn: {
      flex: 1,
      backgroundColor: Colors.error + '22',
      borderWidth: 1,
      borderColor: Colors.error,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    rejectBtnText: { color: Colors.error, fontWeight: '700', fontSize: 13 },
    scheduleBtn: {
      backgroundColor: Colors.primary + '22',
      borderWidth: 1,
      borderColor: Colors.primary,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    scheduleBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
    chatBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingVertical: 14,
      borderRadius: 12,
    },
    chatBtnText: { color: Colors.text, fontWeight: '600', fontSize: 15 },
  });

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { idUsuario, rol } = useAuthStore();

  const [solicitud, setSolicitud] = useState<SolicitudCita | null>(null);
  const [loading, setLoading] = useState(true);
  const [abriendo, setAbriendo] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const s = await solicitudesService.getById(Number(id));
        setSolicitud(s);
      } catch {
        Alert.alert('Error', 'No se pudo cargar la solicitud.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id]);

  const handleCambiarEstado = (nuevoEstado: EstadoSolicitud) => {
    Alert.alert(
      'Cambiar estado',
      `¿Marcar esta solicitud como ${nuevoEstado}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const actualizada = await solicitudesService.cambiarEstado(Number(id), nuevoEstado);
              setSolicitud(actualizada);
            } catch {
              Alert.alert('Error', 'No se pudo cambiar el estado.');
            }
          },
        },
      ]
    );
  };

  const handleAbrirChat = async () => {
    if (!idUsuario || !solicitud) return;
    const otroId = rol === 'ARTISTA'
      ? solicitud.cliente?.idUsuario
      : solicitud.artista?.idUsuario;
    if (!otroId) return;
    setAbriendo(true);
    try {
      const conv = await conversacionesService.findOrCreate(idUsuario, otroId);
      router.push(`/conversaciones/${conv.idConversacion}`);
    } catch {
      Alert.alert('Error', 'No se pudo abrir la conversación.');
    } finally {
      setAbriendo(false);
    }
  };

  if (loading || !solicitud) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const esArtista = rol === 'ARTISTA';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <View style={[styles.estadoBadge, { backgroundColor: ESTADO_COLORS[solicitud.estado] + '22' }]}>
          <Text style={[styles.estadoText, { color: ESTADO_COLORS[solicitud.estado] }]}>
            {solicitud.estado}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {esArtista
              ? `De: ${solicitud.cliente?.nombre ?? 'Cliente'}`
              : `Artista: ${solicitud.artista?.nombre ?? 'Artista'}`}
          </Text>
          {solicitud.descripcion && (
            <Text style={styles.cardDesc}>{solicitud.descripcion}</Text>
          )}
          <View style={styles.tagRow}>
            {solicitud.zonaCuerpo && <Text style={styles.tag}>{solicitud.zonaCuerpo}</Text>}
            {solicitud.tamano && <Text style={styles.tag}>{solicitud.tamano}</Text>}
            {solicitud.presupuestoAprox && (
              <Text style={styles.tag}>Máx. {solicitud.presupuestoAprox}€</Text>
            )}
            {solicitud.fechaPreferida && (
              <Text style={styles.tag}>
                {new Date(solicitud.fechaPreferida).toLocaleDateString('es-ES')}
              </Text>
            )}
          </View>

          {esArtista && solicitud.estado === 'Pendiente' && (
            <View style={styles.artActions}>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleCambiarEstado('Aceptada')}
              >
                <Text style={styles.acceptBtnText}>{t('sol_accept')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleCambiarEstado('Rechazada')}
              >
                <Text style={styles.rejectBtnText}>{t('sol_reject')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {esArtista && solicitud.estado === 'Aceptada' && (
            <TouchableOpacity
              style={styles.scheduleBtn}
              onPress={() =>
                router.push(
                  `/citas/nueva?solicitudId=${solicitud.idSolicitud}&clienteId=${solicitud.cliente?.idUsuario}&artistaId=${solicitud.artista?.idUsuario}`
                )
              }
            >
              <Text style={styles.scheduleBtnText}>{t('sol_schedule')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Botón de chat con el otro usuario */}
        <TouchableOpacity
          style={[styles.chatBtn, abriendo && { opacity: 0.6 }]}
          onPress={handleAbrirChat}
          disabled={abriendo}
        >
          {abriendo ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.text} />
              <Text style={styles.chatBtnText}>
                {t('sol_open_chat')} {esArtista
                  ? (solicitud.cliente?.nombre ?? t('sol_the_client'))
                  : (solicitud.artista?.nombre ?? t('sol_the_artist'))}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
