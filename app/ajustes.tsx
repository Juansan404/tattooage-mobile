import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeStore } from '../store/theme.store';
import { useLanguageStore } from '../store/language.store';
import { useColors } from '../hooks/useColors';
import { useTranslation } from '../hooks/useTranslation';
import { LANGUAGES, Language } from '../i18n/translations';
import { useThemeTransition } from '../context/ThemeTransitionContext';

export default function AjustesScreen() {
  const router = useRouter();
  const { isDark } = useThemeStore();
  const { triggerTransition } = useThemeTransition();
  const { language, setLanguage } = useLanguageStore();
  const Colors = useColors();
  const { t } = useTranslation();
  const [langModal, setLangModal] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === language);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 0.5, borderBottomColor: Colors.border,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    section: { marginTop: 24, paddingHorizontal: 16, gap: 1 },
    sectionLabel: {
      fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase',
      letterSpacing: 1, marginBottom: 8,
    },
    row: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 14,
      borderWidth: 0.5, borderColor: Colors.border,
    },
    rowFirst: { borderRadius: 12, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    rowLast: { borderRadius: 12, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopWidth: 0 },
    rowSingle: { borderRadius: 12 },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowText: { fontSize: 15, color: Colors.text, fontWeight: '500' },
    rowSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    flagText: { fontSize: 22 },

    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: Colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18,
      paddingBottom: 32, borderTopWidth: 0.5, borderColor: Colors.border,
    },
    sheetHandle: {
      width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2,
      alignSelf: 'center', marginTop: 10, marginBottom: 12,
    },
    sheetTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, paddingHorizontal: 20, marginBottom: 8 },
    langOption: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14 },
    langFlag: { fontSize: 24 },
    langName: { fontSize: 16, color: Colors.text, fontWeight: '500', flex: 1 },
    langActive: { color: Colors.primary },
  });

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('settings_title')}</Text>
      </View>

      {/* Cuenta */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>{t('settings_account')}</Text>
        <TouchableOpacity style={[s.row, s.rowSingle]} onPress={() => router.push('/perfil/editar')} activeOpacity={0.75}>
          <View style={s.rowLeft}>
            <Ionicons name="create-outline" size={22} color={Colors.primary} />
            <Text style={s.rowText}>{t('settings_edit_profile')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Apariencia */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>{t('settings_appearance')}</Text>
        <View style={[s.row, s.rowSingle]}>
          <View style={s.rowLeft}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={Colors.primary} />
            <View>
              <Text style={s.rowText}>{t('settings_dark_mode')}</Text>
              <Text style={s.rowSub}>{isDark ? t('settings_dark_on') : t('settings_dark_off')}</Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={triggerTransition}
            trackColor={{ false: Colors.border, true: Colors.primary + '88' }}
            thumbColor={isDark ? Colors.primary : Colors.textMuted}
          />
        </View>
      </View>

      {/* Idioma */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>{t('settings_language')}</Text>
        <TouchableOpacity style={[s.row, s.rowSingle]} onPress={() => setLangModal(true)} activeOpacity={0.75}>
          <View style={s.rowLeft}>
            <Ionicons name="globe-outline" size={22} color={Colors.primary} />
            <View>
              <Text style={s.rowText}>{t('settings_language_label')}</Text>
              <Text style={s.rowSub}>{t(`lang_${language}` as any)}</Text>
            </View>
          </View>
          <View style={s.rowRight}>
            <Text style={s.flagText}>{currentLang?.flag}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal selector de idioma */}
      <Modal visible={langModal} transparent animationType="slide" onRequestClose={() => setLangModal(false)}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setLangModal(false)} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>{t('settings_language')}</Text>
          {LANGUAGES.map(({ code, flag }) => (
            <TouchableOpacity
              key={code}
              style={s.langOption}
              onPress={() => { setLanguage(code as Language); setLangModal(false); }}
            >
              <Text style={s.langFlag}>{flag}</Text>
              <Text style={[s.langName, language === code && s.langActive]}>
                {t(`lang_${code}` as any)}
              </Text>
              {language === code && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
