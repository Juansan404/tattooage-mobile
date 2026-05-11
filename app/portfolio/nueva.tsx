import { useState, useEffect, useRef } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { publicacionesService } from '../../services/publicaciones.service';
import { estilosService } from '../../services/estilos.service';
import { useAuthStore } from '../../store/auth.store';
import { Estilo } from '../../types/estilo.types';
import { useColors } from '../../hooks/useColors';

export default function NuevaPublicacionScreen() {
  const Colors = useColors();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    title: { fontSize: 16, fontWeight: '700', color: Colors.text },
    publishText: { color: Colors.primary, fontSize: 15, fontWeight: '700', width: 70, textAlign: 'right' },
    form: { padding: 16, gap: 6 },
    imagePicker: { borderRadius: 12, overflow: 'hidden' },
    preview: { width: '100%', height: 300, borderRadius: 12, backgroundColor: Colors.surface },
    imagePlaceholder: {
      width: '100%',
      height: 240,
      borderRadius: 12,
      backgroundColor: Colors.surface,
      borderWidth: 2,
      borderColor: Colors.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
    },
    imagePlaceholderText: { color: Colors.textMuted, fontSize: 14 },
    changeImageBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
    },
    changeImageText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
    label: {
      fontSize: 12,
      color: Colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 12,
      marginBottom: 4,
    },
    input: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: Colors.text,
    },
    inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
    /* Selected tags */
    selectedTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    selectedTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    selectedTagText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
    /* Popular chips */
    chipsRow: { marginBottom: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.border,
      marginRight: 8,
      backgroundColor: Colors.surface,
    },
    chipActivo: { backgroundColor: Colors.primary + '33', borderColor: Colors.primary },
    chipText: { fontSize: 13, color: Colors.textSecondary },
    chipTextActivo: { color: Colors.primary, fontWeight: '700' },
    /* Tag input */
    tagInputRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    tagInput: {
      flex: 1,
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      color: Colors.text,
    },
    tagAddBtn: {
      width: 44,
      backgroundColor: Colors.primary,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tagAddBtnDisabled: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    submitBtn: {
      backgroundColor: Colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 16,
    },
    submitBtnDisabled: { opacity: 0.4 },
    submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  });

  const router = useRouter();
  const { idUsuario, rol } = useAuthStore();

  useEffect(() => {
    if (rol && rol !== 'ARTISTA' && rol !== 'ADMIN') {
      router.replace('/(tabs)/feed');
    }
  }, [rol]);

  const [imagenUri, setImagenUri] = useState('');
  const [imagenBase64, setImagenBase64] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [zonaCuerpo, setZonaCuerpo] = useState('');
  const [loading, setLoading] = useState(false);

  const [popularStyles, setPopularStyles] = useState<Estilo[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<TextInput>(null);

  useEffect(() => {
    estilosService.getTop()
      .then(setPopularStyles)
      .catch(() => setPopularStyles([]));
  }, []);

  const toggleEstilo = (nombre: string) => {
    setSeleccionados(prev =>
      prev.includes(nombre) ? prev.filter(e => e !== nombre) : [...prev, nombre]
    );
  };

  const agregarTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    if (!seleccionados.includes(tag)) {
      setSeleccionados(prev => [...prev, tag]);
    }
    setTagInput('');
  };

  const quitarTag = (nombre: string) => {
    setSeleccionados(prev => prev.filter(e => e !== nombre));
  };

  const seleccionarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para subir fotos.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!resultado.canceled && resultado.assets[0]) {
      const asset = resultado.assets[0];
      setImagenUri(asset.uri);
      setImagenBase64(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  const handlePublicar = async () => {
    if (!imagenBase64) {
      Alert.alert('Error', 'Selecciona una imagen antes de publicar.');
      return;
    }
    try {
      setLoading(true);
      await publicacionesService.crear({
        usuario: idUsuario ? { idUsuario } : undefined,
        fotoUrl: imagenBase64,
        descripcion: descripcion.trim() || undefined,
        estilos: seleccionados.length > 0 ? seleccionados : undefined,
        zonaCuerpo: zonaCuerpo.trim() || undefined,
      });
      Alert.alert('¡Publicado!', 'Tu trabajo ya está visible en el feed.', [
        { text: 'Ver feed', onPress: () => router.replace('/(tabs)/feed') },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo publicar. Inténtalo más tarde.');
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
            <Ionicons name="chevron-back" size={26} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Nueva publicación</Text>
          <TouchableOpacity onPress={handlePublicar} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.publishText}>Publicar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {/* Selector de imagen */}
          <TouchableOpacity style={styles.imagePicker} onPress={seleccionarImagen} activeOpacity={0.8}>
            {imagenUri ? (
              <Image source={{ uri: imagenUri }} style={styles.preview} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.imagePlaceholderText}>Toca para seleccionar una foto</Text>
              </View>
            )}
          </TouchableOpacity>

          {imagenUri && (
            <TouchableOpacity style={styles.changeImageBtn} onPress={seleccionarImagen}>
              <Ionicons name="swap-horizontal-outline" size={16} color={Colors.primary} />
              <Text style={styles.changeImageText}>Cambiar imagen</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Cuéntanos sobre este trabajo..."
            placeholderTextColor={Colors.textMuted}
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* ── Estilos ── */}
          <Text style={styles.label}>Estilos</Text>

          {/* Tags ya seleccionados */}
          {seleccionados.length > 0 && (
            <View style={styles.selectedTags}>
              {seleccionados.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={styles.selectedTag}
                  onPress={() => quitarTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectedTagText}>{tag}</Text>
                  <Ionicons name="close" size={13} color={Colors.white} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Chips populares */}
          {popularStyles.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              {popularStyles.map(e => {
                const activo = seleccionados.includes(e.nombre);
                return (
                  <TouchableOpacity
                    key={e.idEstilo}
                    style={[styles.chip, activo && styles.chipActivo]}
                    onPress={() => toggleEstilo(e.nombre)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, activo && styles.chipTextActivo]}>{e.nombre}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Input para estilo personalizado */}
          <View style={styles.tagInputRow}>
            <TextInput
              ref={tagInputRef}
              style={styles.tagInput}
              placeholder="Añadir estilo personalizado..."
              placeholderTextColor={Colors.textMuted}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={agregarTag}
              returnKeyType="done"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.tagAddBtn, !tagInput.trim() && styles.tagAddBtnDisabled]}
              onPress={agregarTag}
              disabled={!tagInput.trim()}
            >
              <Ionicons name="add" size={20} color={tagInput.trim() ? Colors.white : Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Zona del cuerpo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: antebrazo, espalda..."
            placeholderTextColor={Colors.textMuted}
            value={zonaCuerpo}
            onChangeText={setZonaCuerpo}
          />

          <TouchableOpacity
            style={[styles.submitBtn, (!imagenBase64 || loading) && styles.submitBtnDisabled]}
            onPress={handlePublicar}
            disabled={!imagenBase64 || loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Publicar en el feed</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
