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
import { useColors } from '../../hooks/useColors';

export default function LoginScreen() {
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
      marginBottom: 48,
    },
    logo: {
      fontSize: 42,
      fontWeight: '900',
      color: Colors.text,
      letterSpacing: 6,
    },
    logoAccent: {
      fontSize: 42,
      fontWeight: '900',
      color: Colors.primary,
      letterSpacing: 6,
      marginTop: -10,
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
      fontSize: 13,
      color: Colors.textSecondary,
      marginBottom: 4,
      marginTop: 12,
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
      marginTop: 32,
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
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor, introduce tu email y contraseña.');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      router.replace('/(tabs)/feed');
    } catch (error: any) {
      const mensaje =
        error?.response?.status === 401
          ? 'Email o contraseña incorrectos.'
          : 'No se pudo conectar. Inténtalo más tarde.';
      Alert.alert('Error de acceso', mensaje);
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
        {/* Logo / Título */}
        <View style={styles.header}>
          <Text style={styles.logo}>TATTOO</Text>
          <Text style={styles.logoAccent}>AGE</Text>
          <Text style={styles.subtitle}>Tu comunidad de tatuajes</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
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

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
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
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Registro */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerLink}>Regístrate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

