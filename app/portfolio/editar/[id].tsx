import { useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { publicacionesService } from '../../../services/publicaciones.service';
import { Publicacion } from '../../../types/publicacion.types';
import { useColors } from '../../../hooks/useColors';

export default function EditarPublicacionScreen() {
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
    saveText: { color: Colors.primary, fontSize: 15, fontWeight: '700', width: 70, textAlign: 'right' },
    form: { padding: 16, gap: 6 },
    imageWrapper: { position: 'relative', marginBottom: 8 },
    imagePreview: { width: '100%', height: 280, borderRadius: 12, backgroundColor: Colors.surface },
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
      marginTop: 14,
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
    saveBtn: {
      backgroundColor: Colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 16,
    },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  });

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [estilo, setEstilo] = useState('');
  const [zonaCuerpo, setZonaCuerpo] = useState('');
  const [nuevaImagenBase64, setNuevaImagenBase64] = useState<string | null>(null);
  const [nuevaImagenUri, setNuevaImagenUri] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    publicacionesService.getById(Number(id))
      .then((pub) => {
        setPublicacion(pub);
        setDescripcion(pub.descripcion ?? '');
        setEstilo(pub.estilo ?? '');
        setZonaCuerpo(pub.zonaCuerpo ?? '');
      })
      .catch(() => {
        Alert.alert('Error', 'No se pudo cargar la publicación.');
        router.back();
      })
      .finally(() => setLoadingData(false));
  }, [id]);

  const seleccionarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para cambiar la foto.');
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
      setNuevaImagenUri(asset.uri);
      setNuevaImagenBase64(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  const handleGuardar = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await publicacionesService.editar(Number(id), {
        descripcion: descripcion.trim() || undefined,
        estilo: estilo.trim() || undefined,
        zonaCuerpo: zonaCuerpo.trim() || undefined,
        ...(nuevaImagenBase64 ? { fotoUrl: nuevaImagenBase64 } : {}),
      });
      Alert.alert('Guardado', 'La publicación ha sido actualizada.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const imagenMostrada = nuevaImagenUri ?? publicacion?.fotoUrl;

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
          <Text style={styles.title}>Editar publicación</Text>
          <TouchableOpacity onPress={handleGuardar} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.saveText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {imagenMostrada && (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: imagenMostrada }} style={styles.imagePreview} resizeMode="cover" />
            </View>
          )}

          <TouchableOpacity style={styles.changeImageBtn} onPress={seleccionarImagen} activeOpacity={0.7}>
            <Ionicons name="swap-horizontal-outline" size={16} color={Colors.primary} />
            <Text style={styles.changeImageText}>
              {nuevaImagenUri ? 'Cambiar imagen de nuevo' : 'Cambiar imagen'}
            </Text>
          </TouchableOpacity>

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

          <Text style={styles.label}>Estilo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: blackwork, realismo, acuarela..."
            placeholderTextColor={Colors.textMuted}
            value={estilo}
            onChangeText={setEstilo}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Zona del cuerpo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: antebrazo, espalda..."
            placeholderTextColor={Colors.textMuted}
            value={zonaCuerpo}
            onChangeText={setZonaCuerpo}
          />

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleGuardar}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Guardar cambios</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
