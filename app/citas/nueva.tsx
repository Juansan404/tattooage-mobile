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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { citasService } from '../../services/citas.service';
import { useColors } from '../../hooks/useColors';
import { useThemeStore } from '../../store/theme.store';

export default function NuevaCitaScreen() {
  const Colors = useColors();
  const isDark = useThemeStore((s) => s.isDark);
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
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
    pickerBtn: {
      backgroundColor: Colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: 14,
      paddingVertical: 13,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    pickerBtnText: { fontSize: 15, color: Colors.text, flex: 1 },
    pickerBtnPlaceholder: { fontSize: 15, color: Colors.textMuted, flex: 1 },
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
    submitBtn: {
      backgroundColor: Colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  });

  const { clienteId, artistaId } = useLocalSearchParams<{
    solicitudId: string;
    clienteId: string;
    artistaId: string;
  }>();
  const router = useRouter();

  const [fecha, setFecha] = useState<Date | null>(null);
  const [hora, setHora] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [duracion, setDuracion] = useState('');
  const [precio, setPrecio] = useState('');
  const [sala, setSala] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) setFecha(selected);
  };

  const onTimeChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selected) setHora(selected);
  };

  const formatFecha = (d: Date) =>
    d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  const formatHora = (d: Date) =>
    d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const toISOFecha = (d: Date) => d.toISOString().split('T')[0];

  const toISOHora = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const handleSubmit = async () => {
    if (!fecha) {
      Alert.alert('Campo requerido', 'La fecha de la cita es obligatoria.');
      return;
    }
    setEnviando(true);
    try {
      await citasService.crear({
        cliente: { idUsuario: Number(clienteId) },
        artista: { idUsuario: Number(artistaId) },
        fechaCita: toISOFecha(fecha),
        horaInicio: hora ? toISOHora(hora) : undefined,
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

          {/* Fecha */}
          <View style={styles.group}>
            <Text style={styles.label}>Fecha *</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
              {fecha ? (
                <Text style={styles.pickerBtnText}>{formatFecha(fecha)}</Text>
              ) : (
                <Text style={styles.pickerBtnPlaceholder}>Selecciona una fecha</Text>
              )}
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={fecha ?? new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                themeVariant={isDark ? 'dark' : 'light'}
                accentColor={Colors.primary}
                textColor={Colors.text}
                onChange={onDateChange}
              />
            )}
          </View>

          {/* Hora */}
          <View style={styles.group}>
            <Text style={styles.label}>Hora inicio</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={18} color={Colors.textMuted} />
              {hora ? (
                <Text style={styles.pickerBtnText}>{formatHora(hora)}</Text>
              ) : (
                <Text style={styles.pickerBtnPlaceholder}>Selecciona una hora</Text>
              )}
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={hora ?? new Date()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                is24Hour
                themeVariant={isDark ? 'dark' : 'light'}
                accentColor={Colors.primary}
                textColor={Colors.text}
                onChange={onTimeChange}
              />
            )}
          </View>

          {/* Duración y precio */}
          <View style={styles.row}>
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
          </View>

          {/* Sala */}
          <View style={styles.group}>
            <Text style={styles.label}>Sala / Ubicación</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Sala 1"
              placeholderTextColor={Colors.textMuted}
              value={sala}
              onChangeText={setSala}
            />
          </View>

          {/* Notas */}
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
