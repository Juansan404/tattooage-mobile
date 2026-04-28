import { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { solicitudesService } from '../../services/solicitudes.service';
import { useAuthStore } from '../../store/auth.store';
import { Colors } from '../../constants/colors';

export default function NuevaSolicitudScreen() {
  const router = useRouter();
  const { artistaId } = useLocalSearchParams<{ artistaId: string }>();
  const { idUsuario } = useAuthStore();

  const [descripcion, setDescripcion] = useState('');
  const [zonaCuerpo, setZonaCuerpo] = useState('');
  const [tamano, setTamano] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [fotoRef, setFotoRef] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnviar = async () => {
    if (!artistaId || !descripcion.trim() || !idUsuario) {
      Alert.alert('Error', 'La descripción del tatuaje es obligatoria.');
      return;
    }

    try {
      setLoading(true);
      const solicitud = await solicitudesService.crear({
        cliente: { idUsuario },
        artista: { idUsuario: Number(artistaId) },
        descripcion: descripcion.trim(),
        zonaCuerpo: zonaCuerpo.trim() || undefined,
        tamano: tamano.trim() || undefined,
        presupuestoAprox: presupuesto ? Number(presupuesto) : undefined,
        fotoReferencia: fotoRef.trim() || undefined,
      });
      Alert.alert(
        '¡Solicitud enviada!',
        'El artista revisará tu solicitud y te responderá pronto.',
        [{ text: 'Ver solicitud', onPress: () => router.replace(`/solicitudes/${solicitud.idSolicitud}`) }]
      );
    } catch {
      Alert.alert('Error', 'No se pudo enviar la solicitud. Inténtalo más tarde.');
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
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Descripción del tatuaje *</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Describe el tatuaje que quieres: tema, referencias, estilo..."
            placeholderTextColor={Colors.textMuted}
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={4}
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

          <Text style={styles.label}>URL imagen de referencia</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor={Colors.textMuted}
            value={fotoRef}
            onChangeText={setFotoRef}
            keyboardType="url"
            autoCapitalize="none"
          />

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
  backText: { color: Colors.primary, fontSize: 16, fontWeight: '600', width: 60 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  form: { padding: 20, gap: 6 },
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
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 16,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
