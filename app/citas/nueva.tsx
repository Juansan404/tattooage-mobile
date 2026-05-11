import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { citasService } from '../../services/citas.service';
import { useColors } from '../../hooks/useColors';

export default function NuevaCitaScreen() {
  const Colors = useColors();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      gap: 12,
    },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.text },
    content: { padding: 16, gap: 16 },
    group: { gap: 6 },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: Colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    input: {
      backgroundColor: Colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: Colors.text,
    },
    inputMultiline: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    row: { flexDirection: 'row', gap: 12 },
    hint: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    submitBtn: {
      backgroundColor: Colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  });

  const { solicitudId, clienteId, artistaId } = useLocalSearchParams<{
    solicitudId: string;
    clienteId: string;
    artistaId: string;
  }>();
  const router = useRouter();

  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [duracion, setDuracion] = useState('');
  const [precio, setPrecio] = useState('');
  const [sala, setSala] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async () => {
    if (!fecha.trim()) {
      Alert.alert('Campo requerido', 'La fecha de la cita es obligatoria.');
      return;
    }

    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha.trim())) {
      Alert.alert('Formato incorrecto', 'La fecha debe tener el formato AAAA-MM-DD (ej: 2025-06-15).');
      return;
    }

    setEnviando(true);
    try {
      await citasService.crear({
        cliente: { idUsuario: Number(clienteId) },
        artista: { idUsuario: Number(artistaId) },
        fechaCita: fecha.trim(),
        horaInicio: hora.trim() || undefined,
        duracionAproximada: duracion ? Number(duracion) : undefined,
        precio: precio ? Number(precio) : undefined,
        sala: sala.trim() || undefined,
        notas: notas.trim() || undefined,
      });

      Alert.alert('Cita programada', 'La cita ha sido creada correctamente.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/solicitudes') },
      ]);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status >= 500) {
        router.replace('/(tabs)/solicitudes');
      } else if (status === 401 || status === 403) {
        Alert.alert('Sesión expirada', 'Cierra sesión y vuelve a entrar para continuar.');
      } else {
        Alert.alert('Error', 'No se pudo crear la cita. Inténtalo de nuevo.');
      }
    } finally {
      setEnviando(false);
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
          <Text style={styles.headerTitle}>Programar cita</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.group}>
            <Text style={styles.label}>Fecha *</Text>
            <TextInput
              style={styles.input}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={Colors.textMuted}
              value={fecha}
              onChangeText={setFecha}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <Text style={styles.hint}>Ejemplo: 2025-06-15</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.group, { flex: 1 }]}>
              <Text style={styles.label}>Hora inicio</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                placeholderTextColor={Colors.textMuted}
                value={hora}
                onChangeText={setHora}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
            <View style={[styles.group, { flex: 1 }]}>
              <Text style={styles.label}>Duración (min)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 120"
                placeholderTextColor={Colors.textMuted}
                value={duracion}
                onChangeText={setDuracion}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.group, { flex: 1 }]}>
              <Text style={styles.label}>Precio (€)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 150"
                placeholderTextColor={Colors.textMuted}
                value={precio}
                onChangeText={setPrecio}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.group, { flex: 1 }]}>
              <Text style={styles.label}>Sala / Ubicación</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Sala 1"
                placeholderTextColor={Colors.textMuted}
                value={sala}
                onChangeText={setSala}
              />
            </View>
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Notas para el cliente</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Instrucciones previas, preparación..."
              placeholderTextColor={Colors.textMuted}
              value={notas}
              onChangeText={setNotas}
              multiline
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, enviando && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={enviando}
          >
            {enviando ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Crear cita</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
