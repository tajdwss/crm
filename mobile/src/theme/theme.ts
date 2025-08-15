import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3F51B5',
    primaryContainer: '#E8EAF6',
    secondary: '#00BCD4',
    secondaryContainer: '#E0F2F1',
    tertiary: '#FF9800',
    tertiaryContainer: '#FFF3E0',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F7FA',
    background: '#F5F7FA',
    error: '#F44336',
    errorContainer: '#FFEBEE',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onSurface: '#333333',
    onSurfaceVariant: '#666666',
    onBackground: '#333333',
    outline: '#E0E0E0',
    outlineVariant: '#F0F0F0',
  },
  roundness: 12,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  headingLarge: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 36,
  },
  headingMedium: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  headingSmall: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 14,
  },
};