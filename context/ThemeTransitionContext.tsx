import { createContext, useContext } from 'react';

interface ThemeTransitionContextValue {
  triggerTransition: () => void;
}

export const ThemeTransitionContext = createContext<ThemeTransitionContextValue>({
  triggerTransition: () => {},
});

export const useThemeTransition = () => useContext(ThemeTransitionContext);
