import { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';
import { useColors } from '../hooks/useColors';

const LOGO_DARK  = require('../assets/logo.png');
const LOGO_LIGHT = require('../assets/logo_black.png');
const MIN_MS = 1600;

export default function Index() {
  const Colors       = useColors();
  const { isDark }   = useThemeStore();
  const router       = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const rootNavState = useRootNavigationState();

  const spin    = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.7)).current;
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    // Esconde el splash nativo en cuanto este componente monta
    SplashScreen.hideAsync();

    // Fade-in + spring
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotación continua
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    if (!rootNavState?.key) return;
    if (isLoading) return;

    const elapsed   = Date.now() - mountedAt.current;
    const remaining = Math.max(0, MIN_MS - elapsed);

    const timer = setTimeout(() => {
      router.replace(isAuthenticated ? '/(tabs)/feed' : '/(auth)/login');
    }, remaining);

    return () => clearTimeout(timer);
  }, [rootNavState?.key, isLoading, isAuthenticated]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.background,
    }}>
      <Animated.View style={{
        opacity,
        transform: [{ rotate }, { scale }],
      }}>
        <Image
          source={isDark ? LOGO_DARK : LOGO_LIGHT}
          style={{ width: 100, height: 100, borderRadius: 50 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}
