export const lightColors = {
    primary: '#0A5ED7',
    secondary: '#0B4DA6',
    success: '#1F7A4D',
    warning: '#E6A700',
    error: '#D64545',
    background: '#FFFFFF',
    surface: '#F5F8FF',
    text: '#1B2A4B',
    textSecondary: '#5B6E99',
    border: '#D6DEEF',
} as const;

export const darkColors = {
    primary: '#4C8DFF',
    secondary: '#3665C9',
    success: '#37B27D',
    warning: '#F2C23A',
    error: '#F26969',
    background: '#0E1626',
    surface: '#16213D',
    text: '#EEF3FF',
    textSecondary: '#9BA9CC',
    border: '#2A3B63',
} as const;

export type ColorScheme = typeof lightColors | typeof darkColors;