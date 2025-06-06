'use client'
import { useEffect } from "react";
import { useThemeStore } from "../../Zustand_Store/ThemeStore";

export default function ThemeInitializer() {
  const {setDarkMode} = useThemeStore();

  useEffect(() => {
    const savedMode = localStorage.getItem("isDarkMode");
    if (savedMode !== null) {
        console.log(savedMode)
      setDarkMode(JSON.parse(savedMode));
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, [setDarkMode]);

  return null;
} 