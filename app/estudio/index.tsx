import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { artistasService } from '../../services/artistas.service';
import { estudiosService } from '../../services/estudios.service';
import { PerfilArtista } from '../../types/usuario.types';
import { useAuthStore } from '../../store/auth.store';
import { useColors } from '../../hooks/useColors';

export default function MiEstudioScreen() {
  const Colors = useColors();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
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

    cover: { width: '100%', height: 160, backgroundColor: Colors.surface },
    coverPlaceholder: {
      width: '100%',
      height: 160,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
    },

    section: { padding: 16, gap: 8 },
    nombre: { fontSize: 22, fontWeight: '900', color: Colors.text },
    ciudadBadge: {
      alignSelf: 'flex-start',
      backgroundColor: Colors.primary + '22',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    ciudadText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
    descripcion: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
    contactText: { fontSize: 13, color: Colors.text },
    contactLink: { fontSize: 13, color: Colors.primary, textDecorationLine: 'underline' },

    divider: { height: 0.5, backgroundColor: Colors.border, marginHorizontal: 16 },

    abandonBtn: {
      margin: 16,
      backgroundColor: Colors.surfaceLight,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.error + '66',
    },
    abandonText: { color: Colors.error, fontWeight: '700', fontSize: 14 },

    // Sin estudio
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, textAlign: 'center' },
    emptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    buscarBtn: {
      marginTop: 8,
      backgroundColor: Colors.primary,
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: 10,
    },
    buscarText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  });

  const router = useRouter();
  const { idUsuario } = useAuthStore();
  const [perfil, setPerfil] = useState<PerfilArtista | null>(null);
  const [loading, setLoading] = useState(true);
  const [abandonando, setAbandonando] = useState(false);

  const cargar = useCallback(async () => {
    if (!idUsuario) return;
    try {
      const p = await artistasService.getPerfilById(idUsuario);
      setPerfil(p);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [idUsuario]);

  useFocusEffect(useCallback(() => { setLoading(true); cargar(); }, [cargar]));

  const handleAbandonar = () => {
    Alert.alert(
      'Abandonar estudio',
      `¿Seguro que quieres salir de ${perfil?.estudio?.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abandonar',
          style: 'destructive',
          onPress: async () => {
            if (!idUsuario) return;
            setAbandonando(true);
            try {
              await estudiosService.abandonar(idUsuario);
              setPerfil(prev => prev ? { ...prev, estudio: undefined } : prev);
            } catch {
              Alert.alert('Error', 'No se pudo abandonar el estudio.');
            } finally {
              setAbandonando(false);
            }
          },
        },
      ]
    );
  };

  const abrirMapa = () => {
    const est = perfil?.estudio;
    if (!est) return;
    const q = encodeURIComponent(est.localizacion ?? `${est.nombre} ${est.ciudad ?? ''}`);
    Linking.openURL(`https://maps.google.com/?q=${q}`);
  };

  const abrirUrl = (url: string) => Linking.openURL(url.startsWith('http') ? url : `https://${url}`);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const estudio = perfil?.estudio;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi estudio</Text>
        <View style={{ width: 26 }} />
      </View>

      {!estudio ? (
        <View style={styles.center}>
          <Ionicons name="business-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Sin estudio asociado</Text>
          <Text style={styles.emptySub}>
            Únete a un estudio para que tu perfil muestre dónde trabajas y aparezcas en su página.
          </Text>
          <TouchableOpacity style={styles.buscarBtn} onPress={() => router.push('/estudio/buscar')}>
            <Text style={styles.buscarText}>Buscar estudio</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {estudio.fotoPortada ? (
            <Image source={{ uri: estudio.fotoPortada }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="business" size={56} color={Colors.border} />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.nombre}>{estudio.nombre}</Text>
            {estudio.ciudad && (
              <View style={styles.ciudadBadge}>
                <Text style={styles.ciudadText}>{estudio.ciudad}</Text>
              </View>
            )}
            {estudio.descripcion && (
              <Text style={styles.descripcion}>{estudio.descripcion}</Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            {(estudio.direccion || estudio.localizacion) && (
              <TouchableOpacity style={styles.contactRow} onPress={abrirMapa} activeOpacity={0.7}>
                <Ionicons name="location-outline" size={18} color={Colors.primary} />
                <Text style={styles.contactLink}>
                  {estudio.direccion ?? 'Ver en mapa'}{estudio.ciudad ? `, ${estudio.ciudad}` : ''}
                </Text>
              </TouchableOpacity>
            )}
            {estudio.telefono && (
              <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${estudio.telefono}`)} activeOpacity={0.7}>
                <Ionicons name="call-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.contactText}>{estudio.telefono}</Text>
              </TouchableOpacity>
            )}
            {estudio.email && (
              <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${estudio.email}`)} activeOpacity={0.7}>
                <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.contactLink}>{estudio.email}</Text>
              </TouchableOpacity>
            )}
            {estudio.web && (
              <TouchableOpacity style={styles.contactRow} onPress={() => abrirUrl(estudio.web!)} activeOpacity={0.7}>
                <Ionicons name="globe-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.contactLink}>{estudio.web}</Text>
              </TouchableOpacity>
            )}
            {estudio.instagram && (
              <TouchableOpacity style={styles.contactRow} onPress={() => abrirUrl(`https://instagram.com/${estudio.instagram!.replace('@', '')}`)} activeOpacity={0.7}>
                <Ionicons name="logo-instagram" size={18} color={Colors.textSecondary} />
                <Text style={styles.contactLink}>@{estudio.instagram!.replace('@', '')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.abandonBtn}
            onPress={handleAbandonar}
            disabled={abandonando}
            activeOpacity={0.75}
          >
            {abandonando ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <Text style={styles.abandonText}>Abandonar este estudio</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
