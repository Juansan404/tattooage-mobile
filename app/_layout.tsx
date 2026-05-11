import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';

export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const { isDark, restore } = useThemeStore();

  useEffect(() => {
    restoreSession();
    restore();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setPositionAsync('absolute');
      NavigationBar.setBackgroundColorAsync('#00000000');
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [isDark]);

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: isDark ? '#0D0D0D' : '#F7F7F7' },
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}
