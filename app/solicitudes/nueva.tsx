import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { solicitudesService } from '../../services/solicitudes.service';
import { artistasService } from '../../services/artistas.service';
import { publicacionesService } from '../../services/publicaciones.service';
import { useAuthStore } from '../../store/auth.store';
import { Usuario } from '../../types/usuario.types';
import { Publicacion } from '../../types/publicacion.types';
import { Dimensions } from 'react-native';
import { useColors } from '../../hooks/useColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_TILE = (SCREEN_WIDTH - 4) / 3;

export default function NuevaSolicitudScreen() {
  const Colors = useColors();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    title: { fontSize: 16, fontWeight: '700', color: Colors.text },
    form: { padding: 14, gap: 4 },
    label: {
      fontSize: 11,
      color: Colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 10,
      marginBottom: 3,
    },
    input: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      color: Colors.text,
    },
    inputMultiline: { minHeight: 68, textAlignVertical: 'top' },

    /* Selector artista */
    artistaSelector: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    artistaSeleccionadoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    artistaAvatar: {
      width: 32, height: 32, borderRadius: 16,
      borderWidth: 1.5, borderColor: Colors.primary,
    },
    artistaAvatarPlaceholder: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1.5, borderColor: Colors.border,
    },
    artistaAvatarInitial: { fontSize: 13, fontWeight: '700', color: Colors.primary },
    artistaNombre: { fontSize: 13, fontWeight: '600', color: Colors.text },
    artistaRol: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
    noArtistasText: {
      fontSize: 12,
      color: Colors.textMuted,
      marginTop: 6,
      lineHeight: 17,
    },

    /* Foto de referencia */
    refPreview: {
      width: '100%',
      height: 180,
      borderRadius: 10,
      backgroundColor: Colors.surface,
    },
    refRemoveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
    },
    refRemoveText: {
      fontSize: 13,
      color: Colors.error,
      fontWeight: '500',
    },
    orRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginVertical: 8,
    },
    orLine: { flex: 1, height: 0.5, backgroundColor: Colors.border },
    orText: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
    refBtnsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    refBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.primary + '55',
      borderRadius: 8,
      paddingVertical: 9,
    },
    refBtnText: {
      fontSize: 13,
      color: Colors.primary,
      fontWeight: '600',
    },
    guardadasCenter: { paddingVertical: 32, alignItems: 'center' },
    guardadasGrid: { paddingHorizontal: 0 },
    guardadaTile: { width: GRID_TILE, height: GRID_TILE, backgroundColor: Colors.surface },

    submitBtn: {
      backgroundColor: Colors.primary,
      borderRadius: 10,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 8,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

    /* Modal */
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: {
      backgroundColor: Colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: '65%',
      borderTopWidth: 0.5,
      borderColor: Colors.border,
    },
    sheetHandle: {
      width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2,
      alignSelf: 'center', marginTop: 10, marginBottom: 4,
    },
    sheetHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 0.5, borderBottomColor: Colors.border,
    },
    sheetTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
    sheetClose: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },
    sheetList: { paddingVertical: 8 },
    sheetEmpty: {
      color: Colors.textMuted, fontSize: 14, textAlign: 'center',
      paddingVertical: 24, paddingHorizontal: 16,
    },
    sheetItem: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingVertical: 12,
    },
    sheetAvatar: {
      width: 44, height: 44, borderRadius: 22,
      borderWidth: 1.5, borderColor: Colors.primary,
    },
    sheetAvatarPlaceholder: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1.5, borderColor: Colors.primary,
    },
    sheetAvatarInitial: { fontSize: 17, fontWeight: '700', color: Colors.primary },
    sheetNombre: { fontSize: 14, fontWeight: '600', color: Colors.text },
    sheetRol: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  });

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { artistaId } = useLocalSearchParams<{ artistaId: string }>();
  const { idUsuario } = useAuthStore();

  const [descripcion, setDescripcion] = useState('');
  const [zonaCuerpo, setZonaCuerpo] = useState('');
  const [tamano, setTamano] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [fotoRef, setFotoRef] = useState('');
  const [fotoRefUri, setFotoRefUri] = useState('');
  const [fotoRefBase64, setFotoRefBase64] = useState('');
  const [loading, setLoading] = useState(false);

  const [artistaSeleccionado, setArtistaSeleccionado] = useState<Usuario | null>(null);
  const [artistasSeguidos, setArtistasSeguidos] = useState<Usuario[]>([]);
  const [loadingArtistas, setLoadingArtistas] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);

  const [guardadasVisible, setGuardadasVisible] = useState(false);
  const [guardadas, setGuardadas] = useState<Publicacion[]>([]);
  const [loadingGuardadas, setLoadingGuardadas] = useState(false);

  const idArtistaFinal = artistaId ? Number(artistaId) : artistaSeleccionado?.idUsuario;

  useEffect(() => {
    if (artistaId || !idUsuario) return;
    setLoadingArtistas(true);
    artistasService.getSeguidos(idUsuario)
      .then((lista) => setArtistasSeguidos(lista.filter((u) => u.rol === 'ARTISTA')))
      .catch(() => {})
      .finally(() => setLoadingArtistas(false));
  }, [artistaId, idUsuario]);

  const abrirGuardadas = async () => {
    if (!idUsuario) return;
    setGuardadasVisible(true);
    if (guardadas.length > 0) return;
    setLoadingGuardadas(true);
    try {
      const data = await publicacionesService.getGuardadas(idUsuario);
      setGuardadas(data);
    } catch {
      // silencioso
    } finally {
      setLoadingGuardadas(false);
    }
  };

  const seleccionarFotoRef = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!resultado.canceled && resultado.assets[0]) {
      const asset = resultado.assets[0];
      setFotoRefUri(asset.uri);
      setFotoRefBase64(`data:image/jpeg;base64,${asset.base64}`);
      setFotoRef('');
    }
  };

  const handleEnviar = async () => {
    if (!idArtistaFinal) {
      Alert.alert('Error', 'Selecciona un artista antes de enviar la solicitud.');
      return;
    }
    if (!descripcion.trim()) {
      Alert.alert('Error', 'La descripción del tatuaje es obligatoria.');
      return;
    }
    if (!idUsuario) {
      Alert.alert('Error', 'Debes iniciar sesión para enviar una solicitud.');
      return;
    }

    try {
      setLoading(true);
      const solicitud = await solicitudesService.crear({
        cliente: { idUsuario },
        artista: { idUsuario: idArtistaFinal },
        descripcion: descripcion.trim(),
        zonaCuerpo: zonaCuerpo.trim() || undefined,
        tamano: tamano.trim() || undefined,
        presupuestoAprox: presupuesto ? Number(presupuesto) : undefined,
        fotoReferencia: fotoRefBase64 || fotoRefUri || fotoRef.trim() || undefined,
      });
      Alert.alert(
        '¡Solicitud enviada!',
        'El artista revisará tu solicitud y te responderá pronto.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/solicitudes') }]
      );
    } catch (err: any) {
      const status = err?.response?.status;
      if (status >= 500) {
        // La solicitud se guardó pero la respuesta falló — navegar al listado
        router.replace('/(tabs)/solicitudes');
      } else if (status === 401 || status === 403) {
        Alert.alert('Sesión expirada', 'Cierra sesión y vuelve a entrar para continuar.');
      } else {
        Alert.alert('Error', 'No se pudo enviar la solicitud. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Nueva solicitud</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">

          {/* Selector de artista (solo si no viene por param) */}
          {!artistaId && (
            <>
              <Text style={styles.label}>Artista *</Text>
              <TouchableOpacity
                style={styles.artistaSelector}
                onPress={() => setSelectorVisible(true)}
                activeOpacity={0.7}
              >
                {artistaSeleccionado ? (
                  <View style={styles.artistaSeleccionadoRow}>
                    {artistaSeleccionado.avatar ? (
                      <Image source={{ uri: artistaSeleccionado.avatar }} style={styles.artistaAvatar} />
                    ) : (
                      <View style={styles.artistaAvatarPlaceholder}>
                        <Text style={styles.artistaAvatarInitial}>
                          {artistaSeleccionado.nombre.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.artistaNombre}>
                        {artistaSeleccionado.nombre}{artistaSeleccionado.apellidos ? ` ${artistaSeleccionado.apellidos}` : ''}
                      </Text>
                      <Text style={styles.artistaRol}>Artista</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </View>
                ) : (
                  <View style={styles.artistaSeleccionadoRow}>
                    <View style={styles.artistaAvatarPlaceholder}>
                      <Ionicons name="person-outline" size={20} color={Colors.textMuted} />
                    </View>
                    <Text style={[styles.artistaNombre, { color: Colors.textMuted }]}>
                      {loadingArtistas ? 'Cargando artistas...' : 'Seleccionar artista que sigas'}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </View>
                )}
              </TouchableOpacity>
              {!loadingArtistas && artistasSeguidos.length === 0 && (
                <Text style={styles.noArtistasText}>
                  No sigues a ningún artista. Busca artistas en Explorar y síguelos para poder solicitar cita.
                </Text>
              )}
            </>
          )}

          <Text style={styles.label}>Descripción del tatuaje *</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Describe el tatuaje que quieres: tema, referencias, estilo..."
            placeholderTextColor={Colors.textMuted}
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Zona del cuerpo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: antebrazo, espalda, tobillo..."
            placeholderTextColor={Colors.textMuted}
            value={zonaCuerpo}
            onChangeText={setZonaCuerpo}
          />

          <Text style={styles.label}>Tamaño aproximado</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 10x10cm, pequeño, grande..."
            placeholderTextColor={Colors.textMuted}
            value={tamano}
            onChangeText={setTamano}
          />

          <Text style={styles.label}>Presupuesto máximo (€)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 200"
            placeholderTextColor={Colors.textMuted}
            value={presupuesto}
            onChangeText={setPresupuesto}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Imagen de referencia</Text>
          {fotoRefUri ? (
            <View>
              <Image source={{ uri: fotoRefUri }} style={styles.refPreview} resizeMode="cover" />
              <TouchableOpacity style={styles.refRemoveBtn} onPress={() => { setFotoRefUri(''); setFotoRefBase64(''); }}>
                <Ionicons name="close-circle" size={22} color={Colors.error} />
                <Text style={styles.refRemoveText}>Quitar foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor={Colors.textMuted}
                value={fotoRef}
                onChangeText={setFotoRef}
                keyboardType="url"
                autoCapitalize="none"
              />
              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>o</Text>
                <View style={styles.orLine} />
              </View>
              <View style={styles.refBtnsRow}>
                <TouchableOpacity style={styles.refBtn} onPress={seleccionarFotoRef} activeOpacity={0.7}>
                  <Ionicons name="image-outline" size={20} color={Colors.primary} />
                  <Text style={styles.refBtnText}>Galería</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.refBtn} onPress={abrirGuardadas} activeOpacity={0.7}>
                  <Ionicons name="ribbon-outline" size={20} color={Colors.primary} />
                  <Text style={styles.refBtnText}>Guardadas</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleEnviar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Enviar solicitud</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal selector de guardadas */}
      <Modal
        visible={guardadasVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGuardadasVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setGuardadasVisible(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom || 16 }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Mis guardadas</Text>
            <TouchableOpacity onPress={() => setGuardadasVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {loadingGuardadas ? (
            <View style={styles.guardadasCenter}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={guardadas}
              keyExtractor={(item) => String(item.idPublicacion)}
              numColumns={3}
              columnWrapperStyle={{ gap: 2 }}
              ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
              contentContainerStyle={styles.guardadasGrid}
              ListEmptyComponent={
                <Text style={styles.sheetEmpty}>No tienes publicaciones guardadas.</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setFotoRefUri(item.fotoUrl);
                    setFotoRefBase64('');
                    setFotoRef('');
                    setGuardadasVisible(false);
                  }}
                >
                  <Image
                    source={{ uri: item.fotoUrl }}
                    style={styles.guardadaTile}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>

      {/* Modal selector de artista */}
      <Modal
        visible={selectorVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectorVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setSelectorVisible(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom || 16 }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Seleccionar artista que sigas</Text>
            <TouchableOpacity onPress={() => setSelectorVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={artistasSeguidos}
            keyExtractor={(item) => String(item.idUsuario)}
            contentContainerStyle={styles.sheetList}
            ListEmptyComponent={
              <Text style={styles.sheetEmpty}>No sigues a ningún artista.</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.sheetItem}
                activeOpacity={0.7}
                onPress={() => {
                  setArtistaSeleccionado(item);
                  setSelectorVisible(false);
                }}
              >
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.sheetAvatar} />
                ) : (
                  <View style={styles.sheetAvatarPlaceholder}>
                    <Text style={styles.sheetAvatarInitial}>
                      {item.nombre.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetNombre}>
                    {item.nombre}{item.apellidos ? ` ${item.apellidos}` : ''}
                  </Text>
                  <Text style={styles.sheetRol}>Artista</Text>
                </View>
                {artistaSeleccionado?.idUsuario === item.idUsuario && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}
