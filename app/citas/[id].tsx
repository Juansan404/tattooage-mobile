import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { citasService } from '../../services/citas.service';
import { Cita, EstadoCita } from '../../types/cita.types';
import { useAuthStore } from '../../store/auth.store';
import { useColors } from '../../hooks/useColors';

export default function DetalleCitaScreen() {
  const Colors = useColors();
  const ESTADO_COLORS: Record<EstadoCita, string> = {
    Pendiente: Colors.warning,
    Confirmada: Colors.success,
    Cancelada: Colors.error,
    Completada: Colors.textSecondary,
  };
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    title: { fontSize: 17, fontWeight: '700', color: Colors.text },
    content: { padding: 16, gap: 14 },
    estadoBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 8,
    },
    estadoText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      gap: 6,
    },
    cardLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: Colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    cardValue: { fontSize: 16, fontWeight: '600', color: Colors.text },
    cardValueSmall: { fontSize: 14, color: Colors.textSecondary },
    cardRow: { fontSize: 14, color: Colors.textSecondary },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text,
      marginTop: 4,
    },
    group: { gap: 6 },
    label: {
      fontSize: 12,
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
    inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
    row: { flexDirection: 'row', gap: 12 },
    saveBtn: {
      backgroundColor: Colors.primary,
      borderRadius: 10,
      paddingVertical: 13,
      alignItems: 'center',
    },
    saveBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
    stateRow: { flexDirection: 'row', gap: 10 },
    stateBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
    },
    stateBtnText: { fontWeight: '700', fontSize: 13 },
    cancelBtn: {
      backgroundColor: Colors.error + '22',
      borderWidth: 1,
      borderColor: Colors.error,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    cancelBtnText: { color: Colors.error, fontSize: 15, fontWeight: '700' },
    hint: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  });

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { rol } = useAuthStore();

  const [cita, setCita] = useState<Cita | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Campos del formulario de edición (artista)
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [duracion, setDuracion] = useState('');
  const [precio, setPrecio] = useState('');
  const [sala, setSala] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await citasService.getById(Number(id));
        setCita(data);
        setFecha(data.fechaCita ?? '');
        setHora(data.horaInicio ?? '');
        setDuracion(data.duracionAproximada != null ? String(data.duracionAproximada) : '');
        setPrecio(data.precio != null ? String(data.precio) : '');
        setSala(data.sala ?? '');
        setNotas(data.notas ?? '');
      } catch {
        Alert.alert('Error', 'No se pudo cargar la cita.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id]);

  const handleGuardar = async () => {
    if (!fecha.trim()) {
      Alert.alert('Campo requerido', 'La fecha es obligatoria.');
      return;
    }
    setGuardando(true);
    try {
      const actualizada = await citasService.actualizar(Number(id), {
        fechaCita: fecha.trim(),
        horaInicio: hora.trim() || undefined,
        duracionAproximada: duracion ? Number(duracion) : undefined,
        precio: precio ? Number(precio) : undefined,
        sala: sala.trim() || undefined,
        notas: notas.trim() || undefined,
      });
      setCita(actualizada);
      Alert.alert('Guardado', 'Los cambios se han guardado correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstado = (nuevoEstado: EstadoCita) => {
    Alert.alert(
      'Cambiar estado',
      `¿Marcar esta cita como ${nuevoEstado}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const actualizada = await citasService.cambiarEstado(Number(id), nuevoEstado);
              setCita(actualizada);
            } catch {
              Alert.alert('Error', 'No se pudo cambiar el estado.');
            }
          },
        },
      ]
    );
  };

  const handleCancelar = () => {
    Alert.alert('Cancelar cita', '¿Seguro que quieres cancelar esta cita?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await citasService.cambiarEstado(Number(id), 'Cancelada');
            const actualizada = await citasService.getById(Number(id));
            setCita(actualizada);
          } catch {
            Alert.alert('Error', 'No se pudo cancelar la cita.');
          }
        },
      },
    ]);
  };

  if (loading || !cita) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const esArtista = rol === 'ARTISTA';
  const editable = cita.estado !== 'Cancelada' && cita.estado !== 'Completada';

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
          <Text style={styles.title}>Detalle de cita</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Estado */}
          <View style={[styles.estadoBadge, { backgroundColor: ESTADO_COLORS[cita.estado] + '22' }]}>
            <Text style={[styles.estadoText, { color: ESTADO_COLORS[cita.estado] }]}>
              {cita.estado}
            </Text>
          </View>

          {/* Participante */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>
              {esArtista ? 'Cliente' : 'Artista'}
            </Text>
            <Text style={styles.cardValue}>
              {esArtista
                ? (cita.cliente?.nombre ?? 'Cliente')
                : (cita.artista?.nombre ?? 'Artista')}
            </Text>
          </View>

          {/* Formulario de edición (artista) o vista (cliente) */}
          {esArtista && editable ? (
            <>
              <Text style={styles.sectionTitle}>Editar cita</Text>

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
                <Text style={styles.hint}>Formato: AAAA-MM-DD</Text>
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
                  <Text style={styles.label}>Sala</Text>
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
                <Text style={styles.label}>Notas</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Instrucciones, preparación..."
                  placeholderTextColor={Colors.textMuted}
                  value={notas}
                  onChangeText={setNotas}
                  multiline
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, guardando && { opacity: 0.7 }]}
                onPress={handleGuardar}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar cambios</Text>
                )}
              </TouchableOpacity>

              {/* Cambiar estado */}
              <Text style={styles.sectionTitle}>Cambiar estado</Text>
              <View style={styles.stateRow}>
                {cita.estado === 'Pendiente' && (
                  <TouchableOpacity
                    style={[styles.stateBtn, { backgroundColor: Colors.success + '22', borderColor: Colors.success }]}
                    onPress={() => handleCambiarEstado('Confirmada')}
                  >
                    <Text style={[styles.stateBtnText, { color: Colors.success }]}>Confirmar</Text>
                  </TouchableOpacity>
                )}
                {(cita.estado === 'Pendiente' || cita.estado === 'Confirmada') && (
                  <TouchableOpacity
                    style={[styles.stateBtn, { backgroundColor: Colors.textSecondary + '22', borderColor: Colors.textSecondary }]}
                    onPress={() => handleCambiarEstado('Completada')}
                  >
                    <Text style={[styles.stateBtnText, { color: Colors.textSecondary }]}>Completada</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            /* Vista solo lectura (cliente o cita cerrada) */
            <>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Fecha</Text>
                <Text style={styles.cardValue}>
                  {cita.fechaCita
                    ? new Date(cita.fechaCita).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Fecha pendiente'}
                </Text>
                {cita.horaInicio && (
                  <Text style={styles.cardValueSmall}>
                    {cita.horaInicio}
                    {cita.duracionAproximada ? `  ·  ${cita.duracionAproximada} min` : ''}
                  </Text>
                )}
              </View>

              {(cita.sala || cita.precio || cita.notas) && (
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>Detalles</Text>
                  {cita.sala && <Text style={styles.cardRow}>Sala: {cita.sala}</Text>}
                  {cita.precio && <Text style={styles.cardRow}>Precio: {cita.precio}€</Text>}
                  {cita.notas && <Text style={styles.cardRow}>{cita.notas}</Text>}
                </View>
              )}
            </>
          )}

          {/* Cancelar (ambos roles, si la cita está activa) */}
          {editable && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelar}>
              <Text style={styles.cancelBtnText}>Cancelar cita</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
