import { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon, Defs, ClipPath, Image as SvgImage, Circle } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { publicacionesService } from '../../../services/publicaciones.service';
import { useColors } from '../../../hooks/useColors';

const { width: SCREEN_W } = Dimensions.get('window');
const IMG_SIZE = SCREEN_W;
const HANDLE_R = 18;

const initPoints = () => {
  const cx = IMG_SIZE / 2, cy = IMG_SIZE / 2;
  const r = IMG_SIZE * 0.32;
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
};

export default function RecortarScreen() {
  const Colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(initPoints());

  const pointsRef = useRef(points);
  useEffect(() => { pointsRef.current = points; }, [points]);

  const activePtIdx = useRef<number | null>(null);
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    publicacionesService.getById(Number(id))
      .then((pub) => setFotoUrl(pub.fotoUrl))
      .catch(() => { Alert.alert('Error', 'No se pudo cargar la imagen.'); router.back(); })
      .finally(() => setLoading(false));
  }, [id]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const idx = pointsRef.current.findIndex(pt =>
        Math.hypot(pt.x - locationX, pt.y - locationY) < HANDLE_R + 8
      );
      if (idx >= 0) {
        activePtIdx.current = idx;
        startPos.current = { ...pointsRef.current[idx] };
        return true;
      }
      return false;
    },
    onMoveShouldSetPanResponder: () => activePtIdx.current !== null,
    onPanResponderMove: (_, gs) => {
      if (activePtIdx.current === null) return;
      setPoints(prev => {
        const next = [...prev];
        next[activePtIdx.current!] = {
          x: Math.max(0, Math.min(IMG_SIZE, startPos.current.x + gs.dx)),
          y: Math.max(0, Math.min(IMG_SIZE, startPos.current.y + gs.dy)),
        };
        return next;
      });
    },
    onPanResponderRelease: () => { activePtIdx.current = null; },
  });

  const addPoint = () => {
    const pts = pointsRef.current;
    let maxDist = -1, insertIdx = 0;
    for (let i = 0; i < pts.length; i++) {
      const next = pts[(i + 1) % pts.length];
      const dist = Math.hypot(next.x - pts[i].x, next.y - pts[i].y);
      if (dist > maxDist) { maxDist = dist; insertIdx = i; }
    }
    const a = pts[insertIdx], b = pts[(insertIdx + 1) % pts.length];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    setPoints(prev => [
      ...prev.slice(0, insertIdx + 1),
      mid,
      ...prev.slice(insertIdx + 1),
    ]);
  };

  const removePoint = () => {
    if (points.length <= 3) {
      Alert.alert('Mínimo 3 puntos', 'No se pueden quitar más puntos.');
      return;
    }
    setPoints(prev => prev.slice(0, -1));
  };

  const handleProbar = () => {
    const normalized = points.map(p => ({ x: p.x / IMG_SIZE, y: p.y / IMG_SIZE }));
    router.replace({
      pathname: `/ar/${id}`,
      params: { puntos: JSON.stringify(normalized) },
    });
  };

  const svgPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  if (loading || !fotoUrl) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#C0392B" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.text }]}>Delimitar tatuaje</Text>
        <TouchableOpacity style={styles.probarBtn} onPress={handleProbar}>
          <Text style={styles.probarBtnText}>Probar</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.hint, { color: Colors.textMuted }]}>
        Arrastra los puntos para rodear el tatuaje
      </Text>

      {/* Área de imagen + puntos */}
      <View style={styles.imageArea} {...panResponder.panHandlers}>
        {/* Imagen tenue de fondo */}
        <Image
          source={{ uri: fotoUrl }}
          style={{ width: IMG_SIZE, height: IMG_SIZE, opacity: 0.3 }}
          resizeMode="cover"
        />

        {/* SVG: imagen recortada + contorno */}
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <ClipPath id="seleccion">
              <Polygon points={svgPoints} />
            </ClipPath>
          </Defs>
          <SvgImage
            href={{ uri: fotoUrl }}
            x={0} y={0}
            width={IMG_SIZE} height={IMG_SIZE}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#seleccion)"
          />
          <Polygon
            points={svgPoints}
            fill="rgba(192,57,43,0.08)"
            stroke="#C0392B"
            strokeWidth={2}
            strokeDasharray="6,4"
          />
          {/* Indicadores de punto medio en cada arista */}
          {points.map((pt, i) => {
            const next = points[(i + 1) % points.length];
            return (
              <Circle
                key={`mid-${i}`}
                cx={(pt.x + next.x) / 2}
                cy={(pt.y + next.y) / 2}
                r={5}
                fill="rgba(192,57,43,0.5)"
                stroke="#C0392B"
                strokeWidth={1}
              />
            );
          })}
        </Svg>

        {/* Handles draggables (visuales, toques gestionados por PanResponder padre) */}
        {points.map((pt, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={[
              styles.handle,
              { left: pt.x - HANDLE_R, top: pt.y - HANDLE_R },
            ]}
          >
            <Text style={styles.handleLabel}>{i + 1}</Text>
          </View>
        ))}
      </View>

      {/* Toolbar */}
      <View style={[styles.toolbar, { borderTopColor: Colors.border }]}>
        <TouchableOpacity
          style={[styles.toolBtn, { backgroundColor: Colors.surface, borderColor: Colors.border }]}
          onPress={removePoint}
        >
          <Ionicons name="remove-circle-outline" size={18} color="#C0392B" />
          <Text style={[styles.toolBtnText, { color: '#C0392B' }]}>Quitar</Text>
        </TouchableOpacity>

        <View style={styles.countBadge}>
          <Text style={[styles.countText, { color: Colors.text }]}>{points.length} puntos</Text>
        </View>

        <TouchableOpacity
          style={[styles.toolBtn, { backgroundColor: Colors.surface, borderColor: Colors.border }]}
          onPress={addPoint}
        >
          <Ionicons name="add-circle-outline" size={18} color="#C0392B" />
          <Text style={[styles.toolBtnText, { color: Colors.text }]}>Añadir</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  probarBtn: {
    backgroundColor: '#C0392B', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8,
  },
  probarBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  hint: { textAlign: 'center', fontSize: 12, paddingBottom: 6 },
  imageArea: { width: IMG_SIZE, height: IMG_SIZE },
  handle: {
    position: 'absolute',
    width: HANDLE_R * 2, height: HANDLE_R * 2, borderRadius: HANDLE_R,
    backgroundColor: '#C0392B', borderWidth: 2.5, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5, shadowRadius: 3, elevation: 5,
  },
  handleLabel: { color: '#fff', fontSize: 10, fontWeight: '800' },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 0.5,
  },
  toolBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
  },
  toolBtnText: { fontSize: 14, fontWeight: '600' },
  countBadge: { alignItems: 'center' },
  countText: { fontSize: 15, fontWeight: '700' },
});
