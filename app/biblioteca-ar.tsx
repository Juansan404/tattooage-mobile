import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { publicacionesService } from '../services/publicaciones.service';
import { arCapturasService, ARCaptura } from '../services/ar-capturas.service';
import { useAuthStore } from '../store/auth.store';
import { useColors } from '../hooks/useColors';
import { useTranslation } from '../hooks/useTranslation';
import { Publicacion } from '../types/publicacion.types';

const { width: W } = Dimensions.get('window');
const GRID_GAP = 2;
const TILE = (W - GRID_GAP * 2) / 3;

export default function BibliotecaARScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const router = useRouter();
  const { idUsuario } = useAuthStore();

  const [guardadas,  setGuardadas]  = useState<Publicacion[]>([]);
  const [capturas,   setCapturas]   = useState<ARCaptura[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [preview,    setPreview]    = useState<ARCaptura | null>(null);

  const cargar = useCallback(async () => {
    if (!idUsuario) return;
    try {
      const [pubs, caps] = await Promise.all([
        publicacionesService.getGuardadas(idUsuario),
        arCapturasService.listar(),
      ]);
      setGuardadas(pubs);
      setCapturas(caps);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [idUsuario]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const handleEliminarCaptura = (item: ARCaptura) => {
    Alert.alert('Eliminar captura', '¿Eliminar esta foto AR?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          await arCapturasService.eliminar(item.id);
          setCapturas((prev) => prev.filter((c) => c.id !== item.id));
          if (preview?.id === item.id) setPreview(null);
        },
      },
    ]);
  };

  const handleGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', t('ar_library_gallery_perm'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets.length > 0) {
      router.push({ pathname: '/ar/local', params: { imageUri: result.assets[0].uri } });
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: Colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: Colors.text }]}>{t('ar_library_title')}</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Botón galería */}
      <TouchableOpacity style={[s.galeriaBtn, { borderColor: Colors.border, backgroundColor: Colors.surface }]} onPress={handleGaleria} activeOpacity={0.8}>
        <Ionicons name="images-outline" size={22} color={Colors.primary} />
        <Text style={[s.galeriaBtnText, { color: Colors.text }]}>{t('ar_library_gallery_btn')}</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ── Mis capturas AR ── */}
          {capturas.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { color: Colors.textMuted }]}>Mis capturas AR</Text>
              <View style={s.grid}>
                {capturas.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => setPreview(item)}
                    onLongPress={() => handleEliminarCaptura(item)}
                  >
                    <Image source={{ uri: item.uri }} style={s.tile} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* ── Publicaciones guardadas ── */}
          <Text style={[s.sectionLabel, { color: Colors.textMuted }]}>{t('ar_library_saved_section')}</Text>
          {guardadas.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="bookmark-outline" size={52} color={Colors.textMuted} />
              <Text style={[s.emptyTitle, { color: Colors.text }]}>{t('ar_library_empty')}</Text>
              <Text style={[s.emptySub, { color: Colors.textSecondary }]}>{t('ar_library_empty_sub')}</Text>
            </View>
          ) : (
            <View style={s.grid}>
              {guardadas.map((item) => (
                <TouchableOpacity
                  key={item.idPublicacion}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/ar/${item.idPublicacion}`)}
                >
                  <Image source={{ uri: item.fotoUrl }} style={s.tile} resizeMode="cover" />
                  <View style={s.arBadge}>
                    <Ionicons name="camera-outline" size={11} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Preview captura a pantalla completa */}
      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={s.previewOverlay}>
          <TouchableOpacity style={s.previewClose} onPress={() => setPreview(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {preview && (
            <>
              <Image source={{ uri: preview.uri }} style={s.previewImg} resizeMode="contain" />
              <Text style={s.previewDate}>
                {new Date(preview.creadoEn).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity style={s.previewDelete} onPress={() => handleEliminarCaptura(preview)}>
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={s.previewDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5,
  },
  title: { fontSize: 17, fontWeight: '700' },

  galeriaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    padding: 14, borderRadius: 12, borderWidth: 0.5,
  },
  galeriaBtnText: { flex: 1, fontSize: 15, fontWeight: '600' },

  sectionLabel: {
    fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase',
    marginHorizontal: 16, marginTop: 20, marginBottom: 10,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, paddingHorizontal: GRID_GAP },

  tile: { width: TILE, height: TILE },
  arBadge: {
    position: 'absolute', bottom: 5, right: 5,
    backgroundColor: 'rgba(192,57,43,0.85)',
    borderRadius: 8, padding: 3,
  },

  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  previewOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  previewClose:  { position: 'absolute', top: 48, right: 20, padding: 8 },
  previewImg:    { width: W - 32, height: W - 32, borderRadius: 8 },
  previewDate:   { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 10 },
  previewDelete: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20,
    backgroundColor: 'rgba(220,60,60,0.85)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
  },
  previewDeleteText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
