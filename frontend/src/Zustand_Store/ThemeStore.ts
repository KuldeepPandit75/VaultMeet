'use client'
import { create } from "zustand";

interface ThemeStore {
    isDarkMode: boolean;
    primaryAccentColor: string;
    secondaryAccentColor: string;
    setDarkMode: (mode: boolean) => void;
    toggleDarkMode: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
    isDarkMode: true, // Always start with a constant value!
    primaryAccentColor: "#AF8D86",
    secondaryAccentColor: "#55917F",
    setDarkMode: (mode) => set({ isDarkMode: mode }),
    toggleDarkMode: () => set((state) => {
        const newDarkMode = !state.isDarkMode;
        if (typeof window !== "undefined") {
            localStorage.setItem("isDarkMode", JSON.stringify(newDarkMode));
        }
        return { isDarkMode: newDarkMode };
    }),
}));