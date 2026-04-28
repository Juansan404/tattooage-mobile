import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { solicitudesService } from '../../services/solicitudes.service';
import { mensajesService } from '../../services/mensajes.service';
import { SolicitudCita, Mensaje, EstadoSolicitud } from '../../types/solicitud.types';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';

const ESTADO_COLORS: Record<EstadoSolicitud, string> = {
  Pendiente: Colors.warning,
  Aceptada: Colors.success,
  Rechazada: Colors.error,
  Completada: Colors.textSecondary,
};

export default function DetalleSolicitudScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { idUsuario, rol } = useAuthStore();

  const [solicitud, setSolicitud] = useState<SolicitudCita | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [s, m] = await Promise.all([
          solicitudesService.getById(Number(id)),
          mensajesService.getMensajesDeSolicitud(Number(id)),
        ]);
        setSolicitud(s);
        setMensajes(m);
      } catch {
        Alert.alert('Error', 'No se pudo cargar la solicitud.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id]);

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !idUsuario) return;
    try {
      setEnviando(true);
      const msg = await mensajesService.enviar({
        solicitud: { idSolicitud: Number(id) },
        remitente: { idUsuario },
        contenido: nuevoMensaje.trim(),
      });
      setMensajes((prev) => [...prev, msg]);
      setNuevoMensaje('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Alert.alert('Error', 'No se pudo enviar el mensaje.');
    } finally {
      setEnviando(false);
    }
  };

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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
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

        {/* Info de la solicitud */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            {esArtista
              ? `De: ${solicitud.cliente?.nombre ?? 'Cliente'}`
              : `Artista: ${solicitud.artista?.nombre ?? 'Artista'}`}
          </Text>
          {solicitud.descripcion && (
            <Text style={styles.infoDesc}>{solicitud.descripcion}</Text>
          )}
          <View style={styles.infoTagRow}>
            {solicitud.zonaCuerpo && <Text style={styles.infoTag}>{solicitud.zonaCuerpo}</Text>}
            {solicitud.tamano && <Text style={styles.infoTag}>{solicitud.tamano}</Text>}
            {solicitud.presupuestoAprox && (
              <Text style={styles.infoTag}>Máx. {solicitud.presupuestoAprox}€</Text>
            )}
          </View>

          {/* Acciones del artista */}
          {esArtista && solicitud.estado === 'Pendiente' && (
            <View style={styles.artActions}>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleCambiarEstado('Aceptada')}
              >
                <Text style={styles.acceptBtnText}>✓ Aceptar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleCambiarEstado('Rechazada')}
              >
                <Text style={styles.rejectBtnText}>✗ Rechazar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Chat */}
        <FlatList
          ref={listRef}
          data={mensajes}
          keyExtractor={(item) => String(item.idMensaje)}
          renderItem={({ item }) => {
            const esMio = item.remitente?.idUsuario === idUsuario;
            return (
              <View style={[styles.bubble, esMio ? styles.bubbleMio : styles.bubbleOtro]}>
                {!esMio && (
                  <Text style={styles.bubbleAuthor}>
                    {item.remitente?.nombre ?? 'Usuario'}
                  </Text>
                )}
                <Text style={[styles.bubbleText, esMio && styles.bubbleTextMio]}>
                  {item.contenido}
                </Text>
                <Text style={styles.bubbleTime}>
                  {new Date(item.creadoEn).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <Text style={styles.emptyChat}>No hay mensajes aún. ¡Empieza la conversación!</Text>
          }
        />

        {/* Input de mensaje */}
        {solicitud.estado !== 'Rechazada' && solicitud.estado !== 'Completada' && (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={Colors.textMuted}
              value={nuevoMensaje}
              onChangeText={setNuevoMensaje}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !nuevoMensaje.trim() && styles.sendBtnDisabled]}
              onPress={handleEnviarMensaje}
              disabled={!nuevoMensaje.trim() || enviando}
            >
              {enviando ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="send" size={18} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
  backText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  estadoText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  infoBox: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  infoDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  infoTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  infoTag: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  artActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  acceptBtn: {
    flex: 1,
    backgroundColor: Colors.success + '22',
    borderWidth: 1,
    borderColor: Colors.success,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptBtnText: { color: Colors.success, fontWeight: '700', fontSize: 13 },
  rejectBtn: {
    flex: 1,
    backgroundColor: Colors.error + '22',
    borderWidth: 1,
    borderColor: Colors.error,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectBtnText: { color: Colors.error, fontWeight: '700', fontSize: 13 },
  chatContent: { padding: 12, gap: 8, paddingBottom: 16 },
  bubble: {
    maxWidth: '78%',
    padding: 10,
    borderRadius: 14,
    gap: 3,
  },
  bubbleMio: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleOtro: {
    backgroundColor: Colors.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleAuthor: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  bubbleText: { fontSize: 14, color: Colors.text },
  bubbleTextMio: { color: Colors.white },
  bubbleTime: { fontSize: 10, color: Colors.textMuted, alignSelf: 'flex-end' },
  emptyChat: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 14,
    padding: 32,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: Colors.white, fontWeight: '700', fontSize: 22, marginTop: -2 },
});
