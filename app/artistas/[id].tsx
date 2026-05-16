import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { artistasService } from '../../services/artistas.service';
import { publicacionesService } from '../../services/publicaciones.service';
import { valoracionesService } from '../../services/valoraciones.service';
import { Usuario, PerfilArtista } from '../../types/usuario.types';
import { Publicacion } from '../../types/publicacion.types';
import { Valoracion, ResumenValoracion } from '../../types/valoracion.types';
import { useAuthStore } from '../../store/auth.store';
import { useColors } from '../../hooks/useColors';
import { useTranslation } from '../../hooks/useTranslation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_TILE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

export default function PerfilArtistaScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: Colors.border,
    },
    headerUsername: {
      fontSize: 18,
      fontWeight: '800',
      color: Colors.text,
      letterSpacing: 0.2,
    },

    bioSection: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      gap: 12,
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
    avatarInitial: { fontSize: 32, fontWeight: '700', color: Colors.primary },
    statsRow: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: { alignItems: 'center', gap: 2 },
    statNumber: { fontSize: 18, fontWeight: '800', color: Colors.text },
    statLabel: { fontSize: 11, color: Colors.textSecondary },

    nameBlock: { gap: 4 },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    nameCol: {
      flex: 1,
      flexShrink: 1,
      gap: 4,
    },
    displayName: { fontSize: 14, fontWeight: '700', color: Colors.text },
    rolBadge: {
      alignSelf: 'flex-start',
      backgroundColor: Colors.primary + '22',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 6,
    },
    rolText: { color: Colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
    bio: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginTop: 2 },
    especialidades: { fontSize: 13, color: Colors.primary, fontStyle: 'italic' },

    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    chipOk: { backgroundColor: Colors.success + '22' },
    chipNo: { backgroundColor: Colors.error + '22' },
    chipText: { fontSize: 12, fontWeight: '700' },
    chipTextOk: { color: Colors.success },
    chipTextNo: { color: Colors.error },
    chipNeutral: { backgroundColor: Colors.surfaceLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    chipNeutralText: { color: Colors.textSecondary, fontSize: 12 },

    actionButtons: { flexDirection: 'row', gap: 8 },
    btn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
    btnPrimary: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
    btnSecondary: { flex: 1, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
    btnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
    btnTextSecondary: { color: Colors.text },

    divider: { height: 0.5, backgroundColor: Colors.border },

    gridRow: { gap: GRID_GAP },
    gridTile: { width: GRID_TILE, height: GRID_TILE, backgroundColor: Colors.surface },

    emptyGrid: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32, gap: 10 },
    emptyGridTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    emptyGridSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
    gridTileWrapper: { position: 'relative' },
    gridTileMenuBtn: {
      position: 'absolute', top: 4, right: 4,
      backgroundColor: 'rgba(0,0,0,0.45)',
      borderRadius: 10, padding: 3,
    },

    // Estudio chip
    empresaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surfaceLight,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      gap: 6,
      marginLeft: 10,
      flexShrink: 0,
      maxWidth: 130,
    },
    empresaText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
    empresaLoc: { fontSize: 11, color: Colors.primary, textDecorationLine: 'underline' },

    // Rating summary row
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    ratingAvg: { fontSize: 15, fontWeight: '800', color: Colors.text },
    ratingCount: { fontSize: 12, color: Colors.textSecondary },
    starsRow: { flexDirection: 'row', gap: 2 },

    // Rate button (outline style)
    btnOutline: {
      flex: 1,
      borderWidth: 1,
      borderColor: Colors.primary,
      paddingVertical: 9,
      borderRadius: 8,
      alignItems: 'center',
    },
    btnOutlineText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },

    // Ratings section
    ratingsSectionTitle: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text,
      borderTopWidth: 0.5,
      borderTopColor: Colors.border,
    },
    ratingItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: Colors.border,
      gap: 6,
    },
    ratingItemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    ratingAvatar: { width: 36, height: 36, borderRadius: 18 },
    ratingAvatarPlaceholder: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center', alignItems: 'center',
    },
    ratingAvatarInitial: { fontSize: 15, fontWeight: '700', color: Colors.primary },
    ratingMeta: { flex: 1, gap: 2 },
    ratingName: { fontSize: 13, fontWeight: '700', color: Colors.text },
    ratingDate: { fontSize: 11, color: Colors.textMuted },
    ratingComment: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
    emptyRatings: {
      alignItems: 'center', paddingVertical: 24, paddingHorizontal: 32, gap: 6,
    },
    emptyRatingsText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: Colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 24,
      gap: 18,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center' },
    modalStarsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
    modalInput: {
      backgroundColor: Colors.surfaceLight,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: Colors.text,
      fontSize: 14,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    modalButtons: { flexDirection: 'row', gap: 10 },
    modalBtnSave: {
      flex: 1, backgroundColor: Colors.primary,
      paddingVertical: 13, borderRadius: 12, alignItems: 'center',
    },
    modalBtnCancel: {
      flex: 1, backgroundColor: Colors.surfaceLight,
      paddingVertical: 13, borderRadius: 12, alignItems: 'center',
    },
    modalBtnDelete: {
      alignItems: 'center', paddingVertical: 10,
    },
    modalBtnSaveText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
    modalBtnCancelText: { color: Colors.text, fontWeight: '600', fontSize: 15 },
    modalBtnDeleteText: { color: Colors.error, fontSize: 13 },
  });

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { idUsuario, rol } = useAuthStore();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [perfil, setPerfil] = useState<PerfilArtista | null>(null);
  const [portfolio, setPortfolio] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [siguiendo, setSiguiendo] = useState(false);
  const [seguidores, setSeguidores] = useState(0);
  const [seguidos, setSeguidos] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [resumen, setResumen] = useState<ResumenValoracion | null>(null);
  const [miaValoracion, setMiaValoracion] = useState<Valoracion | null>(null);
  const [valorModal, setValorModal] = useState(false);
  const [tempStars, setTempStars] = useState(5);
  const [tempComentario, setTempComentario] = useState('');
  const [savingValor, setSavingValor] = useState(false);

  const esMiPerfil = idUsuario === Number(id);
  const esCliente = rol === 'CLIENTE';

  const cargar = useCallback(async () => {
    try {
      const [u, p, port] = await Promise.all([
        artistasService.getUsuarioById(Number(id)),
        artistasService.getPerfilById(Number(id)),
        artistasService.getPortfolio(Number(id)),
      ]);
      setUsuario(u);
      setPerfil(p);
      setPortfolio(port);

      if (idUsuario && idUsuario !== Number(id)) {
        const estado = await artistasService.getEstadoSeguir(Number(id), idUsuario);
        setSiguiendo(estado.siguiendo);
        setSeguidores(estado.seguidores);
        setSeguidos(estado.seguidos);
      } else {
        const contadores = await artistasService.getContadores(Number(id));
        setSeguidores(contadores.seguidores);
        setSeguidos(contadores.seguidos);
      }

      const [res, vals] = await Promise.all([
        valoracionesService.getResumen(Number(id)),
        valoracionesService.getByArtista(Number(id)),
      ]);
      setResumen(res);
      setValoraciones(vals);

      if (idUsuario && esCliente) {
        const mia = await valoracionesService.getMia(Number(id), idUsuario);
        setMiaValoracion(mia);
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar el perfil.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

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
              setPortfolio((prev) => prev.filter((p) => p.idPublicacion !== item.idPublicacion));
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

  const handleSeguir = async () => {
    if (!idUsuario || followLoading) return;
    setFollowLoading(true);
    const wasSiguiendo = siguiendo;
    setSiguiendo(!wasSiguiendo);
    setSeguidores((prev) => wasSiguiendo ? prev - 1 : prev + 1);
    try {
      const { siguiendo: s, seguidores: c } = await artistasService.toggleSeguir(Number(id), idUsuario);
      setSiguiendo(s);
      setSeguidores(c);
    } catch {
      setSiguiendo(wasSiguiendo);
      setSeguidores((prev) => wasSiguiendo ? prev + 1 : prev - 1);
      Alert.alert('Error', 'No se pudo completar la acción.');
    } finally {
      setFollowLoading(false);
    }
  };

  const openValorModal = () => {
    setTempStars(miaValoracion?.puntuacion ?? 5);
    setTempComentario(miaValoracion?.comentario ?? '');
    setValorModal(true);
  };

  const handleGuardarValoracion = async () => {
    if (!idUsuario) return;
    setSavingValor(true);
    try {
      const saved = await valoracionesService.createOrUpdate(
        Number(id), idUsuario, tempStars, tempComentario,
      );
      setMiaValoracion(saved);
      const [res, vals] = await Promise.all([
        valoracionesService.getResumen(Number(id)),
        valoracionesService.getByArtista(Number(id)),
      ]);
      setResumen(res);
      setValoraciones(vals);
      setValorModal(false);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la valoración.');
    } finally {
      setSavingValor(false);
    }
  };

  const handleEliminarValoracion = () => {
    if (!miaValoracion) return;
    Alert.alert(
      t('artist_rate_delete'),
      '¿Seguro?',
      [
        { text: t('artist_rate_cancel'), style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await valoracionesService.eliminar(miaValoracion.idValoracion);
              setMiaValoracion(null);
              const [res, vals] = await Promise.all([
                valoracionesService.getResumen(Number(id)),
                valoracionesService.getByArtista(Number(id)),
              ]);
              setResumen(res);
              setValoraciones(vals);
              setValorModal(false);
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la valoración.');
            }
          },
        },
      ]
    );
  };

  const renderStars = (count: number, size = 14, interactive = false, onPress?: (n: number) => void) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => onPress?.(n)}
          disabled={!interactive}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Ionicons
            name={n <= count ? 'star' : 'star-outline'}
            size={size}
            color={n <= count ? '#FFB800' : Colors.textMuted}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading || !usuario) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const ListHeader = () => (
    <View>
      <View style={styles.bioSection}>
        {/* Avatar + stats */}
        <View style={styles.avatarStatsRow}>
          {usuario.avatar ? (
            <Image source={{ uri: usuario.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {usuario.nombre?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{portfolio.length}</Text>
              <Text style={styles.statLabel}>{t('profile_posts')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{seguidores}</Text>
              <Text style={styles.statLabel}>{t('profile_followers')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{seguidos}</Text>
              <Text style={styles.statLabel}>{t('profile_following')}</Text>
            </View>
          </View>
        </View>

        {/* Nombre + badge + bio  |  Estudio a la derecha */}
        <View style={styles.nameRow}>
          {/* Columna izquierda */}
          <View style={styles.nameCol}>
            <Text style={styles.displayName}>
              {usuario.nombre}{usuario.apellidos ? ` ${usuario.apellidos}` : ''}
            </Text>
            <View style={styles.rolBadge}>
              <Text style={styles.rolText}>ARTISTA</Text>
            </View>
            {perfil?.especialidades && (
              <Text style={styles.especialidades}>{perfil.especialidades}</Text>
            )}
            {usuario.bio && <Text style={styles.bio}>{usuario.bio}</Text>}
          </View>

          {/* Columna derecha: chip estudio */}
          {perfil?.estudio && (
            <View style={styles.empresaChip}>
              <Ionicons name="business-outline" size={13} color={Colors.textSecondary} />
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.empresaText} numberOfLines={1}>{perfil.estudio.nombre}</Text>
                {(perfil.estudio.ciudad || perfil.estudio.localizacion) && (
                  perfil.estudio.localizacion ? (
                    <TouchableOpacity onPress={() => {
                      const q = encodeURIComponent(perfil.estudio!.localizacion!);
                      Linking.openURL(`https://maps.google.com/?q=${q}`);
                    }}>
                      <Text style={styles.empresaLoc} numberOfLines={1}>
                        {perfil.estudio.ciudad ?? 'Ver ubicación'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.empresaLoc} numberOfLines={1}>{perfil.estudio.ciudad}</Text>
                  )
                )}
              </View>
            </View>
          )}
        </View>

        {/* Rating summary */}
        {resumen && resumen.total > 0 && (
          <View style={styles.ratingRow}>
            {renderStars(Math.round(resumen.media))}
            <Text style={styles.ratingAvg}>{resumen.media.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({resumen.total})</Text>
          </View>
        )}

        {/* Chips de info */}
        {perfil && (
          <View style={styles.badgeRow}>
            <View style={[styles.chip, perfil.disponible ? styles.chipOk : styles.chipNo]}>
              <Text style={[styles.chipText, perfil.disponible ? styles.chipTextOk : styles.chipTextNo]}>
                {perfil.disponible ? t('artist_available') : t('artist_busy')}
              </Text>
            </View>
            {perfil.anosExperiencia && (
              <View style={styles.chipNeutral}>
                <Text style={styles.chipNeutralText}>{perfil.anosExperiencia} años exp.</Text>
              </View>
            )}
            {perfil.precioHora && (
              <View style={styles.chipNeutral}>
                <Text style={styles.chipNeutralText}>{perfil.precioHora}€/h</Text>
              </View>
            )}
          </View>
        )}

        {/* Botones de acción */}
        {!esMiPerfil && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.btn, siguiendo ? styles.btnSecondary : styles.btnPrimary]}
              onPress={handleSeguir}
            >
              <Text style={[styles.btnText, siguiendo && styles.btnTextSecondary]}>
                {siguiendo ? t('artist_following') : t('artist_follow')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => router.push(`/conversaciones/${id}`)}
            >
              <Text style={styles.btnText}>{t('artist_message')}</Text>
            </TouchableOpacity>
            {perfil?.disponible && (
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => router.push(`/solicitudes/nueva?artistaId=${id}`)}
              >
                <Text style={styles.btnText}>{t('artist_book')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Botón valorar: solo CLIENTE + no es mi perfil */}
        {!esMiPerfil && esCliente && (
          <TouchableOpacity style={styles.btnOutline} onPress={openValorModal}>
            <Text style={styles.btnOutlineText}>
              {miaValoracion
                ? `${t('artist_rate')} ★ ${miaValoracion.puntuacion}/5`
                : t('artist_rate')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider} />
    </View>
  );

  const ListFooter = () => (
    <View>
      <Text style={styles.ratingsSectionTitle}>{t('artist_ratings_title')}</Text>
      {valoraciones.length === 0 ? (
        <View style={styles.emptyRatings}>
          <Text style={styles.emptyRatingsText}>{t('artist_no_ratings')}</Text>
        </View>
      ) : (
        valoraciones.map((v) => (
          <View key={v.idValoracion} style={styles.ratingItem}>
            <View style={styles.ratingItemHeader}>
              {v.cliente.avatar ? (
                <Image source={{ uri: v.cliente.avatar }} style={styles.ratingAvatar} />
              ) : (
                <View style={styles.ratingAvatarPlaceholder}>
                  <Text style={styles.ratingAvatarInitial}>
                    {v.cliente.nombre.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.ratingMeta}>
                <Text style={styles.ratingName}>
                  {v.cliente.nombre}{v.cliente.apellidos ? ` ${v.cliente.apellidos}` : ''}
                </Text>
                <Text style={styles.ratingDate}>
                  {new Date(v.creadoEn).toLocaleDateString()}
                </Text>
              </View>
              {renderStars(v.puntuacion, 13)}
            </View>
            {v.comentario ? (
              <Text style={styles.ratingComment}>{v.comentario}</Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerUsername}>
          {usuario.nombre?.toLowerCase().replace(/\s+/g, '_')}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <FlatList
        data={portfolio}
        keyExtractor={(item) => String(item.idPublicacion)}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        ListHeaderComponent={<ListHeader />}
        ListFooterComponent={<ListFooter />}
        renderItem={({ item }) => (
          <View style={styles.gridTileWrapper}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(`/publicaciones/${item.idPublicacion}`)}
            >
              <Image source={{ uri: item.fotoUrl }} style={styles.gridTile} resizeMode="cover" />
            </TouchableOpacity>
            {esMiPerfil && (
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
          <View style={styles.emptyGrid}>
            <Ionicons name="camera-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyGridTitle}>{t('artist_no_posts')}</Text>
            <Text style={styles.emptyGridSub}>{t('artist_no_posts_sub')}</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
      />

      {/* Modal de valoración */}
      <Modal visible={valorModal} transparent animationType="slide" onRequestClose={() => setValorModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t('artist_rate_modal_title')}</Text>

            {/* Estrellas interactivas */}
            <View style={styles.modalStarsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setTempStars(n)} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
                  <Ionicons
                    name={n <= tempStars ? 'star' : 'star-outline'}
                    size={36}
                    color={n <= tempStars ? '#FFB800' : Colors.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder={t('artist_rate_placeholder')}
              placeholderTextColor={Colors.textMuted}
              value={tempComentario}
              onChangeText={setTempComentario}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setValorModal(false)}>
                <Text style={styles.modalBtnCancelText}>{t('artist_rate_cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnSave}
                onPress={handleGuardarValoracion}
                disabled={savingValor}
              >
                {savingValor
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.modalBtnSaveText}>{t('artist_rate_save')}</Text>
                }
              </TouchableOpacity>
            </View>

            {miaValoracion && (
              <TouchableOpacity style={styles.modalBtnDelete} onPress={handleEliminarValoracion}>
                <Text style={styles.modalBtnDeleteText}>{t('artist_rate_delete')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
