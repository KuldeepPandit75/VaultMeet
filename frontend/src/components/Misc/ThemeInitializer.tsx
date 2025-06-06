'use client'

import { useEffect } from "react";
import { useThemeStore } from "../../Zustand_Store/ThemeStore";

// Constants
const STORAGE_KEY = "isDarkMode";

// Components
const ThemeInitializer = () => {
  const { setDarkMode } = useThemeStore();

  // Effects
  useEffect(() => {
    const savedMode = localStorage.getItem(STORAGE_KEY);
    if (savedMode !== null) {
      setDarkMode(JSON.parse(savedMode));
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, [setDarkMode]);

  return null;
};

// Exports
export default ThemeInitializer; 