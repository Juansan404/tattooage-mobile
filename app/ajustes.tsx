import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeStore } from '../store/theme.store';
import { useColors } from '../hooks/useColors';

export default function AjustesScreen() {
  const router = useRouter();
  const { isDark, toggle } = useThemeStore();
  const Colors = useColors();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: Colors.border,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    section: { marginTop: 24, paddingHorizontal: 16 },
    sectionLabel: {
      fontSize: 11,
      color: Colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: Colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 0.5,
      borderColor: Colors.border,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowText: { fontSize: 15, color: Colors.text, fontWeight: '500' },
    rowSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustes</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Apariencia</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={22}
              color={Colors.primary}
            />
            <View>
              <Text style={styles.rowText}>Tema oscuro</Text>
              <Text style={styles.rowSub}>{isDark ? 'Activado' : 'Desactivado'}</Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggle}
            trackColor={{ false: Colors.border, true: Colors.primary + '88' }}
            thumbColor={isDark ? Colors.primary : Colors.textMuted}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
