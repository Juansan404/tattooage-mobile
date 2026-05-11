import { useEffect, useState, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../services/api';
import { artistasService } from '../../services/artistas.service';
import { publicacionesService } from '../../services/publicaciones.service';
import { conversacionesService } from '../../services/conversaciones.service';
import { Usuario, PerfilArtista } from '../../types/usuario.types';
import { Publicacion } from '../../types/publicacion.types';
import { useAuthStore } from '../../store/auth.store';
import SeguidoresModal from '../../components/perfil/SeguidoresModal';
import { useColors } from '../../hooks/useColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_TILE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

export default function PerfilPublicoScreen() {
  const Colors = useColors();
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
    headerUsername: { fontSize: 18, fontWeight: '800', color: Colors.text, letterSpacing: 0.2 },

    bioSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 },
    avatarStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatar: { width: 86, height: 86, borderRadius: 43, borderWidth: 2, borderColor: Colors.primary },
    avatarPlaceholder: {
      width: 86, height: 86, borderRadius: 43,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: Colors.primary,
    },
    avatarInitial: { fontSize: 32, fontWeight: '700', color: Colors.primary },
    statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
    statItem: { alignItems: 'center', gap: 2 },
    statNumber: { fontSize: 18, fontWeight: '800', color: Colors.text },
    statLabel: { fontSize: 11, color: Colors.textSecondary },

    nameBlock: { gap: 4 },
    displayName: { fontSize: 14, fontWeight: '700', color: Colors.text },
    rolBadge: {
      alignSelf: 'flex-start',
      backgroundColor: Colors.surfaceLight,
      paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6,
    },
    rolBadgeArtista: { backgroundColor: Colors.primary + '22' },
    rolText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
    rolTextArtista: { color: Colors.primary },
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

    emptyGrid: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText: { color: Colors.textSecondary, fontSize: 14 },
  });

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { idUsuario } = useAuthStore();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [perfil, setPerfil] = useState<PerfilArtista | null>(null);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [siguiendo, setSiguiendo] = useState(false);
  const [seguidores, setSeguidores] = useState(0);
  const [seguidos, setSeguidos] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [modalTipo, setModalTipo] = useState<'seguidores' | 'seguidos' | null>(null);

  const numId = Number(id);
  const esMiPerfil = idUsuario === numId;

  const cargar = useCallback(async () => {
    try {
      const [u, feed] = await Promise.all([
        api.get<Usuario>(`/usuarios/${numId}`).then((r) => r.data),
        publicacionesService.getFeed(),
      ]);
      setUsuario(u);
      setPublicaciones(feed.filter((p) => p.usuario?.idUsuario === numId));

      if (u.rol === 'ARTISTA') {
        artistasService.getPerfilById(numId).then(setPerfil).catch(() => {});
      }

      if (idUsuario && idUsuario !== numId) {
        const estado = await artistasService.getEstadoSeguir(numId, idUsuario);
        setSiguiendo(estado.siguiendo);
        setSeguidores(estado.seguidores);
        setSeguidos(estado.seguidos);
      } else {
        const contadores = await artistasService.getContadores(numId);
        setSeguidores(contadores.seguidores);
        setSeguidos(contadores.seguidos);
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar el perfil.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleMensaje = async () => {
    if (!idUsuario || msgLoading) return;
    setMsgLoading(true);
    try {
      const conv = await conversacionesService.findOrCreate(idUsuario, numId);
      router.push(`/conversaciones/${conv.idConversacion}`);
    } catch {
      // findOrCreate puede fallar en la primera creación (serialización backend)
      // pero la conversación sí se crea — buscamos como fallback
      try {
        const convs = await conversacionesService.getByUsuario(idUsuario);
        const existente = convs.find(
          (c) => c.usuario1?.idUsuario === numId || c.usuario2?.idUsuario === numId
        );
        if (existente) {
          router.push(`/conversaciones/${existente.idConversacion}`);
          return;
        }
      } catch {}
      Alert.alert('Error', 'No se pudo abrir la conversación.');
    } finally {
      setMsgLoading(false);
    }
  };

  const handleSeguir = async () => {
    if (!idUsuario || followLoading) return;
    setFollowLoading(true);
    const wasSiguiendo = siguiendo;
    setSiguiendo(!wasSiguiendo);
    setSeguidores((prev) => (wasSiguiendo ? prev - 1 : prev + 1));
    try {
      const { siguiendo: s, seguidores: c } = await artistasService.toggleSeguir(numId, idUsuario);
      setSiguiendo(s);
      setSeguidores(c);
    } catch {
      setSiguiendo(wasSiguiendo);
      setSeguidores((prev) => (wasSiguiendo ? prev + 1 : prev - 1));
      Alert.alert('Error', 'No se pudo completar la acción.');
    } finally {
      setFollowLoading(false);
    }
  };

  const listHeader = useMemo(() => {
    if (!usuario) return null;
    return (
    <View>
      <View style={styles.bioSection}>
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
              <Text style={styles.statNumber}>{publicaciones.length}</Text>
              <Text style={styles.statLabel}>publicaciones</Text>
            </View>
            <TouchableOpacity style={styles.statItem} onPress={() => setModalTipo('seguidores')} activeOpacity={0.7}>
              <Text style={styles.statNumber}>{seguidores}</Text>
              <Text style={styles.statLabel}>seguidores</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={() => setModalTipo('seguidos')} activeOpacity={0.7}>
              <Text style={styles.statNumber}>{seguidos}</Text>
              <Text style={styles.statLabel}>seguidos</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.nameBlock}>
          <Text style={styles.displayName}>
            {usuario.nombre}{usuario.apellidos ? ` ${usuario.apellidos}` : ''}
          </Text>
          <View style={[styles.rolBadge, usuario.rol === 'ARTISTA' && styles.rolBadgeArtista]}>
            <Text style={[styles.rolText, usuario.rol === 'ARTISTA' && styles.rolTextArtista]}>
              {usuario.rol}
            </Text>
          </View>
          {usuario.bio && <Text style={styles.bio}>{usuario.bio}</Text>}
          {perfil?.especialidades && (
            <Text style={styles.especialidades}>{perfil.especialidades}</Text>
          )}
        </View>

        {perfil && (
          <View style={styles.badgeRow}>
            <View style={[styles.chip, perfil.disponible ? styles.chipOk : styles.chipNo]}>
              <Text style={[styles.chipText, perfil.disponible ? styles.chipTextOk : styles.chipTextNo]}>
                {perfil.disponible ? 'Disponible' : 'Ocupado'}
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

        {!esMiPerfil && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.btn, siguiendo ? styles.btnSecondary : styles.btnPrimary]}
              onPress={handleSeguir}
              disabled={followLoading}
            >
              <Text style={[styles.btnText, siguiendo && styles.btnTextSecondary]}>
                {siguiendo ? 'Siguiendo' : 'Seguir'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, msgLoading && { opacity: 0.6 }]}
              onPress={handleMensaje}
              disabled={msgLoading}
            >
              <Text style={styles.btnText}>Mensaje</Text>
            </TouchableOpacity>
            {perfil?.disponible && (
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => router.push(`/solicitudes/nueva?artistaId=${numId}`)}
              >
                <Text style={styles.btnText}>Solicitar cita</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      <View style={styles.divider} />
    </View>
    );
  }, [siguiendo, seguidores, seguidos, followLoading, msgLoading, perfil, usuario, publicaciones.length, esMiPerfil]);

  if (loading || !usuario) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        data={publicaciones}
        keyExtractor={(item) => String(item.idPublicacion)}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        extraData={listHeader}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push(`/publicaciones/${item.idPublicacion}`)}
          >
            <Image
              source={{ uri: item.fotoUrl }}
              style={styles.gridTile}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyGrid}>
            <Ionicons name="camera-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Sin publicaciones aún.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
      />

      <SeguidoresModal
        idUsuario={modalTipo ? numId : null}
        tipo={modalTipo ?? 'seguidores'}
        onClose={() => setModalTipo(null)}
        onNavigate={(id) => {
          setModalTipo(null);
          setTimeout(() => router.push(`/usuarios/${id}`), 300);
        }}
      />
    </SafeAreaView>
  );
}
