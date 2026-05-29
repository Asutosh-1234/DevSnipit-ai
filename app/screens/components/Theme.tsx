import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export interface ColorScheme {
  background: string;
  cardBackground: string;
  text: string;
  subtext: string;
  border: string;
  primary: string;
  primaryLight: string;
  accent: string;
  success: string;
  danger: string;
  inputBackground: string;
  statusbar: 'light' | 'dark' | 'auto';
}

export const Colors = {
  light: {
    background: '#f8fafc',
    cardBackground: '#ffffff',
    text: '#0f172a',
    subtext: '#475569',
    border: '#e2e8f0',
    primary: '#0891b2',
    primaryLight: '#ecfeff',
    accent: '#7c3aed',
    success: '#10b981',
    danger: '#ef4444',
    inputBackground: '#f1f5f9',
    statusbar: 'dark' as const,
  },
  dark: {
    background: '#0f172a',
    cardBackground: '#1e293b',
    text: '#f8fafc',
    subtext: '#94a3b8',
    border: '#334155',
    primary: '#22d3ee',
    primaryLight: '#083344',
    accent: '#a78bfa',
    success: '#34d399',
    danger: '#f87171',
    inputBackground: '#0f172a',
    statusbar: 'light' as const,
  },
  amoled: {
    background: '#000000',
    cardBackground: '#121214',
    text: '#ffffff',
    subtext: '#a1a1aa',
    border: '#27272a',
    primary: '#06b6d4',
    primaryLight: '#083344',
    accent: '#8b5cf6',
    success: '#10b981',
    danger: '#ef4444',
    inputBackground: '#18181b',
    statusbar: 'light' as const,
  }
};

export type ThemeType = 'light' | 'dark' | 'amoled';

interface ThemeContextProps {
  theme: ThemeType;
  colors: ColorScheme;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'dark',
  colors: Colors.dark,
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('dark');

  useEffect(() => {
    // Load theme from preference
    AsyncStorage.getItem('APP_THEME').then((savedTheme) => {
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'amoled') {
        setThemeState(savedTheme);
      }
    });
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem('APP_THEME', newTheme);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const colors = Colors[theme];

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
