import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  FlatList, Alert, Modal, Dimensions, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as FileSystem from 'expo-file-system/legacy';
import { useColors } from '../../hooks/useColors';
import { useAuthStore } from '../../store/auth.store';
import { disenosLocalesService, DisenoLocal } from '../../services/disenos-locales.service';
import { publicacionesService } from '../../services/publicaciones.service';

const { width: W } = Dimensions.get('window');
const GAP  = 2;
const TILE = (W - GAP * 2) / 3;

export default function ElementosCreadosScreen() {
  const Colors  = useColors();
  const router  = useRouter();
  const { rol, idUsuario } = useAuthStore();
  const esArtista = rol === 'ARTISTA' || rol === 'ADMIN';

  const [disenos, setDisenos]   = useState<DisenoLocal[]>([]);
  const [loading, setLoading]   = useState(true);
  const [preview, setPreview]   = useState<DisenoLocal | null>(null);

  // Estado del modal de publicación
  const [showPublish, setShowPublish]     = useState(false);
  const [publishTarget, setPublishTarget] = useState<DisenoLocal | null>(null);
  const [descripcion, setDescripcion]     = useState('');
  const [publicando, setPublicando]       = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      setDisenos(await disenosLocalesService.listar());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const confirmarEliminar = (item: DisenoLocal) => {
    Alert.alert(item.nombre, '¿Eliminar este diseño?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          await disenosLocalesService.eliminar(item.id);
          setDisenos((prev) => prev.filter((d) => d.id !== item.id));
          if (preview?.id === item.id) setPreview(null);
        },
      },
    ]);
  };

  const abrirPublicar = () => {
    setPublishTarget(preview);
    setDescripcion('');
    setPreview(null);
    setShowPublish(true);
  };

  const handlePublicar = async () => {
    if (!publishTarget || !idUsuario) return;
    try {
      setPublicando(true);
      // Leer el PNG local y convertirlo a base64
      const b64 = await FileSystem.readAsStringAsync(publishTarget.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const fotoUrl = `data:image/png;base64,${b64}`;
      await publicacionesService.crear({
        usuario: { idUsuario },
        fotoUrl,
        descripcion: descripcion.trim() || undefined,
      });
      setShowPublish(false);
      Alert.alert('Publicado', 'Tu diseño ya está visible en el feed.');
    } catch {
      Alert.alert('Error', 'No se pudo publicar el diseño.');
    } finally {
      setPublicando(false);
    }
  };

  const s = styles(Colors);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Elementos Creados</Text>
        <TouchableOpacity
          onPress={() => router.push('/crear-diseno')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : disenos.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="brush-outline" size={64} color={Colors.textMuted} />
          <Text style={s.emptyTitle}>Sin diseños todavía</Text>
          <Text style={s.emptySub}>Crea tu primer diseño con el lienzo de dibujo.</Text>
          <TouchableOpacity style={s.createBtn} onPress={() => router.push('/crear-diseno')}>
            <Text style={s.createBtnText}>Crear diseño</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={disenos}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={{ gap: GAP }}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setPreview(item)}
              onLongPress={() => confirmarEliminar(item)}
            >
              <Image source={{ uri: item.uri }} style={s.tile} resizeMode="cover" />
            </TouchableOpacity>
          )}
        />
      )}

      {/* ── Modal previsualización ── */}
      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={s.previewOverlay}>
          <TouchableOpacity style={s.previewClose} onPress={() => setPreview(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {preview && (
            <>
              <Text style={s.previewName}>{preview.nombre}</Text>
              <Image source={{ uri: preview.uri }} style={s.previewImg} resizeMode="contain" />
              <Text style={s.previewDate}>
                {new Date(preview.creadoEn).toLocaleDateString('es-ES', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </Text>
              <View style={s.previewActions}>
                <TouchableOpacity
                  style={s.previewArBtn}
                  onPress={() => {
                    const uri = preview.uri;
                    setPreview(null);
                    router.push({ pathname: '/ar/local', params: { imageUri: uri } });
                  }}
                >
                  <Ionicons name="camera-outline" size={18} color="#fff" />
                  <Text style={s.previewBtnText}>Probar RA</Text>
                </TouchableOpacity>

                {esArtista && (
                  <TouchableOpacity style={s.previewPublishBtn} onPress={abrirPublicar}>
                    <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                    <Text style={s.previewBtnText}>Publicar</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={s.previewDelete} onPress={() => confirmarEliminar(preview)}>
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* ── Modal publicar ── */}
      <Modal visible={showPublish} transparent animationType="slide" onRequestClose={() => setShowPublish(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={s.publishOverlay}>
            <View style={s.publishSheet}>
              <View style={s.publishHeader}>
                <Text style={s.publishTitle}>Publicar diseño</Text>
                <TouchableOpacity onPress={() => setShowPublish(false)}>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
                {/* Miniatura */}
                {publishTarget && (
                  <Image
                    source={{ uri: publishTarget.uri }}
                    style={s.publishThumb}
                    resizeMode="contain"
                  />
                )}

                <View>
                  <Text style={s.fieldLabel}>Descripción (opcional)</Text>
                  <TextInput
                    style={[s.textArea, { color: Colors.text, borderColor: Colors.border, backgroundColor: Colors.surface }]}
                    placeholder="Describe tu diseño..."
                    placeholderTextColor={Colors.textMuted}
                    value={descripcion}
                    onChangeText={setDescripcion}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[s.publishBtn, publicando && { opacity: 0.6 }]}
                onPress={handlePublicar}
                disabled={publicando}
              >
                {publicando
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                      <Text style={s.publishBtnText}>Publicar en el feed</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = (Colors: ReturnType<typeof import('../../hooks/useColors').useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 10,
      borderBottomWidth: 0.5, borderBottomColor: Colors.border,
    },
    title: { fontSize: 17, fontWeight: '700', color: Colors.text },

    tile: { width: TILE, height: TILE, backgroundColor: Colors.surface },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    emptySub:   { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
    createBtn:  { marginTop: 8, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
    createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // Preview modal
    previewOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
      justifyContent: 'center', alignItems: 'center', padding: 16,
    },
    previewClose:  { position: 'absolute', top: 48, right: 20, padding: 8 },
    previewName:   { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    previewImg:    { width: W - 32, height: W - 32, borderRadius: 12 },
    previewDate:   { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 10 },
    previewActions: { flexDirection: 'row', gap: 10, marginTop: 24, alignItems: 'center' },
    previewArBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: 'rgba(255,255,255,0.18)',
      paddingVertical: 10, borderRadius: 8,
    },
    previewPublishBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: 'rgba(46,204,113,0.85)',
      paddingVertical: 10, borderRadius: 8,
    },
    previewDelete: {
      width: 42, height: 42, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(220,60,60,0.85)',
    },
    previewBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

    // Publish modal
    publishOverlay: {
      flex: 1, justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    publishSheet: {
      backgroundColor: Colors.background,
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      padding: 20, gap: 16,
      maxHeight: '85%',
    },
    publishHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    publishTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    publishThumb: {
      width: '100%', height: 180, borderRadius: 12,
      backgroundColor: Colors.surface,
    },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    textArea: {
      borderWidth: 1, borderRadius: 10,
      padding: 12, fontSize: 14, minHeight: 80,
      textAlignVertical: 'top',
    },
    publishBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: '#2ecc71',
      paddingVertical: 14, borderRadius: 12,
    },
    publishBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
