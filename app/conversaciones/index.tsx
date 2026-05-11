import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { conversacionesService } from '../../services/conversaciones.service';
import { Conversacion } from '../../types/conversacion.types';
import { useAuthStore } from '../../store/auth.store';
import { useColors } from '../../hooks/useColors';

export default function ConversacionesScreen() {
  const Colors = useColors();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 10 },
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
    convItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: Colors.primary },
    avatarPlaceholder: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1.5, borderColor: Colors.primary,
    },
    avatarInitial: { fontSize: 20, fontWeight: '700', color: Colors.primary },
    convInfo: { flex: 1, gap: 2 },
    convRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    convName: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
    convTime: { fontSize: 11, color: Colors.textMuted },
    convRol: { fontSize: 12, color: Colors.textMuted },
    separator: { height: 0.5, backgroundColor: Colors.border, marginLeft: 80 },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
    emptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  });

  const router = useRouter();
  const { idUsuario } = useAuthStore();
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [loading, setLoading] = useState(true);

  const handleEliminar = (idConversacion: number, nombre: string) => {
    Alert.alert(
      'Eliminar conversación',
      `¿Borrar la conversación con ${nombre}? Se eliminarán todos los mensajes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await conversacionesService.eliminar(idConversacion);
              setConversaciones((prev) => prev.filter((c) => c.idConversacion !== idConversacion));
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la conversación.');
            }
          },
        },
      ]
    );
  };

  const cargar = useCallback(async () => {
    if (!idUsuario) return;
    try {
      const data = await conversacionesService.getByUsuario(idUsuario);
      setConversaciones(data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [idUsuario]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const getOtroUsuario = (conv: Conversacion) => {
    return conv.usuario1?.idUsuario === idUsuario ? conv.usuario2 : conv.usuario1;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Ayer';
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mensajes</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversaciones}
          keyExtractor={(item) => String(item.idConversacion)}
          renderItem={({ item }) => {
            const otro = getOtroUsuario(item);
            return (
              <TouchableOpacity
                style={styles.convItem}
                onPress={() => router.push(`/conversaciones/${item.idConversacion}`)}
                onLongPress={() => handleEliminar(item.idConversacion, otro?.nombre ?? 'este usuario')}
                activeOpacity={0.75}
              >
                {otro?.avatar ? (
                  <Image source={{ uri: otro.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {otro?.nombre?.charAt(0).toUpperCase() ?? '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.convInfo}>
                  <View style={styles.convRow}>
                    <Text style={styles.convName} numberOfLines={1}>
                      {otro?.nombre} {otro?.apellidos}
                    </Text>
                    <Text style={styles.convTime}>{formatTime(item.creadoEn)}</Text>
                  </View>
                  <Text style={styles.convRol}>{otro?.rol}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="chatbubble-outline" size={56} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Sin conversaciones</Text>
              <Text style={styles.emptySub}>
                Ve al perfil de un usuario y pulsa "Mensaje" para empezar.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
