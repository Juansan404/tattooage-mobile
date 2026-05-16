import { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  Alert,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width: W, height: H } = Dimensions.get('window');
const BASE_SIZE = W * 0.45;

export default function ARLocalScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const router = useRouter();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions({ writeOnly: true });

  const [facing, setFacing] = useState<CameraType>('back');
  const [capturing, setCapturing] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [opacity, setOpacity] = useState(0.85);
  const [rotation, setRotation] = useState(0);

  const viewRef = useRef<View>(null);

  const pan = useRef(
    new Animated.ValueXY({ x: W / 2 - BASE_SIZE / 2, y: H / 2 - BASE_SIZE / 2 })
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => { pan.flattenOffset(); },
      onPanResponderTerminate: () => { pan.flattenOffset(); },
    })
  ).current;

  const handleCapture = async () => {
    if (capturing) return;
    if (!mediaPermission?.granted) {
      const { granted } = await requestMediaPermission();
      if (!granted) {
        Alert.alert('Permiso necesario', 'Necesitamos acceso a la galería para guardar la foto.');
        return;
      }
    }
    try {
      setCapturing(true);
      const uri = await captureRef(viewRef, { format: 'jpg', quality: 0.9 });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Guardado', 'La foto se ha guardado en tu galería.');
    } catch {
      Alert.alert('Error', 'No se pudo guardar la foto.');
    } finally {
      setCapturing(false);
    }
  };

  if (!cameraPermission) return <View style={s.bg} />;

  if (!cameraPermission.granted) {
    return (
      <View style={s.permissionScreen}>
        <Ionicons name="camera-outline" size={64} color="#fff" />
        <Text style={s.permissionText}>Se necesita acceso a la cámara para el modo AR</Text>
        <TouchableOpacity style={s.permissionBtn} onPress={requestCameraPermission}>
          <Text style={s.permissionBtnText}>Conceder permiso</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#aaa' }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!imageUri) {
    return (
      <View style={s.bg}>
        <Text style={{ color: '#fff' }}>No se proporcionó imagen.</Text>
      </View>
    );
  }

  const tattooSize = BASE_SIZE * scale;

  return (
    <View style={s.container}>
      <StatusBar hidden />

      <View style={s.container} ref={viewRef} collapsable={false}>
        <CameraView style={StyleSheet.absoluteFill} facing={facing} />

        <Animated.View
          style={[
            {
              position: 'absolute',
              width: tattooSize,
              height: tattooSize,
              opacity,
              transform: [{ rotate: `${rotation}deg` }],
            },
            pan.getLayout(),
          ]}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri: imageUri }}
            style={{ width: tattooSize, height: tattooSize, borderRadius: 8 }}
            resizeMode="contain"
            pointerEvents="none"
          />
        </Animated.View>
      </View>

      {/* ── Barra superior ── */}
      <View style={s.topBar} pointerEvents="box-none">
        <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={s.topHint}>
          <Text style={s.hintText}>Arrastra para posicionar</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
          <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Rotación ── */}
      <View style={s.rotationBar} pointerEvents="box-none">
        <TouchableOpacity style={s.ctrlBtn} onPress={() => setRotation(r => (r - 15 + 360) % 360)}>
          <Ionicons name="refresh-outline" size={18} color="#fff" style={{ transform: [{ scaleX: -1 }] }} />
        </TouchableOpacity>
        <View style={s.rotLabel}>
          <Text style={s.rotLabelText}>{rotation}°</Text>
        </View>
        <TouchableOpacity style={s.ctrlBtn} onPress={() => setRotation(r => (r + 15) % 360)}>
          <Ionicons name="refresh-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Controles inferiores ── */}
      <View style={s.bottomBar} pointerEvents="box-none">
        <View style={s.controlGroup}>
          <Text style={s.controlLabel}>Opacidad</Text>
          <View style={s.controlRow}>
            <TouchableOpacity style={s.ctrlBtn} onPress={() => setOpacity(o => Math.max(0.2, +(o - 0.1).toFixed(1)))}>
              <Ionicons name="remove" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={s.controlValue}>{Math.round(opacity * 100)}%</Text>
            <TouchableOpacity style={s.ctrlBtn} onPress={() => setOpacity(o => Math.min(1, +(o + 0.1).toFixed(1)))}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={s.captureBtn} onPress={handleCapture} disabled={capturing}>
          {capturing
            ? <ActivityIndicator color="#C0392B" />
            : <View style={s.captureInner} />
          }
        </TouchableOpacity>

        <View style={s.controlGroup}>
          <Text style={s.controlLabel}>Tamaño</Text>
          <View style={s.controlRow}>
            <TouchableOpacity style={s.ctrlBtn} onPress={() => setScale(sc => Math.max(0.3, +(sc - 0.1).toFixed(1)))}>
              <Ionicons name="remove" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={s.controlValue}>{Math.round(scale * 100)}%</Text>
            <TouchableOpacity style={s.ctrlBtn} onPress={() => setScale(sc => Math.min(3, +(sc + 0.1).toFixed(1)))}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#000' },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  topHint: { flex: 1, alignItems: 'center' },
  hintText: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },

  rotationBar: {
    position: 'absolute',
    bottom: 130, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  rotLabel: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20,
  },
  rotLabelText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 48, paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  controlGroup: { alignItems: 'center', gap: 6, width: 110 },
  controlLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ctrlBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  controlValue: { color: '#fff', fontSize: 13, fontWeight: '700', minWidth: 38, textAlign: 'center' },

  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },

  permissionScreen: {
    flex: 1, backgroundColor: '#0D0D0D',
    justifyContent: 'center', alignItems: 'center',
    gap: 16, padding: 32,
  },
  permissionText: { color: '#fff', fontSize: 16, textAlign: 'center', lineHeight: 22 },
  permissionBtn: { backgroundColor: '#C0392B', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  permissionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
