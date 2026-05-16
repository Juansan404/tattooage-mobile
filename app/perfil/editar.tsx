import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../services/api';
import { artistasService } from '../../services/artistas.service';
import { useAuthStore } from '../../store/auth.store';
import { Usuario, PerfilArtista } from '../../types/usuario.types';
import { useColors } from '../../hooks/useColors';

export default function EditarPerfilScreen() {
  const Colors = useColors();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    cancelText: { color: Colors.textSecondary, fontSize: 15, width: 70 },
    title: { fontSize: 16, fontWeight: '700', color: Colors.text },
    saveText: { color: Colors.primary, fontSize: 15, fontWeight: '700', width: 70, textAlign: 'right' },
    form: { padding: 20, gap: 6 },
    avatarSection: { alignItems: 'center', marginBottom: 8, gap: 8 },
    avatarPreview: {
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 2,
      borderColor: Colors.primary,
    },
    avatarPlaceholder: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: Colors.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: Colors.primary,
    },
    avatarEditBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: Colors.primary,
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: Colors.background,
    },
    avatarInitial: { fontSize: 34, fontWeight: '700', color: Colors.primary },
    avatarHint: { fontSize: 12, color: Colors.textMuted },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: Colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginTop: 20,
      marginBottom: 4,
      paddingBottom: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: Colors.border,
    },
    label: {
      fontSize: 12,
      color: Colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 14,
      marginBottom: 4,
    },
    input: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: Colors.text,
    },
    inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    switchLabel: { fontSize: 15, color: Colors.text },
    btn: {
      backgroundColor: Colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 28,
      marginBottom: 16,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  });

  const router = useRouter();
  const { idUsuario, rol } = useAuthStore();

  // Usuario fields
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [telefono, setTelefono] = useState('');

  // PerfilArtista fields
  const [especialidades, setEspecialidades] = useState('');
  const [anosExperiencia, setAnosExperiencia] = useState('');
  const [instagram, setInstagram] = useState('');
  const [precioHora, setPrecioHora] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [disponible, setDisponible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const seleccionarAvatar = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (!resultado.canceled && resultado.assets[0]?.base64) {
      setAvatar(`data:image/jpeg;base64,${resultado.assets[0].base64}`);
    }
  };

  useEffect(() => {
    const cargar = async () => {
      try {
        const requests: Promise<any>[] = [api.get<Usuario>(`/usuarios/${idUsuario}`)];
        if (rol === 'ARTISTA' && idUsuario) {
          requests.push(artistasService.getPerfilById(idUsuario));
        }
        const [userRes, perfilRes] = await Promise.all(requests);
        const u = userRes.data;
        setNombre(u.nombre ?? '');
        setApellidos(u.apellidos ?? '');
        setBio(u.bio ?? '');
        setAvatar(u.avatar ?? '');
        setTelefono((u as any).telefono ?? '');

        if (rol === 'ARTISTA' && perfilRes) {
          const p: PerfilArtista = perfilRes;
          setEspecialidades(p.especialidades ?? '');
          setAnosExperiencia(p.anosExperiencia != null ? String(p.anosExperiencia) : '');
          setInstagram(p.instagram ?? '');
          setPrecioHora(p.precioHora != null ? String(p.precioHora) : '');
          setPortfolioUrl(p.portfolioUrl ?? '');
          setDisponible(p.disponible ?? false);
        }
      } catch {
        Alert.alert('Error', 'No se pudo cargar el perfil.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [idUsuario, rol]);

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio.');
      return;
    }
    try {
      setGuardando(true);
      await api.put(`/usuarios/${idUsuario}`, {
        nombre: nombre.trim(),
        apellidos: apellidos.trim() || null,
        bio: bio.trim() || null,
        avatar: avatar.trim() || null,
        telefono: telefono.trim() || null,
      });
      if (rol === 'ARTISTA' && idUsuario) {
        try {
          const perfilData: Record<string, any> = { disponible };
          if (especialidades.trim()) perfilData.especialidades = especialidades.trim();
          if (anosExperiencia.trim()) perfilData.anosExperiencia = parseInt(anosExperiencia, 10);
          if (instagram.trim()) perfilData.instagram = instagram.trim();
          if (precioHora.trim()) perfilData.precioHora = parseFloat(precioHora);
          if (portfolioUrl.trim()) perfilData.portfolioUrl = portfolioUrl.trim();
          await api.put(`/artistas/${idUsuario}/perfil`, perfilData);
        } catch {
          // silencioso — el perfil principal sí se guardó
        }
      }
      Alert.alert('¡Guardado!', 'Tu perfil ha sido actualizado.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Inténtalo más tarde.');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Editar perfil</Text>
          <TouchableOpacity onPress={handleGuardar} disabled={guardando}>
            {guardando ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.saveText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <TouchableOpacity style={styles.avatarSection} onPress={seleccionarAvatar} activeOpacity={0.8}>
            {avatar.trim() ? (
              <View>
                <Image source={{ uri: avatar.trim() }} style={styles.avatarPreview} />
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={14} color={Colors.white} />
                </View>
              </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {nombre.charAt(0).toUpperCase() || '?'}
                </Text>
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={14} color={Colors.white} />
                </View>
              </View>
            )}
            <Text style={styles.avatarHint}>Toca para cambiar foto</Text>
          </TouchableOpacity>

          {/* ── Datos personales ── */}
          <Text style={styles.sectionTitle}>Datos personales</Text>

          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Tu nombre"
            placeholderTextColor={Colors.textMuted}
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Apellidos</Text>
          <TextInput
            style={styles.input}
            placeholder="Tus apellidos"
            placeholderTextColor={Colors.textMuted}
            value={apellidos}
            onChangeText={setApellidos}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Biografía</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Cuéntanos algo sobre ti..."
            placeholderTextColor={Colors.textMuted}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="+34 600 000 000"
            placeholderTextColor={Colors.textMuted}
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />

          {/* ── Perfil artista ── */}
          {rol === 'ARTISTA' && (
            <>
              <Text style={styles.sectionTitle}>Perfil artista</Text>

              <Text style={styles.label}>Especialidades</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Realismo, Fineline, Blackwork..."
                placeholderTextColor={Colors.textMuted}
                value={especialidades}
                onChangeText={setEspecialidades}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Años de experiencia</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 5"
                placeholderTextColor={Colors.textMuted}
                value={anosExperiencia}
                onChangeText={setAnosExperiencia}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Instagram</Text>
              <TextInput
                style={styles.input}
                placeholder="@tu_usuario"
                placeholderTextColor={Colors.textMuted}
                value={instagram}
                onChangeText={setInstagram}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Precio por hora (€)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 75.00"
                placeholderTextColor={Colors.textMuted}
                value={precioHora}
                onChangeText={setPrecioHora}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Portfolio URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://miportfolio.com"
                placeholderTextColor={Colors.textMuted}
                value={portfolioUrl}
                onChangeText={setPortfolioUrl}
                autoCapitalize="none"
                keyboardType="url"
              />

              <Text style={styles.label}>Disponibilidad</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Disponible para citas</Text>
                <Switch
                  value={disponible}
                  onValueChange={setDisponible}
                  trackColor={{ false: Colors.border, true: Colors.primary + '88' }}
                  thumbColor={disponible ? Colors.primary : Colors.textMuted}
                />
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.btn, guardando && styles.btnDisabled]}
            onPress={handleGuardar}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.btnText}>Guardar cambios</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
