import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { notificacionesService } from '../services/notificaciones.service';
import { Notificacion, TipoNotificacion } from '../types/notificacion.types';
import { useAuthStore } from '../store/auth.store';
import { useColors } from '../hooks/useColors';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}sem`;
}

function textoNotif(tipo: TipoNotificacion, nombre: string): string {
  switch (tipo) {
    case 'LIKE':           return `${nombre} le dio like a tu publicación`;
    case 'COMENTARIO':     return `${nombre} comentó en tu publicación`;
    case 'SEGUIDOR':       return `${nombre} empezó a seguirte`;
    case 'SOLICITUD':      return `${nombre} te envió una solicitud de cita`;
    case 'VERIFICACION':   return 'Tu imagen no ha pasado el filtro de contenido y será revisada por un administrador.';
    case 'REVISION_ADMIN': return `${nombre} ha publicado una imagen que requiere revisión de moderación.`;
    case 'APROBADA':       return 'Tu publicación ha sido revisada y aprobada por el administrador.';
    case 'RECHAZADA':      return 'Tu publicación no ha superado la revisión y ha sido eliminada.';
  }
}

export default function NotificacionesScreen() {
  const Colors = useColors();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: Colors.border,
    },
    title: { fontSize: 17, fontWeight: '700', color: Colors.text },
    markAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    itemUnread: { backgroundColor: Colors.surface },
    avatarWrap: { position: 'relative' },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    avatarPlaceholder: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center', alignItems: 'center',
    },
    avatarInitial: { fontSize: 20, fontWeight: '700', color: Colors.primary },
    iconBadge: {
      position: 'absolute',
      bottom: -2, right: -2,
      width: 20, height: 20,
      borderRadius: 10,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: Colors.background,
    },
    content: { flex: 1 },
    texto: { fontSize: 14, color: Colors.text, lineHeight: 20 },
    tiempo: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    dot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: Colors.primary,
    },
    separator: { height: 0.5, backgroundColor: Colors.border },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40 },
    emptyText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' },
  });

  const iconoNotif = (tipo: TipoNotificacion): { name: string; color: string } => {
    switch (tipo) {
      case 'LIKE':           return { name: 'heart',           color: '#e94560' };
      case 'COMENTARIO':     return { name: 'chatbubble',      color: '#3498db' };
      case 'SEGUIDOR':       return { name: 'person-add',      color: Colors.primary };
      case 'SOLICITUD':      return { name: 'calendar',        color: '#2ecc71' };
      case 'VERIFICACION':   return { name: 'warning',         color: '#f39c12' };
      case 'REVISION_ADMIN': return { name: 'shield',          color: '#e67e22' };
      case 'APROBADA':       return { name: 'checkmark-circle',color: '#27ae60' };
      case 'RECHAZADA':      return { name: 'close-circle',    color: '#C0392B' };
    }
  };

  const router = useRouter();
  const { idUsuario } = useAuthStore();
  const [notifs, setNotifs] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    if (!idUsuario) return;
    try {
      const data = await notificacionesService.getByUsuario(idUsuario);
      setNotifs(data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [idUsuario]);

  useEffect(() => { cargar(); }, [cargar]);

  const onRefresh = () => { setRefreshing(true); cargar(); };

  const marcarTodasLeidas = async () => {
    if (!idUsuario) return;
    await notificacionesService.marcarTodasLeidas(idUsuario);
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
  };

  const handleTap = async (n: Notificacion) => {
    if (!n.leida) {
      notificacionesService.marcarLeida(n.idNotificacion);
      setNotifs(prev => prev.map(x => x.idNotificacion === n.idNotificacion ? { ...x, leida: true } : x));
    }
    if ((n.tipo === 'LIKE' || n.tipo === 'COMENTARIO') && n.idReferencia) {
      router.push(`/publicaciones/${n.idReferencia}`);
    } else if (n.tipo === 'SEGUIDOR' && n.emisor?.idUsuario) {
      router.push(`/usuarios/${n.emisor.idUsuario}`);
    } else if (n.tipo === 'SOLICITUD' && n.idReferencia) {
      router.push(`/solicitudes/${n.idReferencia}`);
    } else if (n.tipo === 'VERIFICACION' && n.idReferencia) {
      router.push(`/verificar/${n.idReferencia}`);
    } else if ((n.tipo === 'REVISION_ADMIN' || n.tipo === 'APROBADA') && n.idReferencia) {
      router.push(`/publicaciones/${n.idReferencia}`);
    }
    // RECHAZADA: la publicación fue eliminada, no hay destino
  };

  const renderItem = ({ item }: { item: Notificacion }) => {
    const nombre = item.emisor?.nombre ?? 'Alguien';
    const icono = iconoNotif(item.tipo);
    return (
      <TouchableOpacity
        style={[styles.item, !item.leida && styles.itemUnread]}
        onPress={() => handleTap(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrap}>
          {item.emisor?.avatar ? (
            <Image source={{ uri: item.emisor.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {nombre.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[styles.iconBadge, { backgroundColor: icono.color }]}>
            <Ionicons name={icono.name as any} size={11} color="#fff" />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.texto} numberOfLines={2}>
            {textoNotif(item.tipo, nombre)}
          </Text>
          <Text style={styles.tiempo}>{timeAgo(item.creadoEn)}</Text>
        </View>

        {!item.leida && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notificaciones</Text>
        <TouchableOpacity onPress={marcarTodasLeidas} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.markAll}>Todo leído</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={n => String(n.idNotificacion)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Sin notificaciones aún</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
