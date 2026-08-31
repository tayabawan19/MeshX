import 'react-native-gesture-handler';
import React from 'react';
import { View, StyleSheet } from 'react-native';
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
      <View style={styles.root}>
        <SafeAreaProvider style={styles.root}>
          <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
          <OfflineBanner />
          <AppNavigator />
        </SafeAreaProvider>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
