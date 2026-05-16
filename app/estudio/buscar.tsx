import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { estudiosService } from '../../services/estudios.service';
import { Estudio } from '../../types/usuario.types';
import { useAuthStore } from '../../store/auth.store';
import { useColors } from '../../hooks/useColors';

export default function BuscarEstudioScreen() {
  const Colors = useColors();
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
      backgroundColor: Colors.background,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: Colors.surface,
      borderRadius: 10,
      borderWidth: 0.5,
      borderColor: Colors.border,
      gap: 8,
    },
    searchInput: { flex: 1, fontSize: 15, color: Colors.text, padding: 0 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    iconBox: {
      width: 46,
      height: 46,
      borderRadius: 10,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    info: { flex: 1, gap: 2 },
    nombre: { fontSize: 15, fontWeight: '700', color: Colors.text },
    sub: { fontSize: 12, color: Colors.textMuted },
    joinBtn: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 8,
    },
    joinText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
    separator: { height: 0.5, backgroundColor: Colors.border, marginLeft: 74 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 10 },
    emptyText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' },
  });

  const router = useRouter();
  const { idUsuario } = useAuthStore();
  const [todos, setTodos] = useState<Estudio[]>([]);
  const [filtrados, setFiltrados] = useState<Estudio[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [uniendose, setUniendose] = useState<number | null>(null);

  useEffect(() => {
    estudiosService.getAll()
      .then(data => { setTodos(data); setFiltrados(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = busqueda.toLowerCase().trim();
    setFiltrados(
      q ? todos.filter(e =>
        e.nombre.toLowerCase().includes(q) ||
        (e.ciudad ?? '').toLowerCase().includes(q) ||
        (e.descripcion ?? '').toLowerCase().includes(q)
      ) : todos
    );
  }, [busqueda, todos]);

  const handleUnirse = (estudio: Estudio) => {
    Alert.alert(
      'Unirse al estudio',
      `¿Quieres unirte a ${estudio.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Unirse',
          onPress: async () => {
            if (!idUsuario) return;
            setUniendose(estudio.idEstudio);
            try {
              await estudiosService.unirse(idUsuario, estudio.idEstudio);
              router.back();
            } catch {
              Alert.alert('Error', 'No se pudo unir al estudio.');
            } finally {
              setUniendose(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buscar estudio</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Nombre, ciudad..."
          placeholderTextColor={Colors.textMuted}
          value={busqueda}
          onChangeText={setBusqueda}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={item => String(item.idEstudio)}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.iconBox}>
                <Ionicons name="business" size={22} color={Colors.primary} />
              </View>
              <View style={styles.info}>
                <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
                {item.ciudad && <Text style={styles.sub}>{item.ciudad}</Text>}
                {item.descripcion && (
                  <Text style={styles.sub} numberOfLines={1}>{item.descripcion}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={() => handleUnirse(item)}
                disabled={uniendose === item.idEstudio}
                activeOpacity={0.75}
              >
                {uniendose === item.idEstudio ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.joinText}>Unirse</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="business-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>
                {busqueda ? 'Sin resultados para esa búsqueda.' : 'No hay estudios disponibles.'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
