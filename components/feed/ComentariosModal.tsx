import { useEffect, useState, useRef } from 'react';
import {
  Modal,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { publicacionesService } from '../../services/publicaciones.service';
import { Comentario } from '../../types/publicacion.types';
import { useAuthStore } from '../../store/auth.store';
import { useColors } from '../../hooks/useColors';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

interface Props {
  idPublicacion: number | null;
  onClose: () => void;
  onLoaded?: (count: number) => void;
}

export default function ComentariosModal({ idPublicacion, onClose, onLoaded }: Props) {
  const Colors = useColors();
  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
      backgroundColor: Colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: '75%',
      borderTopWidth: 0.5,
      borderColor: Colors.border,
    },
    handleBar: {
      width: 36,
      height: 4,
      backgroundColor: Colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 4,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: Colors.border,
    },
    title: { fontSize: 15, fontWeight: '700', color: Colors.text },
    closeBtn: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },
    center: { paddingVertical: 32, alignItems: 'center' },
    listContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 14 },
    emptyText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 24 },
    comentario: { gap: 3 },
    comentarioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    autor: { fontSize: 13, fontWeight: '700', color: Colors.text },
    fecha: { fontSize: 11, color: Colors.textMuted },
    contenido: { fontSize: 14, color: Colors.textSecondary, lineHeight: 19 },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 4,
      gap: 8,
      borderTopWidth: 0.5,
      borderTopColor: Colors.border,
    },
    input: {
      flex: 1,
      backgroundColor: Colors.surfaceLight,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 9,
      color: Colors.text,
      fontSize: 14,
      maxHeight: 90,
    },
    sendBtn: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 20,
    },
    sendBtnDisabled: { opacity: 0.4 },
    sendText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  });

  const { idUsuario } = useAuthStore();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const visible = idPublicacion !== null;

  useEffect(() => {
    if (!idPublicacion) return;
    setLoading(true);
    setComentarios([]);
    publicacionesService.getComentarios(idPublicacion)
      .then((data) => {
        setComentarios(data);
        onLoaded?.(data.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [idPublicacion]);

  const handleEnviar = async () => {
    if (!texto.trim() || !idUsuario || !idPublicacion || enviando) return;
    setEnviando(true);
    try {
      const nuevo = await publicacionesService.comentar(idPublicacion, idUsuario, texto.trim());
      setComentarios((prev) => [...prev, nuevo]);
      setTexto('');
    } catch {
      Alert.alert('Error', 'No se pudo enviar el comentario.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <KeyboardAvoidingView
        style={[styles.sheet, { paddingBottom: insets.bottom || 12 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Handle */}
        <View style={styles.handleBar} />

        {/* Título */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Comentarios</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Lista */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={comentarios}
            keyExtractor={(item) => String(item.idComentario)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Sé el primero en comentar.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.comentario}>
                <View style={styles.comentarioHeader}>
                  <Text style={styles.autor}>{item.usuario?.nombre ?? 'Usuario'}</Text>
                  <Text style={styles.fecha}>{timeAgo(item.creadoEn)}</Text>
                </View>
                <Text style={styles.contenido}>{item.contenido}</Text>
              </View>
            )}
          />
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Añade un comentario..."
            placeholderTextColor={Colors.textMuted}
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!texto.trim() || enviando) && styles.sendBtnDisabled]}
            onPress={handleEnviar}
            disabled={!texto.trim() || enviando}
          >
            {enviando
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Text style={styles.sendText}>Publicar</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
