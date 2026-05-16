import { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore } from '../../store/theme.store';
import { useLanguageStore } from '../../store/language.store';
import { useColors } from '../../hooks/useColors';
import { useTranslation } from '../../hooks/useTranslation';
import { LANGUAGES, Language } from '../../i18n/translations';
import { useThemeTransition } from '../../context/ThemeTransitionContext';

export default function LoginScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const { isDark } = useThemeStore();
  const { triggerTransition } = useThemeTransition();
  const { language, setLanguage } = useLanguageStore();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialOpen, setDialOpen] = useState(false);
  const [itemsTop, setItemsTop] = useState(90);

  const triggerRef = useRef<View>(null);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(LANGUAGES.map(() => new Animated.Value(0))).current;

  const openDial = () => {
    triggerRef.current?.measure((_x, _y, _w, h, _pageX, pageY) => {
      setItemsTop(pageY + h + 4);
    });
    setDialOpen(true);
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ...itemAnims.map((anim, i) =>
        Animated.timing(anim, { toValue: 1, duration: 200, delay: i * 45, useNativeDriver: true })
      ),
    ]).start();
  };

  const closeDial = (afterClose?: () => void) => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ...itemAnims.map((anim) =>
        Animated.timing(anim, { toValue: 0, duration: 120, useNativeDriver: true })
      ),
    ]).start(() => {
      setDialOpen(false);
      afterClose?.();
    });
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', t('login_err_empty'));
      return;
    }
    try {
      setLoading(true);
      await login(email.trim(), password);
      router.replace('/(tabs)/feed');
    } catch (error: any) {
      const status = error?.response?.status;
      const estado = error?.response?.data?.estadoRegistro;
      if (status === 403 && estado === 'PENDIENTE') {
        const pendingEmail = error?.response?.data?.email ?? email.trim();
        router.replace({ pathname: '/espera-aprobacion', params: { email: pendingEmail } });
        return;
      }
      if (status === 403 && estado === 'RECHAZADO') {
        Alert.alert('Cuenta rechazada', 'Tu solicitud de artista no fue aprobada. Contacta con nosotros si crees que es un error.');
        return;
      }
      const msg = status === 401 ? t('login_err_credentials') : t('login_err_network');
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const currentLangEntry = LANGUAGES.find(l => l.code === language);
  const logoSrc = isDark
    ? require('../../assets/logo_black.png')
    : require('../../assets/logo.png');

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48 },

    topBar: {
      flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
      gap: 2, paddingHorizontal: 12, paddingTop: 52, paddingBottom: 4,
    },
    iconBtn: { padding: 8 },
    flagText: { fontSize: 24 },

    header: { alignItems: 'center', marginBottom: 48 },
    logo: { fontSize: 42, fontWeight: '900', color: Colors.text, letterSpacing: 6 },
    logoAccent: { fontSize: 42, fontWeight: '900', color: Colors.primary, letterSpacing: 6, marginTop: -10 },
    subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, letterSpacing: 1 },

    form: { gap: 8 },
    label: {
      fontSize: 13, color: Colors.textSecondary, marginBottom: 4, marginTop: 12,
      letterSpacing: 0.5, textTransform: 'uppercase',
    },
    input: {
      backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
      borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14,
      fontSize: 15, color: Colors.text,
    },
    passwordContainer: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: Colors.surface, borderWidth: 1,
      borderColor: Colors.border, borderRadius: 10,
    },
    passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.text },
    eyeBtn: { paddingHorizontal: 14 },
    button: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
    forgotRow: { alignItems: 'center', marginTop: 12 },
    forgotLink: { color: Colors.textSecondary, fontSize: 13 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
    footerText: { color: Colors.textSecondary, fontSize: 14 },
    footerLink: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  });

  const bgSrc = isDark
    ? require('../../assets/darkmode_background.jpg')
    : require('../../assets/lightmode_background.jpg');

  return (
    <ImageBackground source={bgSrc} style={s.container} resizeMode="cover">
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <View style={s.topBar}>
        {/* Toggle de tema */}
        <TouchableOpacity style={s.iconBtn} onPress={triggerTransition}>
          <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Selector de idioma — speed-dial hacia abajo */}
        <View ref={triggerRef} collapsable={false}>
          <TouchableOpacity style={s.iconBtn} onPress={openDial}>
            <Text style={s.flagText}>{currentLangEntry?.flag ?? '🌐'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Image source={logoSrc} style={{ width: 96, height: 96, marginBottom: 8 }} resizeMode="contain" />
          <Text style={s.logo}>{t('login_title_1')}</Text>
          <Text style={s.logoAccent}>{t('login_title_2')}</Text>
          <Text style={s.subtitle}>{t('login_subtitle')}</Text>
        </View>

        <View style={s.form}>
          <Text style={s.label}>{t('login_email')}</Text>
          <TextInput
            style={s.input}
            placeholder="tu@email.com"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={s.label}>{t('login_password')}</Text>
          <View style={s.passwordContainer}>
            <TextInput
              style={s.passwordInput}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={s.eyeBtn}
              onPress={() => setShowPassword(v => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.button, loading && s.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={s.buttonText}>{t('login_button')}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={s.forgotRow} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={s.forgotLink}>{t('login_forgot')}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>{t('login_no_account')} </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={s.footerLink}>{t('login_register')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Speed-dial modal — abre hacia abajo desde el icono */}
      <Modal transparent visible={dialOpen} animationType="none" onRequestClose={() => closeDial()}>
        {/* Backdrop */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)', opacity: backdropAnim }]}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => closeDial()} />
        </Animated.View>

        {/* Items hacia abajo desde el triggerRef */}
        <View style={{ position: 'absolute', top: itemsTop, right: 16 }}>
          {LANGUAGES.map(({ code, flag }, i) => (
            <Animated.View
              key={code}
              style={{
                opacity: itemAnims[i],
                transform: [{ translateY: itemAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }],
                flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
                gap: 10, marginBottom: 6,
              }}
            >
              {/* Label */}
              <View style={{
                backgroundColor: Colors.surface,
                paddingHorizontal: 12, paddingVertical: 6,
                borderRadius: 8,
                shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
                elevation: 3,
              }}>
                <Text style={{
                  fontSize: 14,
                  color: language === code ? Colors.primary : Colors.text,
                  fontWeight: language === code ? '700' : '400',
                }}>
                  {t(`lang_${code}` as any)}
                </Text>
              </View>

              {/* Mini flag button */}
              <TouchableOpacity
                onPress={() => closeDial(() => setLanguage(code as Language))}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: language === code ? Colors.primary + '22' : Colors.surface,
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
                  elevation: 4,
                }}
              >
                <Text style={{ fontSize: 22 }}>{flag}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Modal>
    </KeyboardAvoidingView>
    </ImageBackground>
  );
}
