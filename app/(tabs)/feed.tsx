import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { publicacionesService } from '../../services/publicaciones.service';
import { notificacionesService } from '../../services/notificaciones.service';
import { Publicacion } from '../../types/publicacion.types';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore } from '../../store/theme.store';
import PostCard from '../../components/feed/PostCard';
import { useColors } from '../../hooks/useColors';
import { useTranslation } from '../../hooks/useTranslation';

const PAGE_SIZE = 15;

export default function FeedScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: Colors.border,
      backgroundColor: Colors.background,
    },
    headerLogo: {
      fontSize: 26,
      fontWeight: '800',
      color: Colors.text,
      letterSpacing: -0.5,
      fontStyle: 'italic',
    },
    headerLogoAccent: { color: Colors.primary },
    headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 18 },
    headerIcon: { position: 'relative' },
    badge: {
      position: 'absolute',
      top: -5, right: -6,
      backgroundColor: '#e94560',
      borderRadius: 9,
      minWidth: 18, height: 18,
      justifyContent: 'center', alignItems: 'center',
      paddingHorizontal: 3,
      borderWidth: 1.5, borderColor: Colors.background,
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    separator: { height: 0.5, backgroundColor: Colors.border },
    footerLoader: { paddingVertical: 20, alignItems: 'center' },
    footerEnd: {
      textAlign: 'center',
      color: Colors.textMuted,
      fontSize: 12,
      paddingVertical: 20,
      letterSpacing: 0.5,
    },
    emptyContainer: { flexGrow: 1 },
    emptyInner: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      marginTop: 60,
    },
    emptyTitle: {
      color: Colors.text,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      color: Colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    errorText: { color: Colors.error, textAlign: 'center', fontSize: 15, marginBottom: 16 },
    retryBtn: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  });

  const { isDark } = useThemeStore();
  const logoSrc = isDark
    ? require('../../assets/logo_black.png')
    : require('../../assets/logo.png');
  const bgSrc = isDark
    ? require('../../assets/darkmode_background.jpg')
    : require('../../assets/lightmode_background.jpg');

  const router = useRouter();
  const { idUsuario } = useAuthStore();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noLeidas, setNoLeidas] = useState(0);

  const nextPage = useRef(0);
  const fetching = useRef(false);

  const cargarPagina = useCallback(async (reset: boolean) => {
    if (fetching.current) return;
    fetching.current = true;

    const page = reset ? 0 : nextPage.current;

    try {
      setError(null);
      const data = await publicacionesService.getFeedPage(page, PAGE_SIZE);
      const content: Publicacion[] = Array.isArray(data)
        ? (data as unknown as Publicacion[])
        : (data.content ?? []);
      const isLast: boolean = Array.isArray(data) ? true : (data.last ?? true);
      setPublicaciones(prev => reset ? content : [...prev, ...content]);
      setHasMore(!isLast);
      nextPage.current = page + 1;
    } catch {
      setError(t('feed_error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      fetching.current = false;
    }
  }, []);

  useEffect(() => { cargarPagina(true); }, [cargarPagina]);

  useFocusEffect(useCallback(() => {
    if (!idUsuario) return;
    notificacionesService.countNoLeidas(idUsuario)
      .then(setNoLeidas)
      .catch(() => {});
  }, [idUsuario]));

  const onRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    cargarPagina(true);
  };

  const onEndReached = () => {
    if (!hasMore || loadingMore || loading || refreshing) return;
    setLoadingMore(true);
    cargarPagina(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ImageBackground source={bgSrc} style={styles.container} resizeMode="cover">
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={logoSrc} style={{ width: 34, height: 34 }} resizeMode="contain" />
          <Text style={styles.headerLogo}>
            Tattoo<Text style={styles.headerLogoAccent}>Age</Text>
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.headerIcon}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => router.push('/notificaciones')}
          >
            <Ionicons name="heart-outline" size={26} color={Colors.text} />
            {noLeidas > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{noLeidas > 99 ? '99+' : noLeidas}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => router.push('/conversaciones')}
          >
            <Ionicons name="paper-plane-outline" size={26} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => cargarPagina(true)}>
            <Text style={styles.retryText}>{t('feed_retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={publicaciones}
          keyExtractor={(item) => String(item.idPublicacion)}
          renderItem={({ item }) => <PostCard publicacion={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : !hasMore && publicaciones.length > 0 ? (
              <Text style={styles.footerEnd}>{t('feed_end')}</Text>
            ) : null
          }
          contentContainerStyle={
            publicaciones.length === 0 ? styles.emptyContainer : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyInner}>
              <Text style={styles.emptyTitle}>{t('feed_empty')}</Text>
              <Text style={styles.emptySubtext}>{t('feed_empty_sub')}</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
    </ImageBackground>
  );
}
