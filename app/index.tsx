import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import { useColors } from '../hooks/useColors';

export default function Index() {
  const Colors = useColors();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const rootNavState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavState?.key) return; // layout aún no montado
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)/feed');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [rootNavState?.key, isLoading, isAuthenticated]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
