import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { publicacionesService } from '../../services/publicaciones.service';
import { useColors } from '../../hooks/useColors';

const { width: SCREEN_W } = Dimensions.get('window');

export default function VerificarPublicacionScreen() {
  const Colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicacionesService.getById(Number(id))
      .then((pub) => setFotoUrl(pub.fotoUrl))
      .catch(() => {
        Alert.alert('Publicación no disponible', 'Es posible que ya haya sido eliminada.');
        router.back();
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C0392B" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: Colors.background }]}>
      <View style={[s.header, { borderBottomColor: Colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: Colors.text }]}>Estado de publicación</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {fotoUrl && (
          <Image
            source={{ uri: fotoUrl }}
            style={{ width: SCREEN_W, height: SCREEN_W }}
            resizeMode="cover"
          />
        )}

        <View style={s.infoCard}>
          <View style={s.iconRow}>
            <View style={s.iconBadge}>
              <Ionicons name="shield-half-outline" size={32} color="#f39c12" />
            </View>
          </View>
          <Text style={[s.title, { color: Colors.text }]}>Pendiente de revisión</Text>
          <Text style={[s.body, { color: Colors.textSecondary }]}>
            Tu imagen no ha superado el filtro automático de contenido. Un administrador la revisará
            y recibirás una notificación con el resultado en los próximos días.
          </Text>
          <View style={[s.divider, { backgroundColor: Colors.border }]} />
          <Text style={[s.hint, { color: Colors.textMuted }]}>
            Si la publicación es aprobada permanecerá visible en el feed. Si no supera la revisión
            será eliminada y serás notificado.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  infoCard: { padding: 24, gap: 12 },
  iconRow: { alignItems: 'center', marginBottom: 4 },
  iconBadge: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(243,156,18,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  divider: { height: 0.5, marginVertical: 4 },
  hint: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
