import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'light' | 'dark';

export const lightColors = {
  background:   '#F2ECE1', // Warm sand background matching PBookingsScreen
  surface:      '#FAF7F2', // Warm cream matching PBookingsScreen cards
  surfaceStrong: '#EBE5DA', // Darker cream/parchment
  dark:         '#2E2A24', // Charcoal dark text/accent
  accent:       '#cf4028', // Terracotta
  accentOrange: '#ff4200', 
  clay:         '#D4AF37', // Gold shadow/badge
  clayLight:    '#F7F3EB',
  white:        '#ffffff',
  text:         '#2E2A24', // Charcoal text
  textMuted:    '#7A7062', // Muted brown-grey
  textLight:    '#9C9180',
  textInverse:  '#FFFBF0',
  primary:      '#2E2A24',
  success:      '#3D7055',
  warning:      '#B4781A',
  danger:       '#914141',
  info:         '#3A6073',
  border:       'rgba(46, 42, 36, 0.08)',
  borderStrong: 'rgba(46, 42, 36, 0.16)',
  overlay:      'rgba(46, 42, 36, 0.45)',
  glass:        'rgba(250, 247, 242, 0.85)',
  glassStrong:  'rgba(250, 247, 242, 0.95)',
  tabActive:    '#cf4028',
  tabInactive:  '#9C9180',
  tabBar:       '#FAF7F2',
};

export const darkColors = {
  background:   '#0d0b14', // Deep photographer dark purple background
  surface:      '#1b1726', // Slate purple card
  surfaceStrong: '#141121', // Deeper slate purple container
  dark:         '#0d0b14',
  accent:       '#cf4028', // Terracotta
  accentOrange: '#ff4200',
  clay:         '#141121',
  clayLight:    '#1e1a2d',
  white:        '#ffffff',
  text:         '#FFFBF0', // Warm white text
  textMuted:    'rgba(255, 251, 240, 0.6)', // Muted text
  textLight:    'rgba(255, 251, 240, 0.45)',
  textInverse:  '#2E2A24',
  primary:      '#FFFBF0',
  success:      '#2ecc71',
  warning:      '#f1c40f',
  danger:       '#e74c3c',
  info:         '#3498db',
  border:       'rgba(255, 255, 255, 0.06)',
  borderStrong: 'rgba(255, 255, 255, 0.12)',
  overlay:      'rgba(0, 0, 0, 0.7)',
  glass:        'rgba(27, 23, 38, 0.85)',
  glassStrong:  'rgba(27, 23, 38, 0.95)',
  tabActive:    '#cf4028',
  tabInactive:  'rgba(255, 251, 240, 0.45)',
  tabBar:       '#0d0b14',
};

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: typeof lightColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  colors: lightColors,
  isDark: false,
});

export const usePhotographerTheme = () => useContext(ThemeContext);

export const PhotographerThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('light');

  useEffect(() => {
    (async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('photographer_theme');
        if (storedTheme === 'dark' || storedTheme === 'light') {
          setTheme(storedTheme);
        }
      } catch (e) {
        console.log('Error reading theme from storage:', e);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      await AsyncStorage.setItem('photographer_theme', nextTheme);
    } catch (e) {
      console.log('Error saving theme to storage:', e);
    }
  };

  const colors = theme === 'light' ? lightColors : darkColors;
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};
