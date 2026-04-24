import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { citasService } from '../../services/citas.service';
import { Cita, EstadoCita } from '../../types/cita.types';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';

const ESTADO_COLORS: Record<EstadoCita, string> = {
  Pendiente: Colors.warning,
  Confirmada: Colors.success,
  Cancelada: Colors.error,
  Completada: Colors.textSecondary,
};

export default function DetalleCitaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { rol } = useAuthStore();

  const [cita, setCita] = useState<Cita | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await citasService.getById(Number(id));
        setCita(data);
      } catch {
        Alert.alert('Error', 'No se pudo cargar la cita.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id]);

  const handleCancelar = () => {
    Alert.alert('Cancelar cita', '¿Seguro que quieres cancelar esta cita?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await citasService.cancelar(Number(id));
            router.back();
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Detalle de cita</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Estado */}
        <View style={[styles.estadoBadge, { backgroundColor: ESTADO_COLORS[cita.estado] + '22' }]}>
          <Text style={[styles.estadoText, { color: ESTADO_COLORS[cita.estado] }]}>
            {cita.estado}
          </Text>
        </View>

        {/* Fecha y hora */}
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
              🕐 {cita.horaInicio}
              {cita.duracionAproximada ? `  ·  ${cita.duracionAproximada} min` : ''}
            </Text>
          )}
        </View>

        {/* Participantes */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            {rol === 'ARTISTA' ? 'Cliente' : 'Artista'}
          </Text>
          <Text style={styles.cardValue}>
            {rol === 'ARTISTA'
              ? (cita.cliente?.nombre ?? 'Cliente')
              : (cita.artista?.nombre ?? 'Artista')}
          </Text>
        </View>

        {/* Detalles adicionales */}
        {(cita.sala || cita.precio || cita.notas) && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Detalles</Text>
            {cita.sala && (
              <Text style={styles.cardRow}>📍 Sala: {cita.sala}</Text>
            )}
            {cita.precio && (
              <Text style={styles.cardRow}>💶 Precio estimado: {cita.precio}€</Text>
            )}
            {cita.notas && (
              <Text style={styles.cardRow}>📝 {cita.notas}</Text>
            )}
          </View>
        )}

        {/* Cancelar */}
        {(cita.estado === 'Pendiente' || cita.estado === 'Confirmada') && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelar}>
            <Text style={styles.cancelBtnText}>Cancelar cita</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
  backText: { color: Colors.primary, fontSize: 16, fontWeight: '600', width: 60 },
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
});
