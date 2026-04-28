import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { publicacionesService } from '../../services/publicaciones.service';
import { Publicacion, Comentario } from '../../types/publicacion.types';
import { useAuthStore } from '../../store/auth.store';
import { Colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DetallePublicacionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { idUsuario } = useAuthStore();

  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [pub, coms] = await Promise.all([
          publicacionesService.getById(Number(id)),
          publicacionesService.getComentarios(Number(id)),
        ]);
        setPublicacion(pub);
        setComentarios(coms);
        if (idUsuario) {
          const { liked: l, likesCount: c } = await publicacionesService.getLikeStatus(Number(id), idUsuario);
          setLiked(l);
          setLikeCount(c);
        } else {
          setLikeCount(pub.likesCount ?? 0);
        }
      } catch {
        Alert.alert('Error', 'No se pudo cargar la publicación.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id]);

  const handleLike = async () => {
    if (!idUsuario || likeLoading) return;
    setLikeLoading(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((prev) => wasLiked ? prev - 1 : prev + 1);
    try {
      const { liked: l, likesCount: c } = await publicacionesService.toggleLike(Number(id), idUsuario);
      setLiked(l);
      setLikeCount(c);
    } catch {
      setLiked(wasLiked);
      setLikeCount((prev) => wasLiked ? prev + 1 : prev - 1);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComentar = async () => {
    if (!nuevoComentario.trim() || !idUsuario) return;
    try {
      setEnviando(true);
      const comentario = await publicacionesService.comentar(Number(id), idUsuario, nuevoComentario.trim());
      setComentarios((prev) => [...prev, comentario]);
      setNuevoComentario('');
    } catch {
      Alert.alert('Error', 'No se pudo enviar el comentario.');
    } finally {
      setEnviando(false);
    }
  };

  if (loading || !publicacion) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Imagen */}
          <Image source={{ uri: publicacion.fotoUrl }} style={styles.image} resizeMode="cover" />

          {/* Info */}
          <View style={styles.info}>
            <View style={styles.likeRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleLike} disabled={likeLoading}>
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={26}
                  color={liked ? Colors.primary : Colors.text}
                />
                <Text style={styles.actionCount}>{likeCount}</Text>
              </TouchableOpacity>
            </View>

            {publicacion.descripcion && (
              <Text style={styles.descripcion}>{publicacion.descripcion}</Text>
            )}

            <View style={styles.tags}>
              {publicacion.estilo && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{publicacion.estilo}</Text>
                </View>
              )}
              {publicacion.zonaCuerpo && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{publicacion.zonaCuerpo}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Comentarios */}
          <View style={styles.comentariosSection}>
            <Text style={styles.sectionTitle}>
              Comentarios ({comentarios.length})
            </Text>
            {comentarios.map((c) => (
              <View key={c.idComentario} style={styles.comentarioItem}>
                <Text style={styles.comentarioAutor}>
                  {c.usuario?.nombre ?? 'Usuario'}
                </Text>
                <Text style={styles.comentarioTexto}>{c.contenido}</Text>
                <Text style={styles.comentarioFecha}>
                  {new Date(c.creadoEn).toLocaleDateString('es-ES')}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Input de comentario */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Añade un comentario..."
            placeholderTextColor={Colors.textMuted}
            value={nuevoComentario}
            onChangeText={setNuevoComentario}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !nuevoComentario.trim() && styles.sendBtnDisabled]}
            onPress={handleComentar}
            disabled={!nuevoComentario.trim() || enviando}
          >
            {enviando ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.sendText}>Enviar</Text>
            )}
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { alignSelf: 'flex-start' },
  backText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  image: { width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: Colors.surface },
  info: { padding: 16, gap: 10 },
  likeRow: { flexDirection: 'row', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 24 },
  actionCount: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600' },
  descripcion: { fontSize: 15, color: Colors.text, lineHeight: 22 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: Colors.primary + '22',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tagText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  comentariosSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  comentarioItem: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  comentarioAutor: { fontSize: 13, fontWeight: '700', color: Colors.text },
  comentarioTexto: { fontSize: 14, color: Colors.textSecondary },
  comentarioFecha: { fontSize: 11, color: Colors.textMuted },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 10,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
});
