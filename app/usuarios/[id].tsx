import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../services/api';
import { artistasService } from '../../services/artistas.service';
import { publicacionesService } from '../../services/publicaciones.service';
import { conversacionesService } from '../../services/conversaciones.service';
import { Usuario, PerfilArtista } from '../../types/usuario.types';
import { Publicacion } from '../../types/publicacion.types';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = (SCREEN_WIDTH - 3) / 3;

export default function PerfilPublicoScreen() {
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

  const numId = Number(id);
  const esMiPerfil = idUsuario === numId;

  useEffect(() => {
    const cargar = async () => {
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
    };
    cargar();
  }, [id]);

  const handleMensaje = async () => {
    if (!idUsuario || msgLoading) return;
    setMsgLoading(true);
    try {
      const conv = await conversacionesService.findOrCreate(idUsuario, numId);
      router.push(`/conversaciones/${conv.idConversacion}`);
    } catch {
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

  if (loading || !usuario) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Navegación */}
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>
            {usuario.nombre?.toLowerCase().replace(/\s+/g, '_')}
          </Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Perfil */}
        <View style={styles.profileSection}>
          {usuario.avatar ? (
            <Image source={{ uri: usuario.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {usuario.nombre?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
          )}

          <Text style={styles.nombre}>{usuario.nombre} {usuario.apellidos}</Text>

          {/* Badge rol */}
          <View style={[styles.rolBadge, usuario.rol === 'ARTISTA' && styles.rolBadgeArtista]}>
            <Text style={[styles.rolText, usuario.rol === 'ARTISTA' && styles.rolTextArtista]}>
              {usuario.rol}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{publicaciones.length}</Text>
              <Text style={styles.statLabel}>publicaciones</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{seguidores}</Text>
              <Text style={styles.statLabel}>seguidores</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{seguidos}</Text>
              <Text style={styles.statLabel}>seguidos</Text>
            </View>
          </View>

          {usuario.bio && <Text style={styles.bio}>{usuario.bio}</Text>}

          {/* Info artista */}
          {perfil?.especialidades && (
            <Text style={styles.especialidades}>{perfil.especialidades}</Text>
          )}
          {perfil && (
            <View style={styles.badgeRow}>
              <View style={[styles.badge, perfil.disponible ? styles.badgeDisponible : styles.badgeOcupado]}>
                <Text style={[styles.badgeText, perfil.disponible ? styles.badgeTextDisp : styles.badgeTextOcup]}>
                  {perfil.disponible ? 'Disponible' : 'Ocupado'}
                </Text>
              </View>
              {perfil.anosExperiencia && (
                <View style={styles.badgeNeutral}>
                  <Text style={styles.badgeTextNeutral}>{perfil.anosExperiencia} años exp.</Text>
                </View>
              )}
              {perfil.precioHora && (
                <View style={styles.badgeNeutral}>
                  <Text style={styles.badgeTextNeutral}>{perfil.precioHora}€/h</Text>
                </View>
              )}
            </View>
          )}

          {/* Botones de acción */}
          {!esMiPerfil && (
            <View style={styles.actionRow}>
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

        {/* Grid de publicaciones */}
        {publicaciones.length > 0 && (
          <View style={styles.portfolioSection}>
            <Text style={styles.sectionTitle}>Publicaciones ({publicaciones.length})</Text>
            <View style={styles.grid}>
              {publicaciones.map((p) => (
                <TouchableOpacity
                  key={p.idPublicacion}
                  onPress={() => router.push(`/publicaciones/${p.idPublicacion}`)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: p.fotoUrl }} style={styles.gridImage} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {publicaciones.length === 0 && (
          <View style={styles.emptyPubs}>
            <Ionicons name="camera-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Sin publicaciones aún.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {},
  navTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 2, borderColor: Colors.primary, marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.primary, marginBottom: 8,
  },
  avatarInitial: { fontSize: 36, fontWeight: '700', color: Colors.primary },
  nombre: { fontSize: 22, fontWeight: '700', color: Colors.text },
  rolBadge: {
    alignSelf: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6,
  },
  rolBadgeArtista: { backgroundColor: Colors.primary + '22' },
  rolText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  rolTextArtista: { color: Colors.primary },
  statsRow: { flexDirection: 'row', gap: 28, marginTop: 4 },
  statItem: { alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 17, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary },
  bio: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  especialidades: { fontSize: 13, color: Colors.primary, textAlign: 'center', fontStyle: 'italic' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeDisponible: { backgroundColor: Colors.success + '22' },
  badgeOcupado: { backgroundColor: Colors.error + '22' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeTextDisp: { color: Colors.success, fontSize: 12, fontWeight: '700' },
  badgeTextOcup: { color: Colors.error, fontSize: 12, fontWeight: '700' },
  badgeNeutral: { backgroundColor: Colors.surfaceLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeTextNeutral: { color: Colors.textSecondary, fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  btnPrimary: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  btnSecondary: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  btnTextSecondary: { color: Colors.text },
  portfolioSection: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 1.5 },
  gridImage: { width: GRID_SIZE, height: GRID_SIZE, backgroundColor: Colors.surface },
  emptyPubs: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
});
