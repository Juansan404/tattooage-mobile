import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColors } from '../../hooks/useColors';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../services/api';

type Step = 'email' | 'code' | 'done';

export default function ForgotPasswordScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 48 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 12 },
    backBtn: { padding: 4 },
    title: { fontSize: 22, fontWeight: '800', color: Colors.text },
    subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 32 },
    label: {
      fontSize: 13, color: Colors.textSecondary, marginBottom: 4, marginTop: 16,
      letterSpacing: 0.5, textTransform: 'uppercase',
    },
    input: {
      backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
      borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14,
      fontSize: 15, color: Colors.text,
    },
    passContainer: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: Colors.surface, borderWidth: 1,
      borderColor: Colors.border, borderRadius: 10,
    },
    passInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.text },
    eyeBtn: { paddingHorizontal: 14 },
    button: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
    successBox: { alignItems: 'center', paddingTop: 48, gap: 16 },
    successIcon: { marginBottom: 8 },
    successTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'center' },
    successSub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    backLink: { marginTop: 32, alignItems: 'center' },
    backLinkText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  });

  const handleSendCode = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setStep('code');
    } catch {
      Alert.alert('Error', t('forgot_err_generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', t('forgot_err_mismatch'));
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', t('forgot_err_short'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        codigo: code.trim(),
        password,
      });
      setStep('done');
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      if (msg?.includes('Código') || msg?.includes('expirado')) {
        Alert.alert('Error', t('forgot_err_code'));
      } else {
        Alert.alert('Error', t('forgot_err_generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <View style={[s.container, { paddingHorizontal: 28 }]}>
        <View style={s.successBox}>
          <Ionicons name="checkmark-circle" size={72} color={Colors.primary} style={s.successIcon} />
          <Text style={s.successTitle}>{t('forgot_success')}</Text>
          <Text style={s.successSub}>{t('forgot_success_sub')}</Text>
        </View>
        <TouchableOpacity style={s.backLink} onPress={() => router.replace('/(auth)/login')}>
          <Text style={s.backLinkText}>{t('forgot_back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={Colors.text} />
          </TouchableOpacity>
          <Text style={s.title}>{t('forgot_title')}</Text>
        </View>

        {step === 'email' && (
          <>
            <Text style={s.subtitle}>{t('forgot_subtitle')}</Text>
            <Text style={s.label}>{t('forgot_email_label')}</Text>
            <TextInput
              style={s.input}
              placeholder="tu@email.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              color={Colors.text}
            />
            <TouchableOpacity
              style={[s.button, (!email.trim() || loading) && s.buttonDisabled]}
              onPress={handleSendCode}
              disabled={!email.trim() || loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={s.buttonText}>{t('forgot_send')}</Text>
              }
            </TouchableOpacity>
          </>
        )}

        {step === 'code' && (
          <>
            <Text style={s.subtitle}>{t('forgot_sent_subtitle')}</Text>

            <Text style={s.label}>{t('forgot_code_label')}</Text>
            <TextInput
              style={s.input}
              placeholder="123456"
              placeholderTextColor={Colors.textMuted}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              color={Colors.text}
            />

            <Text style={s.label}>{t('forgot_new_pass_label')}</Text>
            <View style={s.passContainer}>
              <TextInput
                style={s.passInput}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                color={Colors.text}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(v => !v)}>
                <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={s.label}>{t('forgot_confirm_pass_label')}</Text>
            <View style={s.passContainer}>
              <TextInput
                style={s.passInput}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                color={Colors.text}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
                <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[s.button, (!code.trim() || !password || loading) && s.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={!code.trim() || !password || loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={s.buttonText}>{t('forgot_change')}</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
