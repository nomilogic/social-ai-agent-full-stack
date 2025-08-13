
import { useState, useEffect } from 'react';
import { themeManager, ThemeColors } from '../lib/theme';

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemeColors>(themeManager.getCurrentTheme());

  useEffect(() => {
    const unsubscribe = themeManager.subscribe(setCurrentTheme);
    return unsubscribe;
  }, []);

  const changeTheme = (themeName: string) => {
    themeManager.setTheme(themeName);
  };

  const availableThemes = themeManager.getAvailableThemes();

  return {
    currentTheme,
    changeTheme,
    availableThemes
  };
};
