import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedLiquidGradientProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  duration?: number;
  customColors?: [string, string];
  borderRadius?: number;
}

export const AnimatedLiquidGradient: React.FC<AnimatedLiquidGradientProps> = ({
  children,
  style,
  customColors,
  borderRadius = 0,
}) => {
  const colors = customColors || (['#5865F2', '#4752C4'] as [string, string]);

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius }]}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
});
