import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  borderRadius?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, borderRadius = 20 }) => {
  const palette = useThemeStore((state) => state.palette);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.glassBackground,
          borderColor: palette.glassBorder,
          borderRadius,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
});
