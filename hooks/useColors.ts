import { useThemeStore } from '../store/theme.store';
import { darkColors, lightColors } from '../constants/colors';

export function useColors() {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? darkColors : lightColors;
}
