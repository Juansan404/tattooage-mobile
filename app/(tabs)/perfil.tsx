import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  ImageBackground,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../services/api';
import { artistasService } from '../../services/artistas.service';
import { publicacionesService } from '../../services/publicaciones.service';
import { Usuario } from '../../types/usuario.types';
import { Publicacion } from '../../types/publicacion.types';
import { useAuthStore } from '../../store/auth.store';
import SeguidoresModal from '../../components/perfil/SeguidoresModal';
import { useColors } from '../../hooks/useColors';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeStore } from '../../store/theme.store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_TILE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

export default function PerfilScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    /* Header */
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
    headerUsername: {
      fontSize: 18,
      fontWeight: '800',
      color: Colors.text,
      letterSpacing: 0.2,
    },
    headerMenu: {
      fontSize: 22,
      color: Colors.text,
    },

    /* Bio section */
    bioSection: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      gap: 12,
      backgroundColor: Colors.background,
    },
    avatarStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    avatar: {
      width: 86,
      height: 86,
      borderRadius: 43,
      borderWidth: 2,
      borderColor: Colors.primary,
    },
    avatarPlaceholder: {
      width: 86,
      height: 86,
      borderRadius: 43,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: Colors.primary,
    },
    avatarInitial: {
      fontSize: 32,
      fontWeight: '700',
      color: Colors.primary,
    },
    statsRow: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
      gap: 2,
    },
    statNumber: {
      fontSize: 18,
      fontWeight: '800',
      color: Colors.text,
    },
    statLabel: {
      fontSize: 11,
      color: Colors.textSecondary,
    },
    nameBlock: {
      gap: 4,
    },
    displayName: {
      fontSize: 14,
      fontWeight: '700',
      color: Colors.text,
    },
    rolBadge: {
      alignSelf: 'flex-start',
      backgroundColor: Colors.primary + '22',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 6,
    },
    rolText: {
      color: Colors.primary,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
    },
    bio: {
      fontSize: 13,
      color: Colors.textSecondary,
      lineHeight: 18,
      marginTop: 2,
    },
    /* Botones */
    actionButtons: {
      flexDirection: 'row',
      gap: 10,
    },
    editBtn: {
      flex: 1,
      backgroundColor: Colors.surfaceLight,
      borderRadius: 8,
      paddingVertical: 8,
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: Colors.border,
    },
    editBtnText: {
      color: Colors.text,
      fontWeight: '600',
      fontSize: 13,
    },
    newPostBtn: {
      flex: 1,
      backgroundColor: Colors.primary,
      borderRadius: 8,
      paddingVertical: 8,
      alignItems: 'center',
    },
    newPostBtnText: {
      color: Colors.white,
      fontWeight: '700',
      fontSize: 13,
    },

    divider: {
      height: 0.5,
      backgroundColor: Colors.border,
    },

    /* Grid */
    gridRow: {
      gap: GRID_GAP,
    },
    gridTile: {
      width: GRID_TILE,
      height: GRID_TILE,
      backgroundColor: Colors.surface,
    },

    /* Empty grid */
    emptyGrid: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 32,
      gap: 10,
    },
    emptyGridTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text,
    },
    emptyGridSub: {
      fontSize: 13,
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    uploadBtn: {
      marginTop: 8,
      backgroundColor: Colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 8,
    },
    uploadBtnText: {
      color: Colors.white,
      fontWeight: '700',
      fontSize: 14,
    },
    gridTileWrapper: { position: 'relative' },
    gridTileMenuBtn: {
      position: 'absolute', top: 4, right: 4,
      backgroundColor: 'rgba(0,0,0,0.45)',
      borderRadius: 10, padding: 3,
    },

    /* Menú */
    menuBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    menuSheet: {
      backgroundColor: Colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingBottom: 32,
      borderTopWidth: 0.5,
      borderColor: Colors.border,
    },
    menuHandle: {
      width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2,
      alignSelf: 'center', marginTop: 10, marginBottom: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    menuItemText: {
      fontSize: 16,
      color: Colors.text,
      fontWeight: '500',
    },
    menuDivider: {
      height: 0.5,
      backgroundColor: Colors.border,
      marginHorizontal: 20,
    },
  });

  const { isDark } = useThemeStore();
  const bgSrc = isDark
    ? require('../../assets/darkmode_background.jpg')
    : require('../../assets/lightmode_background.jpg');

  const router = useRouter();
  const { idUsuario, rol, logout } = useAuthStore();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [guardadas, setGuardadas] = useState<Publicacion[]>([]);
  const [seguidores, setSeguidores] = useState(0);
  const [seguidos, setSeguidos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalTipo, setModalTipo] = useState<'seguidores' | 'seguidos' | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const cargar = useCallback(async () => {
    if (!idUsuario) return;
    try {
      const requests: Promise<any>[] = [
        api.get<Usuario>(`/usuarios/${idUsuario}`),
        artistasService.getContadores(idUsuario),
      ];
      if (rol === 'ARTISTA' || rol === 'ADMIN') {
        requests.push(publicacionesService.getByUsuario(idUsuario));
      } else {
        requests.push(publicacionesService.getGuardadas(idUsuario));
      }
      const [userRes, contadores, pubs] = await Promise.all(requests);
      setUsuario(userRes.data);
      setSeguidores(contadores.seguidores);
      setSeguidos(contadores.seguidos);
      if (rol === 'ARTISTA' || rol === 'ADMIN') {
        setPublicaciones(pubs as Publicacion[]);
      } else {
        setGuardadas(pubs as Publicacion[]);
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [idUsuario, rol]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const handleEliminarPost = (item: Publicacion) => {
    Alert.alert(
      'Eliminar publicación',
      '¿Seguro que quieres eliminar esta publicación? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await publicacionesService.eliminar(item.idPublicacion);
              setPublicaciones((prev) => prev.filter((p) => p.idPublicacion !== item.idPublicacion));
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la publicación.');
            }
          },
        },
      ]
    );
  };

  const handleMenuPost = (item: Publicacion) => {
    Alert.alert('Publicación', '¿Qué quieres hacer?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Editar', onPress: () => router.push(`/portfolio/editar/${item.idPublicacion}`) },
      { text: 'Eliminar', style: 'destructive', onPress: () => handleEliminarPost(item) },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const ListHeader = () => (
    <View>
      {/* ── Bio section ── */}
      <View style={styles.bioSection}>
        {/* Fila: avatar + stats */}
        <View style={styles.avatarStatsRow}>
          {/* Avatar */}
          {usuario?.avatar ? (
            <Image source={{ uri: usuario.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {usuario?.nombre?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
          )}

          {/* Stats */}
          {rol === 'ARTISTA' || rol === 'ADMIN' ? (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{publicaciones.length}</Text>
                <Text style={styles.statLabel}>{t('profile_posts')}</Text>
              </View>
              <TouchableOpacity style={styles.statItem} onPress={() => setModalTipo('seguidores')} activeOpacity={0.7}>
                <Text style={styles.statNumber}>{seguidores}</Text>
                <Text style={styles.statLabel}>{t('profile_followers')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statItem} onPress={() => setModalTipo('seguidos')} activeOpacity={0.7}>
                <Text style={styles.statNumber}>{seguidos}</Text>
                <Text style={styles.statLabel}>{t('profile_following')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{guardadas.length}</Text>
                <Text style={styles.statLabel}>{t('profile_saved_count')}</Text>
              </View>
              <TouchableOpacity style={styles.statItem} onPress={() => setModalTipo('seguidores')} activeOpacity={0.7}>
                <Text style={styles.statNumber}>{seguidores}</Text>
                <Text style={styles.statLabel}>{t('profile_followers')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statItem} onPress={() => setModalTipo('seguidos')} activeOpacity={0.7}>
                <Text style={styles.statNumber}>{seguidos}</Text>
                <Text style={styles.statLabel}>{t('profile_following')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Nombre + bio */}
        <View style={styles.nameBlock}>
          <Text style={styles.displayName}>
            {usuario?.nombre ?? ''}{usuario?.apellidos ? ` ${usuario.apellidos}` : ''}
          </Text>
          {/* Badge de rol */}
          <View style={styles.rolBadge}>
            <Text style={styles.rolText}>{rol}</Text>
          </View>
          {usuario?.bio && (
            <Text style={styles.bio}>{usuario.bio}</Text>
          )}
        </View>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          {rol === 'ARTISTA' && (
            <TouchableOpacity
              style={styles.newPostBtn}
              onPress={() => router.push('/portfolio/nueva')}
            >
              <Text style={styles.newPostBtnText}>{t('profile_publish')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.divider} />
    </View>
  );

  return (
    <ImageBackground source={bgSrc} style={styles.container} resizeMode="cover">
    <SafeAreaView style={{ flex: 1 }}>
      {/* ── Header con username + menú ── */}
      <View style={styles.header}>
        <Text style={styles.headerUsername}>
          {usuario?.nombre?.toLowerCase().replace(/\s+/g, '_') ?? 'mi_perfil'}
        </Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="menu-outline" size={28} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
          data={rol === 'ARTISTA' || rol === 'ADMIN' ? publicaciones : guardadas}
          keyExtractor={(item) => String(item.idPublicacion)}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          ListHeaderComponent={<ListHeader />}
          renderItem={({ item }) => (
            <View style={styles.gridTileWrapper}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/publicaciones/${item.idPublicacion}`)}
              >
                <Image source={{ uri: item.fotoUrl }} style={styles.gridTile} resizeMode="cover" />
              </TouchableOpacity>
              {(rol === 'ARTISTA' || rol === 'ADMIN') && (
                <TouchableOpacity
                  style={styles.gridTileMenuBtn}
                  onPress={() => handleMenuPost(item)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="ellipsis-horizontal" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            rol === 'ARTISTA' || rol === 'ADMIN' ? (
              <View style={styles.emptyGrid}>
                <Ionicons name="camera-outline" size={56} color={Colors.textMuted} />
                <Text style={styles.emptyGridTitle}>{t('profile_empty_posts')}</Text>
                <Text style={styles.emptyGridSub}>{t('profile_empty_posts_sub')}</Text>
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={() => router.push('/portfolio/nueva')}
                >
                  <Text style={styles.uploadBtnText}>{t('profile_upload')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyGrid}>
                <Ionicons name="ribbon-outline" size={56} color={Colors.textMuted} />
                <Text style={styles.emptyGridTitle}>{t('profile_empty_saved')}</Text>
                <Text style={styles.emptyGridSub}>{t('profile_empty_saved_sub')}</Text>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
        />

      <SeguidoresModal
        idUsuario={modalTipo && idUsuario ? idUsuario : null}
        tipo={modalTipo ?? 'seguidores'}
        onClose={() => setModalTipo(null)}
        onNavigate={(id) => {
          setModalTipo(null);
          setTimeout(() => router.push(`/usuarios/${id}`), 300);
        }}
      />

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setMenuVisible(false)} />
        <View style={styles.menuSheet}>
          <View style={styles.menuHandle} />
          {(rol === 'ARTISTA' || rol === 'ADMIN') && (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { setMenuVisible(false); router.push('/estadisticas'); }}
              >
                <Ionicons name="bar-chart-outline" size={22} color={Colors.text} />
                <Text style={styles.menuItemText}>{t('menu_statistics')}</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
            </>
          )}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setMenuVisible(false); router.push('/guardados'); }}
          >
            <Ionicons name="ribbon-outline" size={22} color={Colors.text} />
            <Text style={styles.menuItemText}>{t('menu_saved')}</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setMenuVisible(false); router.push('/biblioteca-ar'); }}
          >
            <Ionicons name="camera-outline" size={22} color={Colors.text} />
            <Text style={styles.menuItemText}>{t('menu_library_ar')}</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setMenuVisible(false); router.push('/perfil/editar'); }}
          >
            <Ionicons name="person-outline" size={22} color={Colors.text} />
            <Text style={styles.menuItemText}>{t('settings_edit_profile')}</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setMenuVisible(false); router.push('/ajustes'); }}
          >
            <Ionicons name="settings-outline" size={22} color={Colors.text} />
            <Text style={styles.menuItemText}>{t('menu_settings')}</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); handleLogout(); }}>
            <Ionicons name="log-out-outline" size={22} color={Colors.error} />
            <Text style={[styles.menuItemText, { color: Colors.error }]}>{t('menu_logout')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
    </ImageBackground>
  );
}
