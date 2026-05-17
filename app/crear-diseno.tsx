import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, PanResponder,
  Alert, TextInput, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import { Svg, Path, Defs, Pattern, Rect, G } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColors } from '../hooks/useColors';
import { useAuthStore } from '../store/auth.store';
import { disenosLocalesService } from '../services/disenos-locales.service';

interface Point  { x: number; y: number; }
interface Stroke { path: string; color: string; width: number; erase: boolean; }

const PALETTE = [
  // Neutros
  '#000000', '#3a3a3a', '#7a7a7a', '#c0c0c0', '#FFFFFF',
  // Rojos / naranjas
  '#8b0000', '#C0392B', '#e74c3c', '#e67e22', '#f39c12',
  // Amarillos / verdes
  '#f1c40f', '#27ae60', '#1a5c2a', '#16a085', '#1abc9c',
  // Azules / morados
  '#1a3a6c', '#2980b9', '#3498db', '#6b006b', '#9b59b6',
  // Rosas
  '#e91e8c', '#ff69b4',
  // Marrones / piel
  '#8b4513', '#a0522d', '#d2691e', '#f4a460',
];
const SIZES   = [2, 6, 14];

function pts2path(pts: Point[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y} L${pts[0].x + 0.1},${pts[0].y}`;
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q${pts[i].x},${pts[i].y} ${mx},${my}`;
  }
  d += ` L${pts[pts.length - 1].x},${pts[pts.length - 1].y}`;
  return d;
}

