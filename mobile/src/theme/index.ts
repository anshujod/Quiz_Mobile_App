export const colors = {
    // Brand
    primary: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#312e81',
        950: '#1e1b4b',
    },
    secondary: {
        200: '#e9d5ff',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
    },
    tertiary: {
        400: '#f472b6',
        500: '#ec4899',
    },
    
    // Backgrounds & Surface
    background: '#020617', // slate-950
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceLight: 'rgba(255, 255, 255, 0.1)',
    
    // Text
    text: {
        primary: '#f8fafc', // slate-50
        secondary: '#94a3b8', // slate-400
        muted: '#64748b', // slate-500
    },

    // Status
    success: {
        light: '#bbf7d0', // green-200
        DEFAULT: '#22c55e', // green-500
        bg: 'rgba(34, 197, 94, 0.2)',
    },
    error: {
        light: '#fecaca', // red-200
        DEFAULT: '#ef4444', // red-500
        bg: 'rgba(239, 68, 68, 0.2)',
    },
    warning: {
        DEFAULT: '#eab308', // yellow-500
        bg: 'rgba(234, 179, 8, 0.1)',
        text: '#facc15', // yellow-400
    },
    
    // Borders
    border: 'rgba(255, 255, 255, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.2)',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
};

export const typography = {
    sizes: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 32,
        hero: 48,
    },
    // Weights are defined by font family in RN typically, using system fonts here
    weights: {
        normal: '400' as const,
        medium: '500' as const,
        bold: '700' as const,
        extrabold: '800' as const,
    }
};

export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
};

export const theme = {
    colors,
    spacing,
    typography,
    borderRadius,
};
