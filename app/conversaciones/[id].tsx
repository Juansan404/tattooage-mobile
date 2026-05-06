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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Client } from '@stomp/stompjs';
import { conversacionesService } from '../../services/conversaciones.service';
import api from '../../services/api';
import { Conversacion, MensajeDirecto } from '../../types/conversacion.types';
import { Usuario } from '../../types/usuario.types';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { API_BASE_URL } from '../../constants/config';

const WS_URL = API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://').replace('/api', '/ws');

export default function ChatDirectoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { idUsuario } = useAuthStore();

  const [conversacion, setConversacion] = useState<Conversacion | null>(null);
  const [mensajes, setMensajes] = useState<MensajeDirecto[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [conectado, setConectado] = useState(false);

  const listRef = useRef<FlatList>(null);
  const stompClient = useRef<Client | null>(null);

  const convId = Number(id);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [convRes, msgs] = await Promise.all([
          api.get<Conversacion>(`/conversaciones/${convId}`).then(r => r.data).catch(() => null),
          conversacionesService.getMensajes(convId, idUsuario ?? undefined),
        ]);
        if (convRes) setConversacion(convRes);
        setMensajes(msgs);
      } catch {
        Alert.alert('Error', 'No se pudo cargar la conversación.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [convId]);

  useEffect(() => {
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      onConnect: () => {
        setConectado(true);
        client.subscribe(`/topic/conversacion/${convId}`, (frame) => {
          const msg: MensajeDirecto = JSON.parse(frame.body);
          setMensajes((prev) => {
            if (prev.some((m) => m.idMensaje === msg.idMensaje)) return prev;
            return [...prev, msg];
          });
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        });
      },
      onDisconnect: () => setConectado(false),
      onStompError: () => setConectado(false),
    });
    client.activate();
    stompClient.current = client;
    return () => {
      client.deactivate();
      stompClient.current = null;
    };
  }, [convId]);

  const getOtro = (): Usuario | null => {
    if (!conversacion || !idUsuario) return null;
    return conversacion.usuario1?.idUsuario === idUsuario
      ? conversacion.usuario2
      : conversacion.usuario1;
  };

  const handleEnviar = () => {
    if (!nuevoMensaje.trim() || !idUsuario) return;
    const texto = nuevoMensaje.trim();
    setNuevoMensaje('');

    if (stompClient.current?.connected) {
      stompClient.current.publish({
        destination: `/app/conversacion/${convId}/mensaje`,
        body: JSON.stringify({ idRemitente: idUsuario, contenido: texto }),
      });
    } else {
      conversacionesService.enviarMensaje(convId, idUsuario, texto)
        .then((msg) => {
          setMensajes((prev) => [...prev, msg]);
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        })
        .catch(() => Alert.alert('Error', 'No se pudo enviar el mensaje.'));
    }
  };

  const otro = getOtro();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerUser}
            onPress={() => otro && router.push(`/usuarios/${otro.idUsuario}`)}
          >
            {otro?.avatar ? (
              <Image source={{ uri: otro.avatar }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarInitial}>
                  {otro?.nombre?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.headerName}>{otro?.nombre} {otro?.apellidos}</Text>
              <Text style={styles.headerRol}>{otro?.rol}</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.wsBadge, { backgroundColor: conectado ? Colors.success + '33' : Colors.textMuted + '33' }]}>
            <View style={[styles.wsDot, { backgroundColor: conectado ? Colors.success : Colors.textMuted }]} />
          </View>
        </View>

        {/* Mensajes */}
        <FlatList
          ref={listRef}
          data={mensajes}
          keyExtractor={(item) => String(item.idMensaje)}
          renderItem={({ item }) => {
            const esMio = item.remitente?.idUsuario === idUsuario;
            return (
              <View style={[styles.bubble, esMio ? styles.bubbleMio : styles.bubbleOtro]}>
                <Text style={[styles.bubbleText, esMio && styles.bubbleTextMio]}>
                  {item.contenido}
                </Text>
                <Text style={styles.bubbleTime}>
                  {new Date(item.creadoEn).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {esMio && (
                    <Text style={styles.bubbleLeido}>{item.leido ? '  ✓✓' : '  ✓'}</Text>
                  )}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <Text style={styles.emptyChat}>
              Empieza la conversación con {otro?.nombre ?? 'este usuario'}.
            </Text>
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
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
            onPress={handleEnviar}
            disabled={!nuevoMensaje.trim()}
          >
            <Ionicons name="send" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  headerUser: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 38, height: 38, borderRadius: 19 },
  headerAvatarPlaceholder: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarInitial: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  headerName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  headerRol: { fontSize: 11, color: Colors.textMuted },
  wsBadge: { width: 10, height: 10, borderRadius: 5, padding: 0 },
  wsDot: { width: 10, height: 10, borderRadius: 5 },
  chatContent: { padding: 12, gap: 8, paddingBottom: 16 },
  bubble: {
    maxWidth: '78%',
    padding: 10,
    borderRadius: 16,
    gap: 2,
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
  bubbleText: { fontSize: 14, color: Colors.text },
  bubbleTextMio: { color: Colors.white },
  bubbleTime: { fontSize: 10, color: Colors.textMuted, alignSelf: 'flex-end' },
  bubbleLeido: { fontSize: 10 },
  emptyChat: { textAlign: 'center', color: Colors.textMuted, fontSize: 14, padding: 32 },
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
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
