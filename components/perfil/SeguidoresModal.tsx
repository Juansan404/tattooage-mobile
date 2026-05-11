import { useEffect, useState } from 'react';
import {
  Modal, View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { artistasService } from '../../services/artistas.service';
import { Usuario } from '../../types/usuario.types';
import { useColors } from '../../hooks/useColors';

interface Props {
  idUsuario: number | null;
  tipo: 'seguidores' | 'seguidos';
  onClose: () => void;
  onNavigate: (idUsuario: number) => void;
}

export default function SeguidoresModal({ idUsuario, tipo, onClose, onNavigate }: Props) {
  const Colors = useColors();
  const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: {
      backgroundColor: Colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: '70%',
      borderTopWidth: 0.5,
      borderColor: Colors.border,
    },
    handleBar: {
      width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2,
      alignSelf: 'center', marginTop: 10, marginBottom: 4,
    },
    titleRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 0.5, borderBottomColor: Colors.border,
    },
    title: { fontSize: 15, fontWeight: '700', color: Colors.text },
    closeBtn: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },
    center: { paddingVertical: 32, alignItems: 'center' },
    listContent: { paddingVertical: 8 },
    emptyText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 24, paddingHorizontal: 16 },
    userRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingVertical: 10,
    },
    avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: Colors.primary },
    avatarPlaceholder: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1.5, borderColor: Colors.primary,
    },
    avatarInitial: { fontSize: 17, fontWeight: '700', color: Colors.primary },
    userInfo: { flex: 1, gap: 2 },
    userName: { fontSize: 14, fontWeight: '600', color: Colors.text },
    userRol: { fontSize: 11, color: Colors.textMuted },
  });

  const insets = useSafeAreaInsets();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);

  const visible = idUsuario !== null;

  useEffect(() => {
    if (!idUsuario) return;
    setLoading(true);
    setUsuarios([]);
    const fetch = tipo === 'seguidores'
      ? artistasService.getSeguidores(idUsuario)
      : artistasService.getSeguidos(idUsuario);
    fetch
      .then(setUsuarios)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [idUsuario, tipo]);

  const titulo = tipo === 'seguidores' ? 'Seguidores' : 'Siguiendo';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: insets.bottom || 12 }]}>
        <View style={styles.handleBar} />

        <View style={styles.titleRow}>
          <Text style={styles.title}>{titulo}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={usuarios}
            keyExtractor={(item) => String(item.idUsuario)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay {titulo.toLowerCase()} aún.</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.userRow}
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  onNavigate(item.idUsuario);
                }}
              >
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {item.nombre?.charAt(0).toUpperCase() ?? '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.nombre} {item.apellidos}</Text>
                  <Text style={styles.userRol}>{item.rol}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}
