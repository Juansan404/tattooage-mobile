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
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { estudiosService } from '../../services/estudios.service';
import { Estudio, PerfilArtista } from '../../types/usuario.types';
import { useColors } from '../../hooks/useColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_TILE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;
const COVER_HEIGHT = 200;

export default function PerfilEstudioScreen() {
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
    headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, letterSpacing: 0.2 },

    cover: { width: SCREEN_WIDTH, height: COVER_HEIGHT, backgroundColor: Colors.surface },
    coverPlaceholder: {
      width: SCREEN_WIDTH,
      height: COVER_HEIGHT,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
    },

    infoSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 10 },

    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    nombre: { fontSize: 22, fontWeight: '900', color: Colors.text, flex: 1 },
    ciudadBadge: {
      backgroundColor: Colors.primary + '22',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    ciudadText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

    descripcion: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

    statsRow: {
      flexDirection: 'row',
      gap: 24,
      paddingVertical: 12,
      borderTopWidth: 0.5,
      borderBottomWidth: 0.5,
      borderColor: Colors.border,
    },
    statItem: { alignItems: 'center', gap: 2 },
    statNumber: { fontSize: 18, fontWeight: '800', color: Colors.text },
    statLabel: { fontSize: 11, color: Colors.textSecondary },

    contactSection: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    contactText: { fontSize: 13, color: Colors.text, flex: 1 },
    contactLink: { fontSize: 13, color: Colors.primary, flex: 1, textDecorationLine: 'underline' },

    divider: { height: 0.5, backgroundColor: Colors.border, marginHorizontal: 16 },

    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 10,
    },

    artistaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: Colors.border,
    },
    avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: Colors.primary },
    avatarPlaceholder: {
      width: 46, height: 46, borderRadius: 23,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1.5, borderColor: Colors.primary,
    },
    avatarInitial: { fontSize: 18, fontWeight: '700', color: Colors.primary },
    artistaInfo: { flex: 1, gap: 2 },
    artistaNombre: { fontSize: 14, fontWeight: '700', color: Colors.text },
    artistaSub: { fontSize: 12, color: Colors.textMuted },
    disponibleDot: { width: 8, height: 8, borderRadius: 4 },

    emptyArtistas: { alignItems: 'center', paddingVertical: 32, gap: 8 },
    emptyText: { fontSize: 13, color: Colors.textMuted },
  });

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const numId = Number(id);

  const [estudio, setEstudio] = useState<Estudio | null>(null);
  const [artistas, setArtistas] = useState<PerfilArtista[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const [est, arts] = await Promise.all([
        estudiosService.getById(numId),
        estudiosService.getArtistas(numId),
      ]);
      setEstudio(est);
      setArtistas(arts);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el estudio.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [numId]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirMapa = () => {
    if (!estudio) return;
    const q = encodeURIComponent(estudio.localizacion ?? `${estudio.nombre} ${estudio.ciudad ?? ''}`);
    Linking.openURL(`https://maps.google.com/?q=${q}`);
  };

  const abrirUrl = (url: string) => {
    const full = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(full);
  };

  if (loading || !estudio) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const disponibles = artistas.filter(a => a.disponible).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{estudio.nombre}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Foto portada */}
        {estudio.fotoPortada ? (
          <Image source={{ uri: estudio.fotoPortada }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="business" size={64} color={Colors.border} />
          </View>
        )}

        {/* Info principal */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.nombre}>{estudio.nombre}</Text>
            {estudio.ciudad && (
              <View style={styles.ciudadBadge}>
                <Text style={styles.ciudadText}>{estudio.ciudad}</Text>
              </View>
            )}
          </View>
          {estudio.descripcion && (
            <Text style={styles.descripcion}>{estudio.descripcion}</Text>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { paddingHorizontal: 24 }]}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{artistas.length}</Text>
            <Text style={styles.statLabel}>artistas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{disponibles}</Text>
            <Text style={styles.statLabel}>disponibles</Text>
          </View>
        </View>

        {/* Contacto */}
        {(estudio.direccion || estudio.telefono || estudio.email || estudio.web || estudio.instagram || estudio.localizacion) && (
          <View style={styles.contactSection}>
            {estudio.direccion && (
              <TouchableOpacity style={styles.contactRow} onPress={abrirMapa} activeOpacity={0.7}>
                <Ionicons name="location-outline" size={18} color={Colors.primary} />
                <Text style={styles.contactLink}>{estudio.direccion}{estudio.ciudad ? `, ${estudio.ciudad}` : ''}</Text>
              </TouchableOpacity>
            )}
            {!estudio.direccion && estudio.localizacion && (
              <TouchableOpacity style={styles.contactRow} onPress={abrirMapa} activeOpacity={0.7}>
                <Ionicons name="location-outline" size={18} color={Colors.primary} />
                <Text style={styles.contactLink}>Ver en mapa</Text>
              </TouchableOpacity>
            )}
            {estudio.telefono && (
              <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${estudio.telefono}`)} activeOpacity={0.7}>
                <Ionicons name="call-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.contactText}>{estudio.telefono}</Text>
              </TouchableOpacity>
            )}
            {estudio.email && (
              <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${estudio.email}`)} activeOpacity={0.7}>
                <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.contactLink}>{estudio.email}</Text>
              </TouchableOpacity>
            )}
            {estudio.web && (
              <TouchableOpacity style={styles.contactRow} onPress={() => abrirUrl(estudio.web!)} activeOpacity={0.7}>
                <Ionicons name="globe-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.contactLink}>{estudio.web}</Text>
              </TouchableOpacity>
            )}
            {estudio.instagram && (
              <TouchableOpacity style={styles.contactRow} onPress={() => abrirUrl(`https://instagram.com/${estudio.instagram!.replace('@', '')}`)} activeOpacity={0.7}>
                <Ionicons name="logo-instagram" size={18} color={Colors.textSecondary} />
                <Text style={styles.contactLink}>@{estudio.instagram!.replace('@', '')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.divider} />

        {/* Artistas del estudio */}
        <Text style={styles.sectionTitle}>Artistas</Text>
        {artistas.length === 0 ? (
          <View style={styles.emptyArtistas}>
            <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Sin artistas asociados todavía.</Text>
          </View>
        ) : (
          artistas.map((a) => {
            const u = a.usuario;
            if (!u) return null;
            return (
              <TouchableOpacity
                key={a.idPerfil ?? u.idUsuario}
                style={styles.artistaRow}
                activeOpacity={0.7}
                onPress={() => router.push(`/usuarios/${u.idUsuario}`)}
              >
                {u.avatar ? (
                  <Image source={{ uri: u.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{u.nombre?.charAt(0).toUpperCase() ?? '?'}</Text>
                  </View>
                )}
                <View style={styles.artistaInfo}>
                  <Text style={styles.artistaNombre}>{u.nombre}{u.apellidos ? ` ${u.apellidos}` : ''}</Text>
                  {a.especialidades && <Text style={styles.artistaSub}>{a.especialidades}</Text>}
                  {a.precioHora && <Text style={styles.artistaSub}>{a.precioHora}€/h</Text>}
                </View>
                <View style={[styles.disponibleDot, { backgroundColor: a.disponible ? Colors.success : Colors.error }]} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
