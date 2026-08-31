import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOffline(typeof navigator !== 'undefined' && !navigator.onLine);
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }
      return;
    }

    try {
      const unsubscribe = NetInfo.addEventListener((state) => {
        setIsOffline(state.isConnected === false || state.isInternetReachable === false);
      });

      return () => unsubscribe();
    } catch (e) {
      // Fallback
    }
  }, []);

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.content}>
        <WifiOff size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.text}>No internet connection. Waiting for network...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#C62828',
    paddingBottom: 6,
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
