import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

// 3 Farklı modumuz olacak
export type ThemeMode = 'light' | 'dark' | 'warm';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
}

// ☀️ Gündüz Modu (Mevcut tasarımımız)
const lightColors: ThemeColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1C1C1E',
  textMuted: '#8E8E93',
  border: '#E5E5EA',
  primary: '#FF9F00',
};

// 🌙 Karanlık Mod (OLED Siyahı)
const darkColors: ThemeColors = {
  background: '#121212',
  card: '#1C1C1E',
  text: '#F2F2F7',
  textMuted: '#AEAEB2',
  border: '#38383A',
  primary: '#FF9F00',
};

// 💡 Gece/Sarı Işık Modu (Göz Yormayan)
const warmColors: ThemeColors = {
  background: '#FDF6E3',
  card: '#FFFBF0',
  text: '#3A3124',
  textMuted: '#A09381',
  border: '#EBE1D1',
  primary: '#D97706',
};

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colors: lightColors,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  // Uygulama açılırken kullanıcının son seçtiği temayı hafızadan çeker
  useEffect(() => {
    AsyncStorage.getItem('app_theme').then((savedTheme) => {
      if (savedTheme === 'dark' || savedTheme === 'warm' || savedTheme === 'light') {
        setThemeState(savedTheme);
      }
    });
  }, []);

  // Temayı değiştirir ve telefona kaydeder
  const setTheme = async (mode: ThemeMode) => {
    setThemeState(mode);
    await AsyncStorage.setItem('app_theme', mode);
  };

  const getColors = () => {
    switch (theme) {
      case 'dark': return darkColors;
      case 'warm': return warmColors;
      default: return lightColors;
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, colors: getColors(), setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};