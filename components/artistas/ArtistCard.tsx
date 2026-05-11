import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PerfilArtista } from '../../types/usuario.types';
import { useColors } from '../../hooks/useColors';

interface Props {
  artista: PerfilArtista;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 12 * 3) / 2; // 2 columnas con gap

export default function ArtistCard({ artista }: Props) {
  const Colors = useColors();
  const styles = StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: 'center',
      gap: 8,
    },
    avatar: {
      width: 70,
      height: 70,
      borderRadius: 35,
      borderWidth: 2,
      borderColor: Colors.primary,
    },
    avatarPlaceholder: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: Colors.primary,
    },
    avatarInitial: { fontSize: 28, fontWeight: '700', color: Colors.primary },
    nombre: {
      fontSize: 14,
      fontWeight: '700',
      color: Colors.text,
      textAlign: 'center',
    },
    especialidad: {
      fontSize: 11,
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: 15,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    disponibleBadge: {
      backgroundColor: Colors.success + '22',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    disponibleText: { fontSize: 10, color: Colors.success, fontWeight: '700' },
    ocupadoBadge: {
      backgroundColor: Colors.error + '22',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    ocupadoText: { fontSize: 10, color: Colors.error, fontWeight: '700' },
    precio: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
  });

  const router = useRouter();
  const { usuario } = artista;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/artistas/${usuario?.idUsuario}`)}
      activeOpacity={0.85}
    >
      {usuario?.avatar ? (
        <Image source={{ uri: usuario.avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {usuario?.nombre?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
      )}

      <Text style={styles.nombre} numberOfLines={1}>
        {usuario?.nombre ?? 'Artista'}
      </Text>

      {artista.especialidades && (
        <Text style={styles.especialidad} numberOfLines={2}>
          {artista.especialidades}
        </Text>
      )}

      <View style={styles.footer}>
        {artista.disponible ? (
          <View style={styles.disponibleBadge}>
            <Text style={styles.disponibleText}>Disponible</Text>
          </View>
        ) : (
          <View style={styles.ocupadoBadge}>
            <Text style={styles.ocupadoText}>Ocupado</Text>
          </View>
        )}
        {artista.precioHora && (
          <Text style={styles.precio}>{artista.precioHora}€/h</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
