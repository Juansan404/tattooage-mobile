import { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Publicacion } from '../../types/publicacion.types';
import { Colors } from '../../constants/colors';

interface Props {
  publicacion: Publicacion;
  onLike?: (id: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const router = useRouter();
  const [avatarError, setAvatarError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(publicacion.likesCount ?? 0);

  const {
    idPublicacion,
    fotoUrl,
    descripcion,
    estilo,
    zonaCuerpo,
    creadoEn,
    usuario,
  } = publicacion;

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    onLike?.(idPublicacion);
  };

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
      onLike?.(idPublicacion);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => usuario && router.push(`/artistas/${usuario.idUsuario}`)}
          activeOpacity={0.7}
        >
          {usuario?.avatar && !avatarError ? (
            <Image
              source={{ uri: usuario.avatar }}
              style={styles.avatar}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {usuario?.nombre?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.authorName}>{usuario?.nombre ?? 'Artista'}</Text>
            {zonaCuerpo && (
              <Text style={styles.authorSub}>{zonaCuerpo}</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.moreIcon}>•••</Text>
        </TouchableOpacity>
      </View>

      {/* ── Imagen (doble tap = like) ── */}
      <TouchableWithoutFeedback onPress={handleDoubleTap}>
        <View>
          {!imageError ? (
            <Image
              source={{ uri: fotoUrl }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Text style={styles.imageFallbackText}>Sin imagen</Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* ── Acciones ── */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          {/* Like */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleLike}
            activeOpacity={0.6}
          >
            <Text style={[styles.actionIcon, liked && styles.actionIconLiked]}>
              {liked ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>

          {/* Comentar */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/publicaciones/${idPublicacion}`)}
            activeOpacity={0.6}
          >
            <Text style={styles.actionIcon}>💬</Text>
          </TouchableOpacity>

          {/* Compartir */}
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6}>
            <Text style={styles.actionIcon}>✈️</Text>
          </TouchableOpacity>
        </View>

        {/* Guardar */}
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6}>
          <Text style={styles.actionIcon}>🔖</Text>
        </TouchableOpacity>
      </View>

      {/* ── Likes ── */}
      {likeCount > 0 && (
        <Text style={styles.likesCount}>
          {likeCount.toLocaleString('es-ES')} {likeCount === 1 ? 'me gusta' : 'me gusta'}
        </Text>
      )}

      {/* ── Descripción + estilo ── */}
      <View style={styles.captionRow}>
        {descripcion ? (
          <Text style={styles.caption} numberOfLines={2}>
            <Text style={styles.captionAuthor}>
              {usuario?.nombre ?? 'artista'}{' '}
            </Text>
            {descripcion}
          </Text>
        ) : null}
        {estilo && (
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.hashtag}>#{estilo.toLowerCase().replace(/\s+/g, '')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Ver comentarios ── */}
      <TouchableOpacity
        onPress={() => router.push(`/publicaciones/${idPublicacion}`)}
        activeOpacity={0.7}
      >
        <Text style={styles.viewComments}>Ver comentarios</Text>
      </TouchableOpacity>

      {/* ── Timestamp ── */}
      <Text style={styles.timestamp}>{timeAgo(creadoEn)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    marginBottom: 8,
  },
  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  authorName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.1,
  },
  authorSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  moreBtn: {
    paddingLeft: 8,
  },
  moreIcon: {
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 1,
    fontWeight: '700',
  },
  /* Imagen */
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: Colors.surface,
  },
  imageFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFallbackText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  /* Acciones */
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionBtn: {
    padding: 2,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionIconLiked: {
    // handled by emoji swap
  },
  /* Likes */
  likesCount: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  /* Caption */
  captionRow: {
    paddingHorizontal: 14,
    gap: 3,
    marginBottom: 2,
  },
  caption: {
    fontSize: 13.5,
    color: Colors.text,
    lineHeight: 19,
  },
  captionAuthor: {
    fontWeight: '700',
  },
  hashtag: {
    fontSize: 13,
    color: '#4A90D9',
    fontWeight: '500',
  },
  /* Comentarios */
  viewComments: {
    fontSize: 13,
    color: Colors.textMuted,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  /* Timestamp */
  timestamp: {
    fontSize: 10,
    color: Colors.textMuted,
    paddingHorizontal: 14,
    paddingBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
