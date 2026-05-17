import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAlertStore, AlertButton } from '../store/alert.store';
import { useColors } from '../hooks/useColors';

export function CustomAlert() {
  const { visible, title, message, buttons, hide } = useAlertStore();
  const Colors = useColors();

  const handlePress = (btn: AlertButton) => {
    hide();
    btn.onPress?.();
  };

  const buttonColor = (style?: AlertButton['style']) => {
    if (style === 'destructive') return '#e94560';
    if (style === 'cancel') return Colors.textMuted;
    return Colors.primary;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={s.backdrop}>
        <View style={[s.card, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
          <Text style={[s.title, { color: Colors.text }]}>{title}</Text>
          {!!message && (
            <Text style={[s.message, { color: Colors.textSecondary }]}>{message}</Text>
          )}
          <View style={[s.divider, { backgroundColor: Colors.border }]} />
          <View style={buttons.length > 2 ? s.buttonsColumn : s.buttonsRow}>
            {buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  s.btn,
                  buttons.length <= 2 && i < buttons.length - 1 && {
                    borderRightWidth: 0.5,
                    borderRightColor: Colors.border,
                  },
                ]}
                onPress={() => handlePress(btn)}
                activeOpacity={0.6}
              >
                <Text style={[
                  s.btnText,
                  { color: buttonColor(btn.style) },
                  btn.style === 'cancel' && s.btnCancel,
                ]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  divider: { height: 0.5 },
  buttonsRow: { flexDirection: 'row' },
  buttonsColumn: { flexDirection: 'column' },
  btn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  btnCancel: {
    fontWeight: '400',
  },
});
