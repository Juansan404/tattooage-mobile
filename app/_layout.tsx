import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Animated, Easing, Dimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import * as NavigationBar from 'expo-navigation-bar';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';
import { useLanguageStore } from '../store/language.store';
import { ThemeTransitionContext } from '../context/ThemeTransitionContext';

const DARK_BG  = '#0D0D0D';
const LIGHT_BG = '#F7F7F7';
const H    = Dimensions.get('window').height;
const GRAD = H * 0.32;

export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const { isDark, toggle, restore } = useThemeStore();
  const restoreLang = useLanguageStore((s) => s.restore);

  const slideY      = useRef(new Animated.Value(-(H + GRAD))).current;
  const isRunning   = useRef(false);
  const [curtainColor, setCurtainColor] = useState(DARK_BG);

  useEffect(() => {
    restoreSession();
    restore();
    restoreLang();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setPositionAsync('absolute');
      NavigationBar.setBackgroundColorAsync('#00000000');
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [isDark]);

  const triggerTransition = useCallback(() => {
    if (isRunning.current) return;
    isRunning.current = true;

    const newColor = isDark ? LIGHT_BG : DARK_BG;
    setCurtainColor(newColor);

    slideY.setValue(-(H + GRAD));
    Animated.timing(slideY, {
      toValue: 0,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      toggle();
      Animated.timing(slideY, {
        toValue: H,
        duration: 1200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        slideY.setValue(-(H + GRAD));
        isRunning.current = false;
      });
    });
  }, [isDark, toggle]);

  return (
    <ThemeTransitionContext.Provider value={{ triggerTransition }}>
      <PaperProvider theme={isDark ? MD3DarkTheme : MD3LightTheme}>
        <SafeAreaProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: isDark ? DARK_BG : LIGHT_BG },
              animation: 'fade',
            }}
          />
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 9999,
              transform: [{ translateY: slideY }],
            }}
          >
            <View style={{ flex: 1, backgroundColor: curtainColor }} />
            <LinearGradient
              colors={[curtainColor, curtainColor + 'BB', curtainColor + '55', curtainColor + '00']}
              style={{ position: 'absolute', bottom: -GRAD, left: 0, right: 0, height: GRAD }}
            />
          </Animated.View>
        </SafeAreaProvider>
      </PaperProvider>
    </ThemeTransitionContext.Provider>
  );
}
