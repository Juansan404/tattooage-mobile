import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuthStore } from '../../store/auth.store';
import { Rol } from '../../types/usuario.types';
import { useColors } from '../../hooks/useColors';

const ROLES: { label: string; value: Rol }[] = [
  { label: 'Cliente', value: 'CLIENTE' },
  { label: 'Artista', value: 'ARTISTA' },
];

export default function RegisterScreen() {
  const Colors = useColors();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 48,
    },
    header: {
      alignItems: 'center',
      marginBottom: 36,
    },
    logo: {
      fontSize: 38,
      fontWeight: '900',
      color: Colors.text,
      letterSpacing: 6,
    },
    logoAccent: {
      fontSize: 38,
      fontWeight: '900',
      color: Colors.primary,
      letterSpacing: 6,
      marginTop: -8,
    },
    subtitle: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginTop: 8,
      letterSpacing: 1,
    },
    form: {
      gap: 8,
    },
    label: {
      fontSize: 12,
      color: Colors.textSecondary,
      marginBottom: 4,
      marginTop: 10,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    input: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: Colors.text,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 10,
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: Colors.text,
    },
    eyeBtn: {
      paddingHorizontal: 14,
    },
    rolRow: {
      flexDirection: 'row',
      gap: 12,
    },
    rolBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: 'center',
      backgroundColor: Colors.surface,
    },
    rolBtnActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    rolBtnText: {
      color: Colors.textSecondary,
      fontWeight: '600',
      fontSize: 14,
    },
    rolBtnTextActive: {
      color: Colors.white,
    },
    button: {
      backgroundColor: Colors.primary,
      borderRadius: 10,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 24,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: Colors.white,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 28,
    },
    footerText: {
      color: Colors.textSecondary,
      fontSize: 14,
    },
    footerLink: {
      color: Colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
  });

  const router = useRouter();
  const register = useAuthStore((s) => s.register);

  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rol, setRol] = useState<Rol>('CLIENTE');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Nombre, email y contraseña son obligatorios.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      await register({ nombre: nombre.trim(), apellidos: apellidos.trim() || undefined, email: email.trim(), password, rol });
      router.replace('/(tabs)/feed');
    } catch (error: any) {
      const mensaje =
        error?.response?.status === 409
          ? 'Ya existe una cuenta con ese email.'
          : 'No se pudo crear la cuenta. Inténtalo más tarde.';
      Alert.alert('Error de registro', mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>TATTOO</Text>
          <Text style={styles.logoAccent}>AGE</Text>
          <Text style={styles.subtitle}>Crea tu cuenta</Text>
        </View>

        <View style={styles.form}>
          {/* Selector de rol */}
          <Text style={styles.label}>Soy...</Text>
          <View style={styles.rolRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.rolBtn, rol === r.value && styles.rolBtnActive]}
                onPress={() => setRol(r.value)}
              >
                <Text style={[styles.rolBtnText, rol === r.value && styles.rolBtnTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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
            placeholder="Tus apellidos (opcional)"
            placeholderTextColor={Colors.textMuted}
            value={apellidos}
            onChangeText={setApellidos}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Contraseña *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={22}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Crear cuenta</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
