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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { artistasService } from '../../services/artistas.service';
import { Usuario, PerfilArtista } from '../../types/usuario.types';
import { Publicacion } from '../../types/publicacion.types';
import { useAuthStore } from '../../store/auth.store';
import { useColors } from '../../hooks/useColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_TILE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

export default function PerfilArtistaScreen() {
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
  });

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { idUsuario } = useAuthStore();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [perfil, setPerfil] = useState<PerfilArtista | null>(null);
  const [portfolio, setPortfolio] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [siguiendo, setSiguiendo] = useState(false);
  const [seguidores, setSeguidores] = useState(0);
  const [seguidos, setSeguidos] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const esMiPerfil = idUsuario === Number(id);

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
    } catch {
      Alert.alert('Error', 'No se pudo cargar el perfil.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

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
        </View>

        {/* Nombre + badge + bio */}
        <View style={styles.nameBlock}>
          <Text style={styles.displayName}>
            {usuario.nombre}{usuario.apellidos ? ` ${usuario.apellidos}` : ''}
          </Text>
          <View style={styles.rolBadge}>
            <Text style={styles.rolText}>ARTISTA</Text>
          </View>
          {usuario.bio && <Text style={styles.bio}>{usuario.bio}</Text>}
          {perfil?.especialidades && (
            <Text style={styles.especialidades}>{perfil.especialidades}</Text>
          )}
        </View>

        {/* Chips de info */}
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

        {/* Botones de acción */}
        {!esMiPerfil && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.btn, siguiendo ? styles.btnSecondary : styles.btnPrimary]}
              onPress={handleSeguir}
            >
              <Text style={[styles.btnText, siguiendo && styles.btnTextSecondary]}>
                {siguiendo ? 'Siguiendo' : 'Seguir'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => router.push(`/conversaciones/${id}`)}
            >
              <Text style={styles.btnText}>Mensaje</Text>
            </TouchableOpacity>
            {perfil?.disponible && (
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => router.push(`/solicitudes/nueva?artistaId=${id}`)}
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
            <Ionicons name="camera-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyGridTitle}>Sin publicaciones</Text>
            <Text style={styles.emptyGridSub}>Aún no hay trabajos publicados.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
      />
    </SafeAreaView>
  );
}
