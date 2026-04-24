import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { artistasService } from '../../services/artistas.service';
import { Usuario, PerfilArtista } from '../../types/usuario.types';
import { Publicacion } from '../../types/publicacion.types';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = (SCREEN_WIDTH - 3) / 3;

export default function PerfilArtistaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { idUsuario } = useAuthStore();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [perfil, setPerfil] = useState<PerfilArtista | null>(null);
  const [portfolio, setPortfolio] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [siguiendo, setSiguiendo] = useState(false);

  const esMiPerfil = idUsuario === Number(id);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [u, p, port] = await Promise.all([
          artistasService.getUsuarioById(Number(id)),
          artistasService.getPerfilById(Number(id)),
          artistasService.getPortfolio(Number(id)),
        ]);
        setUsuario(u);
        setPerfil(p);
        setPortfolio(port);
      } catch {
        Alert.alert('Error', 'No se pudo cargar el perfil.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id]);

  const handleSeguir = async () => {
    try {
      if (siguiendo) {
        await artistasService.dejarDeSeguir(Number(id));
      } else {
        await artistasService.seguir(Number(id));
      }
      setSiguiendo(!siguiendo);
    } catch {
      Alert.alert('Error', 'No se pudo completar la acción.');
    }
  };

  const handleSolicitarCita = () => {
    router.push(`/solicitudes/nueva?artistaId=${id}`);
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
        {/* Header navegación */}
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>‹ Volver</Text>
          </TouchableOpacity>
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
          {usuario.bio && (
            <Text style={styles.bio}>{usuario.bio}</Text>
          )}

          {/* Especialidades y datos del perfil artista */}
          {perfil?.especialidades && (
            <Text style={styles.especialidades}>{perfil.especialidades}</Text>
          )}

          <View style={styles.badgeRow}>
            {perfil && (
              <View style={[styles.badge, perfil.disponible ? styles.badgeDisponible : styles.badgeOcupado]}>
                <Text style={[styles.badgeText, perfil.disponible ? styles.badgeTextDisponible : styles.badgeTextOcupado]}>
                  {perfil.disponible ? 'Disponible' : 'Ocupado'}
                </Text>
              </View>
            )}
            {perfil?.anosExperiencia && (
              <View style={styles.badgeNeutral}>
                <Text style={styles.badgeTextNeutral}>{perfil.anosExperiencia} años de experiencia</Text>
              </View>
            )}
            {perfil?.precioHora && (
              <View style={styles.badgeNeutral}>
                <Text style={styles.badgeTextNeutral}>{perfil.precioHora}€/h</Text>
              </View>
            )}
          </View>

          {/* Botones de acción */}
          {!esMiPerfil && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.btn, siguiendo ? styles.btnSecondary : styles.btnPrimary]}
                onPress={handleSeguir}
              >
                <Text style={[styles.btnText, siguiendo && styles.btnTextSecondary]}>
                  {siguiendo ? 'Siguiendo' : 'Seguir'}
                </Text>
              </TouchableOpacity>

              {perfil?.disponible && (
                <TouchableOpacity style={styles.btnPrimary} onPress={handleSolicitarCita}>
                  <Text style={styles.btnText}>Solicitar cita</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Portfolio */}
        <View style={styles.portfolioSection}>
          <Text style={styles.sectionTitle}>Portfolio ({portfolio.length})</Text>
          <View style={styles.grid}>
            {portfolio.map((p) => (
              <TouchableOpacity
                key={p.idPublicacion}
                onPress={() => router.push(`/publicaciones/${p.idPublicacion}`)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: p.fotoUrl }} style={styles.gridImage} />
              </TouchableOpacity>
            ))}
            {portfolio.length === 0 && (
              <Text style={styles.emptyText}>Aún no hay trabajos publicados.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 8,
  },
  avatarInitial: { fontSize: 36, fontWeight: '700', color: Colors.primary },
  nombre: { fontSize: 22, fontWeight: '700', color: Colors.text },
  bio: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  especialidades: { fontSize: 13, color: Colors.primary, textAlign: 'center', fontStyle: 'italic' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeDisponible: { backgroundColor: Colors.success + '22' },
  badgeOcupado: { backgroundColor: Colors.error + '22' },
  badgeTextDisponible: { color: Colors.success, fontSize: 12, fontWeight: '700' },
  badgeTextOcupado: { color: Colors.error, fontSize: 12, fontWeight: '700' },
  badgeNeutral: { backgroundColor: Colors.surfaceLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
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
  emptyText: { color: Colors.textSecondary, fontSize: 14, padding: 16 },
});
