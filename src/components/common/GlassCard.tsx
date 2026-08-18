import React from 'react';
import { ClayCard } from './ClayCard';
import { ViewStyle } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  borderRadius?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, borderRadius = 28 }) => {
  return (
    <ClayCard style={style} borderRadius={borderRadius}>
      {children}
    </ClayCard>
  );
};
