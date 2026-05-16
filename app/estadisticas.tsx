import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import { artistasService } from '../services/artistas.service';
import { publicacionesService } from '../services/publicaciones.service';
import { solicitudesService } from '../services/solicitudes.service';
import { citasService } from '../services/citas.service';
import { useColors } from '../hooks/useColors';
import { useTranslation } from '../hooks/useTranslation';

interface Stats {
  publicaciones: number;
  likesTotales: number;
  seguidores: number;
  seguidos: number;
  solicitudesTotal: number;
  solicitudesPendientes: number;
  solicitudesAceptadas: number;
  citasTotal: number;
  citasCompletadas: number;
}

export default function EstadisticasScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: Colors.border,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    scroll: { padding: 16, gap: 12 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: Colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginTop: 8,
      marginBottom: 4,
    },
    row: { flexDirection: 'row', gap: 12 },
    card: {
      flex: 1,
      backgroundColor: Colors.surface,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      gap: 6,
      borderWidth: 0.5,
      borderColor: Colors.border,
    },
    cardAccent: {
      backgroundColor: Colors.primary + '14',
      borderColor: Colors.primary + '44',
    },
    cardNumber: { fontSize: 28, fontWeight: '800', color: Colors.text },
    cardNumberAccent: { color: Colors.primary },
    cardLabel: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
    divider: { height: 0.5, backgroundColor: Colors.border, marginVertical: 4 },
  });

  const router = useRouter();
  const { idUsuario } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idUsuario) return;
    Promise.all([
      artistasService.getPortfolio(idUsuario),
      artistasService.getContadores(idUsuario),
      solicitudesService.getMias(idUsuario, 'ARTISTA'),
      citasService.getMias(idUsuario, 'ARTISTA'),
    ]).then(([portfolio, contadores, solicitudes, citas]) => {
      const likesTotales = portfolio.reduce((sum, p) => sum + (p.likesCount ?? 0), 0);
      setStats({
        publicaciones: portfolio.length,
        likesTotales,
        seguidores: contadores.seguidores,
        seguidos: contadores.seguidos,
        solicitudesTotal: solicitudes.length,
        solicitudesPendientes: solicitudes.filter((s) => s.estado === 'Pendiente').length,
        solicitudesAceptadas: solicitudes.filter((s) => s.estado === 'Aceptada').length,
        citasTotal: citas.length,
        citasCompletadas: citas.filter((c) => c.estado === 'Completada').length,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [idUsuario]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('stats_title')}</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : !stats ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={{ color: Colors.textMuted }}>{t('stats_error')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <Text style={styles.sectionTitle}>{t('stats_posts')}</Text>
          <View style={styles.row}>
            <View style={[styles.card, styles.cardAccent]}>
              <Ionicons name="images-outline" size={22} color={Colors.primary} />
              <Text style={[styles.cardNumber, styles.cardNumberAccent]}>{stats.publicaciones}</Text>
              <Text style={styles.cardLabel}>{t('stats_posts_label')}</Text>
            </View>
            <View style={[styles.card, styles.cardAccent]}>
              <Ionicons name="heart-outline" size={22} color={Colors.primary} />
              <Text style={[styles.cardNumber, styles.cardNumberAccent]}>{stats.likesTotales.toLocaleString('es-ES')}</Text>
              <Text style={styles.cardLabel}>{t('stats_likes')}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t('stats_community')}</Text>
          <View style={styles.row}>
            <View style={styles.card}>
              <Ionicons name="people-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.cardNumber}>{stats.seguidores}</Text>
              <Text style={styles.cardLabel}>{t('stats_followers')}</Text>
            </View>
            <View style={styles.card}>
              <Ionicons name="person-add-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.cardNumber}>{stats.seguidos}</Text>
              <Text style={styles.cardLabel}>{t('stats_following')}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t('stats_requests')}</Text>
          <View style={styles.row}>
            <View style={styles.card}>
              <Ionicons name="mail-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.cardNumber}>{stats.solicitudesTotal}</Text>
              <Text style={styles.cardLabel}>{t('stats_total')}</Text>
            </View>
            <View style={styles.card}>
              <Ionicons name="time-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.cardNumber}>{stats.solicitudesPendientes}</Text>
              <Text style={styles.cardLabel}>{t('stats_pending')}</Text>
            </View>
            <View style={styles.card}>
              <Ionicons name="checkmark-circle-outline" size={22} color={Colors.success} />
              <Text style={[styles.cardNumber, { color: Colors.success }]}>{stats.solicitudesAceptadas}</Text>
              <Text style={styles.cardLabel}>{t('stats_accepted')}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t('stats_appointments')}</Text>
          <View style={styles.row}>
            <View style={styles.card}>
              <Ionicons name="calendar-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.cardNumber}>{stats.citasTotal}</Text>
              <Text style={styles.cardLabel}>{t('stats_total')}</Text>
            </View>
            <View style={[styles.card, stats.citasCompletadas > 0 && styles.cardAccent]}>
              <Ionicons name="ribbon-outline" size={22} color={stats.citasCompletadas > 0 ? Colors.primary : Colors.textSecondary} />
              <Text style={[styles.cardNumber, stats.citasCompletadas > 0 && styles.cardNumberAccent]}>
                {stats.citasCompletadas}
              </Text>
              <Text style={styles.cardLabel}>{t('stats_completed')}</Text>
            </View>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}