export default function CrearDisenoScreen() {
  const Colors = useColors();
  const router = useRouter();
  const { idUsuario } = useAuthStore();

  const canvasRef  = useRef<View>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const liveRef    = useRef<Point[]>([]);

  // Refs para que PanResponder siempre lea el valor actual
  const colorRef  = useRef('#000000');
  const sizeRef   = useRef(6);
  const eraserRef = useRef(false);

  const [strokes,  setStrokes]  = useState<Stroke[]>([]);
  const [livePath, setLivePath] = useState('');
  const [color,    setColor]    = useState('#000000');
  const [size,     setSize]     = useState(6);
  const [eraser,   setEraser]   = useState(false);
  const [modal,    setModal]    = useState(false);
  const [nombre,   setNombre]   = useState('');
  const [saving,   setSaving]   = useState(false);

  const setColorSync  = (c: string)  => { colorRef.current  = c;     setColor(c);  };
  const setSizeSync   = (sz: number) => { sizeRef.current   = sz;    setSize(sz);  };
  const setEraserSync = (v: boolean) => { eraserRef.current = v;     setEraser(v); };

  const activeWidth = eraser ? size * 4 : size;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: ({ nativeEvent: { locationX: x, locationY: y } }) => {
        liveRef.current = [{ x, y }];
        setLivePath(pts2path(liveRef.current));
      },
      onPanResponderMove: ({ nativeEvent: { locationX: x, locationY: y } }) => {
        liveRef.current = [...liveRef.current, { x, y }];
        setLivePath(pts2path(liveRef.current));
      },
      onPanResponderRelease: () => {
        if (liveRef.current.length > 0) {
          const isEraser = eraserRef.current;
          const w = isEraser ? sizeRef.current * 4 : sizeRef.current;
          const st: Stroke = {
            path:  pts2path(liveRef.current),
            color: isEraser ? 'none' : colorRef.current,
            width: w,
            erase: isEraser,
          };
          strokesRef.current = [...strokesRef.current, st];
          setStrokes([...strokesRef.current]);
        }
        liveRef.current = [];
        setLivePath('');
      },
    })
  ).current;

  const undo = () => {
    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokes([...strokesRef.current]);
  };

  const clear = () =>
    Alert.alert('Limpiar lienzo', '¿Borrar todo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => {
        strokesRef.current = [];
        setStrokes([]);
      }},
    ]);

  const guardar = async () => {
    if (!nombre.trim() || saving || !idUsuario) return;
    setSaving(true);
    try {
      if (!canvasRef.current) throw new Error('Canvas no disponible');
      const uri = await captureRef(canvasRef.current, { format: 'png', quality: 1, result: 'tmpfile' });
      await disenosLocalesService.guardar(uri, nombre.trim(), idUsuario);
      setModal(false);
      Alert.alert('Guardado', `"${nombre.trim()}" guardado en Elementos Creados.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el diseño.');
    } finally {
      setSaving(false);
    }
  };

  const s = styles(Colors);
  const canEdit = strokes.length > 0;

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Nuevo diseño</Text>
        <TouchableOpacity
          style={[s.saveBtn, !canEdit && s.saveBtnDisabled]}
          onPress={() => { setNombre(''); setModal(true); }}
          disabled={!canEdit}
        >
          <Ionicons name="save-outline" size={17} color="#fff" />
          <Text style={s.saveBtnText}>Guardar</Text>
        </TouchableOpacity>
      </View>

      {/* Canvas */}
      <View style={s.canvasWrapper}>
        {/* Patrón de cuadrícula: indica transparencia, NO se captura */}
        <View style={[StyleSheet.absoluteFill, s.checkerContainer]} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern id="checker" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <Rect x="0" y="0" width="8"  height="8"  fill="#c8c8c8" />
                <Rect x="8" y="0" width="8"  height="8"  fill="#e8e8e8" />
                <Rect x="0" y="8" width="8"  height="8"  fill="#e8e8e8" />
                <Rect x="8" y="8" width="8"  height="8"  fill="#c8c8c8" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#checker)" />
          </Svg>
        </View>

        {/* Lienzo capturado: fondo transparente → PNG con alpha */}
        <View
          ref={canvasRef}
          style={[StyleSheet.absoluteFill, s.canvas]}
          collapsable={false}
          {...panResponder.panHandlers}
        >
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <G>
              {strokes.map((st, i) =>
                st.erase ? (
                  <Path
                    key={i}
                    d={st.path}
                    stroke="black"
                    strokeWidth={st.width}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    // @ts-ignore
                    style={{ mixBlendMode: 'destination-out' }}
                  />
                ) : (
                  <Path
                    key={i}
                    d={st.path}
                    stroke={st.color}
                    strokeWidth={st.width}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )
              )}
              {livePath ? (
                eraser ? (
                  <Path
                    d={livePath}
                    stroke="rgba(80,80,80,0.35)"
                    strokeWidth={activeWidth}
                    strokeDasharray="6,4"
                    fill="none"
                    strokeLinecap="round"
                  />
                ) : (
                  <Path
                    d={livePath}
                    stroke={color}
                    strokeWidth={activeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )
              ) : null}
            </G>
          </Svg>
        </View>
      </View>

      {/* Barra de herramientas */}
      <View style={s.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.palette}>
          {PALETTE.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                s.colorDot,
                { backgroundColor: c },
                c === color && !eraser && s.colorDotActive,
                c === '#FFFFFF' && { borderColor: Colors.border },
              ]}
              onPress={() => { setColorSync(c); setEraserSync(false); }}
            />
          ))}
        </ScrollView>

        <View style={s.toolRow}>
          <View style={s.sizesRow}>
            {SIZES.map((sz) => (
              <TouchableOpacity
                key={sz}
                style={[s.sizeBtn, size === sz && !eraser && s.sizeBtnActive]}
                onPress={() => { setSizeSync(sz); setEraserSync(false); }}
              >
                <View style={{
                  width: sz * 2.2, height: sz * 2.2, borderRadius: sz,
                  backgroundColor: eraser ? Colors.textMuted : color,
                }} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.actions}>
            <TouchableOpacity
              style={[s.actionBtn, eraser && s.actionBtnActive]}
              onPress={() => setEraserSync(!eraserRef.current)}
            >
              <Ionicons
                name={eraser ? 'ellipse' : 'ellipse-outline'}
                size={20}
                color={eraser ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[s.actionLabel, eraser && { color: Colors.primary }]}>Borrador</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={undo} disabled={!canEdit}>
              <Ionicons name="arrow-undo-outline" size={20} color={canEdit ? Colors.textSecondary : Colors.textMuted} />
              <Text style={[s.actionLabel, !canEdit && { color: Colors.textMuted }]}>Deshacer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={clear} disabled={!canEdit}>
              <Ionicons name="trash-outline" size={20} color={canEdit ? Colors.error : Colors.textMuted} />
              <Text style={[s.actionLabel, { color: canEdit ? Colors.error : Colors.textMuted }]}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal: nombre del diseño */}
      <Modal visible={modal} transparent animationType="fade" onRequestClose={() => setModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Nombre del diseño</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Ej: Dragón japonés"
              placeholderTextColor={Colors.textMuted}
              value={nombre}
              onChangeText={setNombre}
              autoFocus
              maxLength={50}
              returnKeyType="done"
              onSubmitEditing={guardar}
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalBtnCancel} onPress={() => setModal(false)}>
                <Text style={{ color: Colors.text, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtnSave, (!nombre.trim() || saving) && { opacity: 0.5 }]}
                onPress={guardar}
                disabled={!nombre.trim() || saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: '700' }}>Guardar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = (Colors: ReturnType<typeof import('../hooks/useColors').useColors>) =>
  StyleSheet.create({
    container:       { flex: 1, backgroundColor: Colors.background },
    header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
    title:           { fontSize: 17, fontWeight: '700', color: Colors.text },
    saveBtn:         { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText:     { color: '#fff', fontWeight: '700', fontSize: 13 },

    canvasWrapper:    { flex: 1, margin: 12, borderRadius: 12, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
    checkerContainer: { margin: 12, borderRadius: 12 },
    canvas:           { backgroundColor: 'transparent' },

    toolbar:         { backgroundColor: Colors.surface, borderTopWidth: 0.5, borderTopColor: Colors.border, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14, gap: 12 },
    palette:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, paddingHorizontal: 4 },
    colorDot:        { width: 30, height: 30, borderRadius: 15, borderWidth: 2.5, borderColor: 'transparent' },
    colorDotActive:  { borderColor: Colors.primary, transform: [{ scale: 1.15 }] },

    toolRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sizesRow:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
    sizeBtn:         { width: 42, height: 42, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    sizeBtnActive:   { backgroundColor: Colors.primary + '28' },

    actions:         { flexDirection: 'row', gap: 4 },
    actionBtn:       { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 2 },
    actionBtnActive: { backgroundColor: Colors.primary + '22' },
    actionLabel:     { fontSize: 10, color: Colors.textSecondary },

    modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalBox:        { width: '100%', backgroundColor: Colors.background, borderRadius: 16, padding: 24, gap: 16 },
    modalTitle:      { fontSize: 17, fontWeight: '700', color: Colors.text, textAlign: 'center' },
    modalInput:      { backgroundColor: Colors.surfaceLight, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.text },
    modalBtns:       { flexDirection: 'row', gap: 10 },
    modalBtnCancel:  { flex: 1, backgroundColor: Colors.surfaceLight, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    modalBtnSave:    { flex: 1, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  });
