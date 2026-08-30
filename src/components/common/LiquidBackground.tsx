import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

interface LiquidBackgroundProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export const LiquidBackground: React.FC<LiquidBackgroundProps> = ({
  children,
  style,
  contentContainerStyle,
}) => {
  const { palette } = useThemeStore();

  return (
    <View style={[styles.container, { backgroundColor: palette.background }, style]}>
      {children && (
        <View style={[styles.contentContainer, contentContainerStyle]}>{children}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
});
