import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { publicacionesService } from '../../services/publicaciones.service';
import { Colors } from '../../constants/colors';

const ESTILOS = ['blackwork', 'realismo', 'tradicional', 'neo-tradicional', 'acuarela', 'minimalista', 'geométrico', 'japonés', 'tribal', 'otros'];

export default function NuevaPublicacionScreen() {
  const router = useRouter();

  const [imagenUrl, setImagenUrl] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estilo, setEstilo] = useState('');
  const [zonaCuerpo, setZonaCuerpo] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePublicar = async () => {
    if (!imagenUrl.trim()) {
      Alert.alert('Error', 'La URL de la imagen es obligatoria.');
      return;
    }

    try {
      setLoading(true);
      await publicacionesService.crear({
        fotoUrl: imagenUrl.trim(),
        descripcion: descripcion.trim() || undefined,
        estilo: estilo.trim() || undefined,
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
            <Text style={styles.backText}>‹ Cancelar</Text>
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
          {/* Preview de imagen */}
          {imagenUrl.trim() && (
            <Image
              source={{ uri: imagenUrl.trim() }}
              style={styles.preview}
              resizeMode="cover"
            />
          )}

          <Text style={styles.label}>URL de la imagen *</Text>
          <TextInput
            style={styles.input}
            placeholder="https://... (sube antes a Cloudinary u otro servicio)"
            placeholderTextColor={Colors.textMuted}
            value={imagenUrl}
            onChangeText={setImagenUrl}
            keyboardType="url"
            autoCapitalize="none"
          />

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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.estilosRow}>
            {ESTILOS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[styles.estiloBtn, estilo === e && styles.estiloBtnActive]}
                onPress={() => setEstilo(estilo === e ? '' : e)}
              >
                <Text style={[styles.estiloBtnText, estilo === e && styles.estiloBtnTextActive]}>
                  {e}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Zona del cuerpo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: antebrazo, espalda..."
            placeholderTextColor={Colors.textMuted}
            value={zonaCuerpo}
            onChangeText={setZonaCuerpo}
          />

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handlePublicar}
            disabled={loading}
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
  backText: { color: Colors.textSecondary, fontSize: 15, width: 80 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text },
  publishText: { color: Colors.primary, fontSize: 15, fontWeight: '700', width: 80, textAlign: 'right' },
  form: { padding: 16, gap: 6 },
  preview: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginBottom: 8,
  },
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
  estilosRow: { marginBottom: 4 },
  estiloBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    backgroundColor: Colors.surface,
  },
  estiloBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  estiloBtnText: { fontSize: 13, color: Colors.textSecondary },
  estiloBtnTextActive: { color: Colors.white, fontWeight: '700' },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
