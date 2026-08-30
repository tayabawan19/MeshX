import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useThemeStore } from './src/store/useThemeStore';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { OfflineBanner } from './src/components/common/OfflineBanner';

export default function App() {
  const themeMode = useThemeStore((state) => state.themeMode);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
        <OfflineBanner />
        <AppNavigator />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
