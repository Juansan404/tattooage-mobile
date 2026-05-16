import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { authService } from '../services/auth.service';

const POLL_INTERVAL = 15000;

export default function EsperaAprobacionScreen() {
  const Colors = useColors();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [estado, setEstado] = useState<'PENDIENTE' | 'APROBADO' | 'RECHAZADO'>('PENDIENTE');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!email) return;

    const check = async () => {
      try {
        const res = await authService.checkEstado(email);
        if (res.estadoRegistro === 'ACTIVO') {
          setEstado('APROBADO');
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else if (res.estadoRegistro === 'RECHAZADO') {
          setEstado('RECHAZADO');
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // Sin red, seguimos esperando
      }
    };

    check();
    intervalRef.current = setInterval(check, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [email]);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    title: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'center', marginTop: 32 },
    subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 22 },
    email: { color: Colors.primary, fontWeight: '600' },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, marginHorizontal: 4 },
    dotsRow: { flexDirection: 'row', marginTop: 32 },
    btn: {
      marginTop: 40, backgroundColor: Colors.primary,
      paddingHorizontal: 32, paddingVertical: 14,
      borderRadius: 12,
    },
    btnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
    rejectedBox: {
      marginTop: 24, backgroundColor: Colors.surface, borderRadius: 12,
      padding: 20, borderWidth: 1, borderColor: Colors.border,
    },
    rejectedText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  });

  if (estado === 'APROBADO') {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.inner}>
          <Text style={{ fontSize: 64 }}>🎉</Text>
          <Text style={s.title}>¡Cuenta aprobada!</Text>
          <Text style={s.subtitle}>Ya puedes iniciar sesión y empezar a compartir tu trabajo en TattooAge.</Text>
          <TouchableOpacity style={s.btn} onPress={() => router.replace('/(auth)/login')}>
            <Text style={s.btnText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (estado === 'RECHAZADO') {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.inner}>
          <Text style={{ fontSize: 64 }}>❌</Text>
          <Text style={s.title}>Solicitud no aprobada</Text>
          <View style={s.rejectedBox}>
            <Text style={s.rejectedText}>
              Tu solicitud para registrarte como artista no ha sido aprobada.{'\n\n'}
              Si crees que es un error, contacta con nosotros.
            </Text>
          </View>
          <TouchableOpacity style={s.btn} onPress={() => router.replace('/(auth)/login')}>
            <Text style={s.btnText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.inner}>
        {/* Placeholder — aquí irá la animación del logo */}
        <Text style={{ fontSize: 64 }}>⏳</Text>

        <Text style={s.title}>Solicitud en revisión</Text>
        <Text style={s.subtitle}>
          Tu solicitud como artista está siendo revisada por el administrador.{'\n\n'}
          Te notificaremos en <Text style={s.email}>{email}</Text> cuando sea aprobada.
        </Text>

        <View style={s.dotsRow}>
          <View style={s.dot} />
          <View style={[s.dot, { opacity: 0.5 }]} />
          <View style={[s.dot, { opacity: 0.2 }]} />
        </View>

        <TouchableOpacity style={[s.btn, { marginTop: 48, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]}
          onPress={() => router.replace('/(auth)/login')}>
          <Text style={[s.btnText, { color: Colors.textSecondary }]}>Volver al login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
