import { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, StyleSheet,
  TouchableOpacity, PanResponder, Dimensions,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Defs, ClipPath, Image as SvgImage, Polygon } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { publicacionesService } from '../../../services/publicaciones.service';
import { useColors } from '../../../hooks/useColors';

const { width: SCREEN_W } = Dimensions.get('window');
const IMG_SIZE = SCREEN_W;

interface Pt { x: number; y: number; }

function pts2path(pts: Pt[], close = false): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q${pts[i].x},${pts[i].y} ${mx},${my}`;
  }
  d += ` L${pts[pts.length - 1].x},${pts[pts.length - 1].y}`;
  if (close) d += ' Z';
  return d;
}

function subsample(pts: Pt[], max: number): Pt[] {
  if (pts.length <= max) return pts;
  const step = pts.length / max;
  return Array.from({ length: max }, (_, i) => pts[Math.floor(i * step)]);
}

export default function RecortarScreen() {
  const Colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const liveRef  = useRef<Pt[]>([]);
  const [livePath, setLivePath] = useState('');
  const [shape,    setShape]    = useState<Pt[] | null>(null);

  useEffect(() => {
    publicacionesService.getById(Number(id))
      .then((pub) => setFotoUrl(pub.fotoUrl))
      .catch(() => { Alert.alert('Error', 'No se pudo cargar la imagen.'); router.back(); })
      .finally(() => setLoading(false));
  }, [id]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: ({ nativeEvent: { locationX: x, locationY: y } }) => {
        liveRef.current = [{ x, y }];
        setShape(null);
        setLivePath(pts2path(liveRef.current));
      },
      onPanResponderMove: ({ nativeEvent: { locationX: x, locationY: y } }) => {
        liveRef.current = [...liveRef.current, { x, y }];
        setLivePath(pts2path(liveRef.current, true));
      },
      onPanResponderRelease: () => {
        if (liveRef.current.length < 8) {
          Alert.alert('Trazo muy corto', 'Dibuja una forma más grande rodeando el tatuaje.');
          liveRef.current = [];
          setLivePath('');
          return;
        }
        const sampled = subsample(liveRef.current, 80);
        setShape(sampled);
        liveRef.current = [];
        setLivePath('');
      },
      onPanResponderTerminate: () => {
        liveRef.current = [];
        setLivePath('');
      },
    })
  ).current;

  const handleRedibujar = () => { setShape(null); setLivePath(''); liveRef.current = []; };

  const handleProbar = () => {
    if (!shape) return;
    const normalized = shape.map(p => ({ x: p.x / IMG_SIZE, y: p.y / IMG_SIZE }));
    router.replace({ pathname: `/ar/${id}`, params: { puntos: JSON.stringify(normalized) } });
  };

  const shapeSvg = shape ? shape.map(p => `${p.x},${p.y}`).join(' ') : '';
  const shapePath = shape ? pts2path(shape, true) : '';

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
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: Colors.text }]}>Delimitar tatuaje</Text>
        <TouchableOpacity
          style={[s.probarBtn, !shape && { opacity: 0.4 }]}
          onPress={handleProbar}
          disabled={!shape}
        >
          <Text style={s.probarBtnText}>Probar en RA</Text>
        </TouchableOpacity>
      </View>

      <Text style={[s.hint, { color: Colors.textMuted }]}>
        {shape
          ? 'Forma lista — pulsa "Probar en RA" o vuelve a dibujar'
          : 'Dibuja el contorno del tatuaje con el dedo de un solo trazo'}
      </Text>

      {/* Área de dibujo */}
      <View style={s.imageArea} {...panResponder.panHandlers}>
        <Image
          source={{ uri: fotoUrl }}
          style={{ width: IMG_SIZE, height: IMG_SIZE, opacity: shape ? 0.18 : 0.42 }}
          resizeMode="cover"
        />

        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Imagen recortada con la forma final */}
          {shape && (
            <>
              <Defs>
                <ClipPath id="contorno">
                  <Polygon points={shapeSvg} />
                </ClipPath>
              </Defs>
              <SvgImage
                href={{ uri: fotoUrl }}
                x={0} y={0}
                width={IMG_SIZE} height={IMG_SIZE}
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#contorno)"
              />
              {/* Borde de la forma */}
              <Path
                d={shapePath}
                fill="rgba(192,57,43,0.06)"
                stroke="#C0392B"
                strokeWidth={2}
                strokeDasharray="6,4"
              />
            </>
          )}

          {/* Trazo en vivo */}
          {livePath ? (
            <Path
              d={livePath}
              fill="rgba(192,57,43,0.08)"
              stroke="#C0392B"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>
      </View>

      {/* Toolbar */}
      <View style={[s.toolbar, { borderTopColor: Colors.border }]}>
        <TouchableOpacity
          style={[s.toolBtn, { backgroundColor: Colors.surface, borderColor: Colors.border }]}
          onPress={handleRedibujar}
        >
          <Ionicons name="refresh-outline" size={18} color={Colors.text} />
          <Text style={[s.toolBtnText, { color: Colors.text }]}>Redibujar</Text>
        </TouchableOpacity>

        <View style={s.statusBadge}>
          {shape
            ? <Ionicons name="checkmark-circle" size={32} color="#2ecc71" />
            : <Ionicons name="pencil-outline"   size={32} color={Colors.textMuted} />
          }
        </View>

        <TouchableOpacity
          style={[s.toolBtn, { backgroundColor: Colors.surface, borderColor: Colors.border }, !shape && { opacity: 0.4 }]}
          onPress={handleProbar}
          disabled={!shape}
        >
          <Ionicons name="camera-outline" size={18} color="#C0392B" />
          <Text style={[s.toolBtnText, { color: '#C0392B' }]}>Probar en RA</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  probarBtn: {
    backgroundColor: '#C0392B', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8,
  },
  probarBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  hint: { textAlign: 'center', fontSize: 12, paddingBottom: 6, paddingHorizontal: 20 },
  imageArea: { width: IMG_SIZE, height: IMG_SIZE },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 0.5,
  },
  toolBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  toolBtnText:  { fontSize: 13, fontWeight: '600' },
  statusBadge:  { alignItems: 'center', justifyContent: 'center' },
});
