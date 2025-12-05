import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Appearance, AppState } from 'react-native';
import { lightColors, darkColors, ColorScheme } from './colors';
import { spacing } from './spacing';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    colors: ColorScheme;
    spacing: typeof spacing;
    mode: ThemeMode;
    isDark: boolean;
    resolvedMode: 'light' | 'dark';
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}


const THEME_STORAGE_KEY = '@app_theme_mode';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [mode, setMode] = useState<ThemeMode>('system');
    const [isLoading, setIsLoading] = useState(true);
    const [systemMode, setSystemMode] = useState<'light' | 'dark'>(() => (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'));

    // Load saved theme on mount
    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
                setMode(savedMode as ThemeMode);
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const appearanceListener = Appearance.addChangeListener(({ colorScheme }) => {
            setSystemMode(colorScheme === 'dark' ? 'dark' : 'light');
        });

        return () => {
            appearanceListener.remove();
        };
    }, []);

    useEffect(() => {
        const handleAppStateChange = (state: string) => {
            if (state === 'active') {
                setSystemMode(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, []);

    const handleSetMode = async (newMode: ThemeMode) => {
        try {
            setMode(newMode);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    const resolvedMode: 'light' | 'dark' = mode === 'system' ? systemMode : mode;

    const isDark = resolvedMode === 'dark';

    const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

    if (isLoading) {
        return null; // Or a loading screen
    }

    const value: ThemeContextType = {
        colors,
        spacing,
        mode,
        isDark,
        resolvedMode,
        setMode: handleSetMode,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};