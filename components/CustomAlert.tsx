import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
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
    if (style === 'cancel') return Colors.textSecondary;
    return Colors.primary;
  };

  const isColumn = buttons.length > 2;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={hide}>
        <Pressable style={[s.card, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
          <Text style={[s.title, { color: Colors.text }]}>{title}</Text>
          {!!message && (
            <Text style={[s.message, { color: Colors.textSecondary }]}>{message}</Text>
          )}
          <View style={[s.divider, { backgroundColor: Colors.border }]} />
          <View style={isColumn ? s.buttonsColumn : s.buttonsRow}>
            {buttons.map((btn, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  s.btn,
                  isColumn && s.btnColumn,
                  !isColumn && i < buttons.length - 1 && {
                    borderRightWidth: 0.5,
                    borderRightColor: Colors.border,
                  },
                  isColumn && i > 0 && { borderTopWidth: 0.5, borderTopColor: Colors.border },
                  pressed && { backgroundColor: Colors.surfaceLight },
                ]}
                onPress={() => handlePress(btn)}
              >
                <Text style={[
                  s.btnText,
                  { color: buttonColor(btn.style) },
                  btn.style === 'cancel' && s.btnCancel,
                ]}>
                  {btn.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
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
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 6,
    borderRadius: 16,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  divider: { height: 0.5 },
  buttonsRow: { flexDirection: 'row', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: 'hidden' },
  buttonsColumn: { flexDirection: 'column', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: 'hidden' },
  btn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnColumn: {
    flex: 0,
    paddingVertical: 15,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  btnCancel: {
    fontWeight: '400',
  },
});
