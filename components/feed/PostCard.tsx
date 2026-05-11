import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Publicacion } from '../../types/publicacion.types';
import { Usuario } from '../../types/usuario.types';
import { publicacionesService } from '../../services/publicaciones.service';
import { conversacionesService } from '../../services/conversaciones.service';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import ComentariosModal from './ComentariosModal';
import { useColors } from '../../hooks/useColors';

interface Props {
  publicacion: Publicacion;
  onLike?: (id: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_WIDTH = 210;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `hace ${weeks}sem`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function PostCard({ publicacion, onLike }: Props) {
  const Colors = useColors();
  const styles = StyleSheet.create({
    container: { backgroundColor: Colors.background, marginBottom: 8 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    avatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: Colors.primary },
    avatarPlaceholder: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1.5, borderColor: Colors.primary,
    },
    avatarInitial: { fontSize: 14, fontWeight: '700', color: Colors.primary },
    authorName: { fontSize: 13.5, fontWeight: '700', color: Colors.text, letterSpacing: 0.1 },
    authorSub: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
    moreBtn: { paddingLeft: 8 },
    image: { width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: Colors.surface },
    imageFallback: { justifyContent: 'center', alignItems: 'center' },
    actions: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 10, paddingTop: 10, paddingBottom: 4,
    },
    actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    actionBtn: { padding: 2, flexDirection: 'row', alignItems: 'center', gap: 5 },
    actionCount: { fontSize: 13, fontWeight: '600', color: Colors.text },
    actionCountLiked: { color: Colors.primary },
    likesCount: { fontSize: 13.5, fontWeight: '700', color: Colors.text, paddingHorizontal: 14, marginBottom: 4 },
    captionRow: { paddingHorizontal: 14, gap: 3, marginBottom: 2 },
    caption: { fontSize: 13.5, color: Colors.text, lineHeight: 19 },
    captionAuthor: { fontWeight: '700' },
    hashtag: { fontSize: 13, color: '#4A90D9', fontWeight: '500' },
    timestamp: {
      fontSize: 10, color: Colors.textMuted, paddingHorizontal: 14, paddingBottom: 12,
      textTransform: 'uppercase', letterSpacing: 0.4,
    },
    // Menú flotante
    backdrop: { flex: 1 },
    menuCard: {
      position: 'absolute',
      width: MENU_WIDTH,
      backgroundColor: Colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    menuItemText: { fontSize: 14, fontWeight: '500', color: Colors.text },
    menuItemTextDanger: { fontSize: 14, fontWeight: '500', color: Colors.error },
    menuDivider: { height: 1, backgroundColor: Colors.border },
    // Modal mencionar
    modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: Colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '70%',
    },
    sheetHandle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: Colors.border,
      alignSelf: 'center',
      marginTop: 12, marginBottom: 8,
    },
    sheetTitle: {
      fontSize: 15, fontWeight: '700', color: Colors.text,
      paddingHorizontal: 16, paddingBottom: 12,
    },
    userItem: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12, gap: 12,
    },
    userAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.primary },
    userAvatarPlaceholder: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1.5, borderColor: Colors.primary,
    },
    userAvatarInitial: { fontSize: 16, fontWeight: '700', color: Colors.primary },
    userName: { fontSize: 14, fontWeight: '600', color: Colors.text },
    userRol: { fontSize: 12, color: Colors.textMuted },
    emptyText: { textAlign: 'center', color: Colors.textSecondary, padding: 32, fontSize: 14 },
    sheetDivider: { height: 0.5, backgroundColor: Colors.border, marginLeft: 68 },
  });

  const router = useRouter();
  const { idUsuario } = useAuthStore();
  const [avatarError, setAvatarError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(publicacion.likesCount ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const lastTapRef = useRef(0);

  // Menú tres puntos
  const moreBtnRef = useRef<TouchableOpacity>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 16 });

  // Modal mencionar
  const [mencionVisible, setMencionVisible] = useState(false);
  const [seguidos, setSeguidos] = useState<Usuario[]>([]);
  const [loadingSeguidos, setLoadingSeguidos] = useState(false);
  const [enviando, setEnviando] = useState<number | null>(null);

  const { idPublicacion, fotoUrl, descripcion, estilo, zonaCuerpo, creadoEn, usuario } = publicacion;

  useEffect(() => {
    if (!idUsuario) return;
    publicacionesService.getLikeStatus(idPublicacion, idUsuario)
      .then(({ liked: l, likesCount: c }) => { setLiked(l); setLikeCount(c); })
      .catch(() => {});
  }, [idPublicacion, idUsuario]);

  useEffect(() => {
    publicacionesService.getComentarios(idPublicacion)
      .then((data) => setCommentCount(data.length))
      .catch(() => {});
  }, [idPublicacion]);

  useEffect(() => {
    if (!idUsuario) return;
    publicacionesService.getGuardadoStatus(idPublicacion, idUsuario)
      .then(({ guardado }) => setSaved(guardado))
      .catch(() => {});
  }, [idPublicacion, idUsuario]);

  const handleLike = async () => {
    if (!idUsuario || likeLoading) return;
    setLikeLoading(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((prev) => wasLiked ? prev - 1 : prev + 1);
    try {
      const { liked: l, likesCount: c } = await publicacionesService.toggleLike(idPublicacion, idUsuario);
      setLiked(l); setLikeCount(c); onLike?.(idPublicacion);
    } catch {
      setLiked(wasLiked);
      setLikeCount((prev) => wasLiked ? prev + 1 : prev - 1);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) { if (!liked) handleLike(); }
    lastTapRef.current = now;
  };

  const handleGuardar = async () => {
    if (!idUsuario || saveLoading) return;
    setSaveLoading(true);
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      const { guardado } = await publicacionesService.toggleGuardar(idPublicacion, idUsuario);
      setSaved(guardado);
    } catch {
      setSaved(wasSaved);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleOpenMenu = () => {
    moreBtnRef.current?.measure((_x, _y, _w, h, _pageX, pageY) => {
      setMenuPos({ top: pageY + h + 4, right: 16 });
      setMenuVisible(true);
    });
  };

  const handleDenunciar = () => {
    setMenuVisible(false);
    Alert.alert(
      'Denunciar imagen',
      '¿Quieres denunciar esta imagen por contenido inapropiado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Denunciar',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Denuncia enviada', 'Gracias por ayudarnos a mantener la comunidad.'),
        },
      ]
    );
  };

  const handleMencionar = async () => {
    setMenuVisible(false);
    if (!idUsuario) return;
    setMencionVisible(true);
    setLoadingSeguidos(true);
    try {
      const res = await api.get<Usuario[]>(`/usuarios/${idUsuario}/seguidos`);
      setSeguidos(res.data);
    } catch {
      setSeguidos([]);
    } finally {
      setLoadingSeguidos(false);
    }
  };

  const handleEnviarMencion = async (destinatario: Usuario) => {
    if (!idUsuario || enviando) return;
    setEnviando(destinatario.idUsuario);
    try {
      const conv = await conversacionesService.findOrCreate(idUsuario, destinatario.idUsuario);
      await conversacionesService.enviarMensaje(conv.idConversacion, idUsuario, fotoUrl ?? '');
      setMencionVisible(false);
      Alert.alert('Enviado', `Imagen compartida con ${destinatario.nombre}.`);
    } catch {
      Alert.alert('Error', 'No se pudo enviar la imagen.');
    } finally {
      setEnviando(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => usuario && router.push(`/usuarios/${usuario.idUsuario}`)}
          activeOpacity={0.7}
        >
          {usuario?.avatar && !avatarError ? (
            <Image source={{ uri: usuario.avatar }} style={styles.avatar} onError={() => setAvatarError(true)} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{usuario?.nombre?.charAt(0).toUpperCase() ?? '?'}</Text>
            </View>
          )}
          <View>
            <Text style={styles.authorName}>{usuario?.nombre ?? 'Artista'}</Text>
            {zonaCuerpo && <Text style={styles.authorSub}>{zonaCuerpo}</Text>}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          ref={moreBtnRef}
          style={styles.moreBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={handleOpenMenu}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Imagen ── */}
      <TouchableWithoutFeedback onPress={handleDoubleTap}>
        <View>
          {!imageError ? (
            <Image source={{ uri: fotoUrl }} style={styles.image} resizeMode="cover" onError={() => setImageError(true)} />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Ionicons name="image-outline" size={48} color={Colors.textMuted} />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* ── Acciones ── */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.6}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={26} color={liked ? Colors.primary : Colors.text} />
            {likeCount > 0 && (
              <Text style={[styles.actionCount, liked && styles.actionCountLiked]}>
                {likeCount.toLocaleString('es-ES')}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setModalOpen(true)} activeOpacity={0.6}>
            <Ionicons name="chatbubble-outline" size={24} color={Colors.text} />
            {commentCount > 0 && <Text style={styles.actionCount}>{commentCount}</Text>}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={handleGuardar} activeOpacity={0.6}>
          <Ionicons name={saved ? 'ribbon' : 'ribbon-outline'} size={24} color={saved ? Colors.primary : Colors.text} />
        </TouchableOpacity>
      </View>

      {/* ── Descripción ── */}
      <View style={styles.captionRow}>
        {descripcion ? (
          <Text style={styles.caption} numberOfLines={2}>
            <Text style={styles.captionAuthor}>{usuario?.nombre ?? 'artista'} </Text>
            {descripcion}
          </Text>
        ) : null}
        {estilo && (
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.hashtag}>#{estilo.toLowerCase().replace(/\s+/g, '')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ComentariosModal
        idPublicacion={modalOpen ? idPublicacion : null}
        onClose={() => setModalOpen(false)}
        onLoaded={(count) => setCommentCount(count)}
      />

      <Text style={styles.timestamp}>{timeAgo(creadoEn)}</Text>

      {/* ── Menú flotante tres puntos ── */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuCard, { top: menuPos.top, right: menuPos.right }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleDenunciar}>
              <Ionicons name="flag-outline" size={18} color={Colors.error} />
              <Text style={styles.menuItemTextDanger}>Denunciar imagen</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleMencionar}>
              <Ionicons name="paper-plane-outline" size={18} color={Colors.text} />
              <Text style={styles.menuItemText}>Mencionar imagen a...</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ── Modal mencionar a usuario ── */}
      <Modal visible={mencionVisible} transparent animationType="slide" onRequestClose={() => setMencionVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMencionVisible(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Enviar a...</Text>
            {loadingSeguidos ? (
              <ActivityIndicator color={Colors.primary} style={{ padding: 32 }} />
            ) : (
              <FlatList
                data={seguidos}
                keyExtractor={(item) => String(item.idUsuario)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.userItem}
                    onPress={() => handleEnviarMencion(item)}
                    disabled={enviando === item.idUsuario}
                    activeOpacity={0.7}
                  >
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
                    ) : (
                      <View style={styles.userAvatarPlaceholder}>
                        <Text style={styles.userAvatarInitial}>
                          {item.nombre?.charAt(0).toUpperCase() ?? '?'}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{item.nombre} {item.apellidos}</Text>
                      <Text style={styles.userRol}>{item.rol}</Text>
                    </View>
                    {enviando === item.idUsuario ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Ionicons name="paper-plane-outline" size={18} color={Colors.textMuted} />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.sheetDivider} />}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No sigues a nadie aún.</Text>
                }
                showsVerticalScrollIndicator={false}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
