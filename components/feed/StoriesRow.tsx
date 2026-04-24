import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { artistasService } from '../../services/artistas.service';
import { PerfilArtista } from '../../types/usuario.types';
import { Colors } from '../../constants/colors';

export default function StoriesRow() {
  const { idUsuario } = useAuthStore();
  const [artistas, setArtistas] = useState<PerfilArtista[]>([]);

  useEffect(() => {
    artistasService.getAll().then(setArtistas).catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Tu historia */}
        <TouchableOpacity style={styles.item} activeOpacity={0.8}>
          <View style={styles.addRingOuter}>
            <View style={styles.addRingInner}>
              <View style={styles.addAvatarPlaceholder}>
                <Text style={styles.addIcon}>+</Text>
              </View>
            </View>
          </View>
          <Text style={styles.label} numberOfLines={1}>Tu historia</Text>
        </TouchableOpacity>

        {artistas.map((a) => (
          <TouchableOpacity key={a.idPerfil} style={styles.item} activeOpacity={0.8}>
            <View style={styles.storyRing}>
              {a.usuario?.avatar ? (
                <Image source={{ uri: a.usuario.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {a.usuario?.nombre?.charAt(0).toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {a.usuario?.nombre?.split(' ')[0] ?? 'Artista'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const AVATAR_SIZE = 62;
const RING_SIZE = AVATAR_SIZE + 6;

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 16,
  },
  item: {
    alignItems: 'center',
    gap: 5,
    width: 72,
  },
  /* Ring with gradient-like effect using nested Views */
  storyRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    padding: 2.5,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
  },
  /* "Tu historia" con icono + */
  addRingOuter: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addRingInner: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAvatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 28,
    color: Colors.primary,
    fontWeight: '300',
    lineHeight: 32,
  },
  label: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 68,
  },
});
